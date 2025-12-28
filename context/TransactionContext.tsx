import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';
import * as api from '../lib/api/transactions';
import { Transaction } from '../lib/types';
import { checkBudgetExceeded } from '../utils/notifications';
import { checkNetworkStatus } from '../hooks/useNetworkStatus';
import { TransactionCache } from '../utils/offlineQueue';
export { ICON_MAP, getCategoryIconName } from '../lib/constants';
export type { Transaction };

type TransactionContextType = {
    transactions: Transaction[];
    recentTransactions: Transaction[];
    loading: boolean;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    applyFilters: (filters: { search: string, type: string }) => void;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
    refreshTransactions: () => Promise<void>;
    totals: {
        income: number;
        expense: number;
        balance: number;
    };
    deleteTransaction: (id: string) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) => Promise<void>;
    isOfflineMode: boolean;
};

const TransactionContext = createContext<TransactionContextType>({
    transactions: [],
    recentTransactions: [],
    loading: false,
    hasMore: false,
    loadMore: async () => { },
    applyFilters: () => { },
    addTransaction: async () => { },
    refreshTransactions: async () => { },
    deleteTransaction: async () => { },
    updateTransaction: async () => { },
    totals: { income: 0, expense: 0, balance: 0 },
    isOfflineMode: false,
});

export function useTransactions() {
    return useContext(TransactionContext);
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [aggregates, setAggregates] = useState({ income: 0, expense: 0, balance: 0 });
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [filters, setFilters] = useState({ search: '', type: 'All' });

    const { user } = useAuth();
    const {
        isOnline,
        addTransactionOffline,
        updateTransactionOffline,
        deleteTransactionOffline,
        getCachedTransactions,
        refreshCache,
        pendingCount,
    } = useOffline();

    // Refs to prevent stale closures
    const filtersRef = useRef(filters);
    const pageRef = useRef(page);
    const loadingRef = useRef(loading);
    const lastPendingCount = useRef(pendingCount);

    useEffect(() => { filtersRef.current = filters; }, [filters]);
    useEffect(() => { pageRef.current = page; }, [page]);
    useEffect(() => { loadingRef.current = loading; }, [loading]);

    // Update offline mode (debounced)
    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsOfflineMode(!isOnline);
        }, 100);
        return () => clearTimeout(timeout);
    }, [isOnline]);

    // Calculate aggregates from cached data
    // Matches server-side logic: income + borrowed = total in, expense + lent = total out
    const calculateLocalAggregates = useCallback(async () => {
        const cached = await getCachedTransactions();
        const income = cached
            .filter(t => t.type === 'income' || t.type === 'borrowed')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = cached
            .filter(t => t.type === 'expense' || t.type === 'lent')
            .reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, balance: income - expense };
    }, [getCachedTransactions]);

    const fetchAggregates = useCallback(async () => {
        if (!user) return;

        if (!isOnline) {
            const localAggregates = await calculateLocalAggregates();
            setAggregates(localAggregates);
            return;
        }

        try {
            const stats = await api.fetchBalanceStatsApi(user.id);
            setAggregates(stats);
        } catch (error) {
            console.error('Error fetching aggregates:', error);
            const localAggregates = await calculateLocalAggregates();
            setAggregates(localAggregates);
        }
    }, [user, isOnline, calculateLocalAggregates]);

    const fetchRecent = useCallback(async () => {
        if (!user) return;

        if (!isOnline) {
            const cached = await getCachedTransactions();
            setRecentTransactions(cached.slice(0, 5));
            return;
        }

        try {
            const { data } = await api.fetchTransactionsApi(user.id, 0, 5);
            setRecentTransactions(data);
        } catch (error) {
            console.error('Error fetching recent:', error);
            const cached = await getCachedTransactions();
            setRecentTransactions(cached.slice(0, 5));
        }
    }, [user, isOnline, getCachedTransactions]);

    const fetchTransactions = useCallback(async (reset = false, newFilters = filtersRef.current) => {
        if (!user) return;
        if (loadingRef.current && !reset) return;

        setLoading(true);

        // STAGE 1: Cache-First Strategy (Immediate UI Feedback)
        try {
            // Load cache immediately to show something to the user
            const cached = await getCachedTransactions();

            // If we have cached data, show it immediately
            if (cached && cached.length > 0 && reset) {
                let filteredData = cached;
                if (newFilters.search) {
                    const searchLower = newFilters.search.toLowerCase();
                    filteredData = filteredData.filter(t =>
                        t.title.toLowerCase().includes(searchLower) ||
                        t.category.toLowerCase().includes(searchLower)
                    );
                }
                if (newFilters.type && newFilters.type !== 'All') {
                    filteredData = filteredData.filter(t =>
                        t.type === newFilters.type.toLowerCase()
                    );
                }

                setTransactions(filteredData);

                // Also update aggregates from cache immediately
                const localAggregates = await calculateLocalAggregates();
                setAggregates(localAggregates);

                // If filters are empty, this counts as "recent" too
                if (newFilters.search === '' && newFilters.type === 'All') {
                    setRecentTransactions(filteredData.slice(0, 5));
                }
            }
        } catch (e) {
            console.log('[TX] Cache load error (non-critical):', e);
        }

        // STAGE 2: Network Sync (Fresh Data)
        try {
            const online = await checkNetworkStatus();

            if (!online) {
                // We've already loaded cache above, just stop loading
                setHasMore(false);
                return;
            }

            const currentPage = reset ? 0 : pageRef.current;

            // Execute independent requests in parallel for speed
            const queries: Promise<any>[] = [
                api.fetchTransactionsApi(user.id, currentPage, api.PAGE_SIZE, newFilters)
            ];

            // Only fetch stats if resetting (initial load or refresh)
            if (reset && newFilters.search === '' && newFilters.type === 'All') {
                queries.push(api.fetchBalanceStatsApi(user.id));
            }

            const results = await Promise.all(queries);
            const txResponse = results[0];
            const statsResponse = results[1]; // undefined if not requested

            const { data } = txResponse;

            if (reset) {
                setTransactions(data);
                setPage(1);

                if (newFilters.search === '' && newFilters.type === 'All') {
                    setRecentTransactions(data.slice(0, 5));
                }

                // Update cache in background
                InteractionManager.runAfterInteractions(() => {
                    refreshCache(data);
                });
            } else {
                setTransactions(prev => [...prev, ...data]);
                setPage(prev => prev + 1);
            }

            // Update stats if we fetched them
            if (statsResponse) {
                setAggregates(statsResponse);
            }

            setHasMore(data.length === api.PAGE_SIZE);

        } catch (error) {
            console.error('Error fetching transactions:', error);
            // If API fails, we rely on the cache loaded in Stage 1
            if (!reset) {
                // If this was a "load more" and it failed, we might want to alert or just stop
                setHasMore(false);
            }
        } finally {
            setLoading(false);
        }
    }, [user, getCachedTransactions, refreshCache, calculateLocalAggregates]);

    const applyFilters = useCallback((newFilters: { search: string, type: string }) => {
        setFilters(newFilters);
        fetchTransactions(true, newFilters);
    }, [fetchTransactions]);

    // Initial load
    useEffect(() => {
        if (user) {
            InteractionManager.runAfterInteractions(() => {
                fetchTransactions(true);
            });
        }
    }, [user]);

    // Refresh when sync completes (only if pending count decreased)
    useEffect(() => {
        if (user && isOnline && pendingCount < lastPendingCount.current && lastPendingCount.current > 0) {
            InteractionManager.runAfterInteractions(() => {
                fetchTransactions(true, { search: '', type: 'All' });
            });
        }
        lastPendingCount.current = pendingCount;
    }, [pendingCount, isOnline, user]);

    const addTransaction = useCallback(async (newTransaction: Omit<Transaction, 'id'>) => {
        if (!user) return;

        const online = await checkNetworkStatus();

        // Optimistically update UI first
        const tempTransaction: Transaction = {
            ...newTransaction,
            id: `temp_${Date.now()}`,
        };

        setTransactions(prev => [tempTransaction, ...prev]);
        setRecentTransactions(prev => [tempTransaction, ...prev.slice(0, 4)]);

        // Optimistically update aggregates based on transaction type
        // Income and Borrowed increase balance, Expense and Lent decrease balance
        if (newTransaction.type === 'income' || newTransaction.type === 'borrowed') {
            setAggregates(prev => ({
                ...prev,
                income: prev.income + newTransaction.amount,
                balance: prev.balance + newTransaction.amount,
            }));
        } else if (newTransaction.type === 'expense' || newTransaction.type === 'lent') {
            setAggregates(prev => ({
                ...prev,
                expense: prev.expense + newTransaction.amount,
                balance: prev.balance - newTransaction.amount,
            }));
        }

        try {
            console.log('[TX] Adding transaction:', {
                type: newTransaction.type,
                category: newTransaction.category,
                amount: newTransaction.amount,
                online,
            });

            if (!online) {
                console.log('[TX] Offline - queuing transaction');
                await addTransactionOffline(newTransaction);
                return;
            }

            console.log('[TX] Online - adding directly to database');
            const addedTransaction = await api.addTransactionApi(user.id, newTransaction);
            console.log('[TX] Transaction added successfully to database with ID:', addedTransaction?.id);

            // Update the UI with the real transaction ID from the server
            if (addedTransaction) {
                setTransactions(prev => {
                    // Replace the temp transaction with the real one
                    const filtered = prev.filter(t => t.id !== tempTransaction.id);
                    return [{ ...addedTransaction, icon: tempTransaction.icon }, ...filtered];
                });
                setRecentTransactions(prev => {
                    const filtered = prev.filter(t => t.id !== tempTransaction.id);
                    return [{ ...addedTransaction, icon: tempTransaction.icon }, ...filtered.slice(0, 4)];
                });
            }

            // Background tasks - don't let errors here affect the transaction
            InteractionManager.runAfterInteractions(async () => {
                try {
                    const stats = await api.fetchBalanceStatsApi(user.id);
                    checkBudgetExceeded(stats.income, stats.expense);
                    // Refresh to get the latest data and ensure consistency
                    fetchTransactions(true, { search: '', type: 'All' });
                } catch (bgError) {
                    console.warn('[TX] Background task error (non-critical):', bgError);
                }
            });
        } catch (error: any) {
            console.error('[TX] Error adding transaction:', {
                error: error?.message || error,
                details: error?.details || error?.hint,
                code: error?.code,
                type: newTransaction.type,
            });
            console.log('[TX] Falling back to offline queue');

            // Only queue for offline if the transaction wasn't added to the database
            // Check if it's a network error or a validation error
            if (error?.code === 'PGRST116' || error?.code === '23514' || error?.message?.includes('violates check constraint')) {
                // This is a validation error - the transaction type might not be supported
                console.error('[TX] VALIDATION ERROR - Transaction type may not be supported in database');
                alert(`Error: ${error?.message || 'This transaction type is not supported. Please check your database schema.'}`);
                // Remove the optimistic update
                setTransactions(prev => prev.filter(t => t.id !== tempTransaction.id));
                setRecentTransactions(prev => prev.filter(t => t.id !== tempTransaction.id));
                // Reverse the aggregate update
                if (newTransaction.type === 'income' || newTransaction.type === 'borrowed') {
                    setAggregates(prev => ({
                        ...prev,
                        income: prev.income - newTransaction.amount,
                        balance: prev.balance - newTransaction.amount,
                    }));
                } else if (newTransaction.type === 'expense' || newTransaction.type === 'lent') {
                    setAggregates(prev => ({
                        ...prev,
                        expense: prev.expense - newTransaction.amount,
                        balance: prev.balance + newTransaction.amount,
                    }));
                }
                return;
            }

            // For network errors, queue for offline sync
            await addTransactionOffline(newTransaction);
        }
    }, [user, addTransactionOffline, fetchTransactions]);

    const deleteTransaction = useCallback(async (id: string) => {
        if (!user) throw new Error('User not authenticated');

        // Optimistically update UI
        const deletedTransaction = transactions.find(t => t.id === id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        setRecentTransactions(prev => prev.filter(t => t.id !== id));

        if (deletedTransaction) {
            // Reverse the original aggregate change based on transaction type
            if (deletedTransaction.type === 'income' || deletedTransaction.type === 'borrowed') {
                setAggregates(prev => ({
                    ...prev,
                    income: prev.income - deletedTransaction.amount,
                    balance: prev.balance - deletedTransaction.amount,
                }));
            } else if (deletedTransaction.type === 'expense' || deletedTransaction.type === 'lent') {
                setAggregates(prev => ({
                    ...prev,
                    expense: prev.expense - deletedTransaction.amount,
                    balance: prev.balance + deletedTransaction.amount,
                }));
            }
        }

        try {
            const online = await checkNetworkStatus();
            if (!online) {
                await deleteTransactionOffline(id);
                return;
            }

            await api.deleteTransactionApi(user.id, id);
            InteractionManager.runAfterInteractions(() => {
                fetchAggregates();
            });
        } catch (error) {
            console.error('Error deleting transaction:', error);
            await deleteTransactionOffline(id);
        }
    }, [user, transactions, deleteTransactionOffline, fetchAggregates]);

    const updateTransaction = useCallback(async (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) => {
        if (!user) throw new Error('User not authenticated');

        // Optimistically update UI
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates } : t
        ));
        setRecentTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates } : t
        ));

        try {
            const online = await checkNetworkStatus();
            if (!online) {
                await updateTransactionOffline(id, updates);
                return;
            }

            await api.updateTransactionApi(user.id, id, updates);
            InteractionManager.runAfterInteractions(() => {
                fetchAggregates();
            });
        } catch (error) {
            console.error('Error updating transaction:', error);
            await updateTransactionOffline(id, updates);
        }
    }, [user, updateTransactionOffline, fetchAggregates]);

    const refreshTransactions = useCallback(() => fetchTransactions(true), [fetchTransactions]);
    const loadMore = useCallback(() => fetchTransactions(false), [fetchTransactions]);

    const contextValue = useMemo(() => ({
        transactions,
        recentTransactions,
        loading,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        refreshTransactions,
        loadMore,
        applyFilters,
        hasMore,
        totals: aggregates,
        isOfflineMode,
    }), [
        transactions,
        recentTransactions,
        loading,
        hasMore,
        aggregates,
        isOfflineMode,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        refreshTransactions,
        loadMore,
        applyFilters,
    ]);

    return (
        <TransactionContext.Provider value={contextValue}>
            {children}
        </TransactionContext.Provider>
    );
}
