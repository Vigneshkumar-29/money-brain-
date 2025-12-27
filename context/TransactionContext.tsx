import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    recentTransactions: Transaction[]; // For Dashboard
    loading: boolean;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    applyFilters: (filters: { search: string, type: string }) => void; // For Search
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
    // Browsable List State
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Dashboard "Feed" State (Always shows latest 5)
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [aggregates, setAggregates] = useState({ income: 0, expense: 0, balance: 0 });
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // Filters state
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

    // Check network and update offline mode state
    useEffect(() => {
        setIsOfflineMode(!isOnline);
    }, [isOnline]);

    // Fetch Summaries using Server-Side Aggregation
    const fetchAggregates = useCallback(async () => {
        if (!user) return;

        // If offline, calculate from cached data
        if (!isOnline) {
            const cached = await getCachedTransactions();
            const income = cached
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expense = cached
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            setAggregates({ income, expense, balance: income - expense });
            return;
        }

        try {
            const stats = await api.fetchBalanceStatsApi(user.id);
            setAggregates(stats);
        } catch (error) {
            console.error('Error fetching aggregates:', error);
            // Fallback to cached data on error
            const cached = await getCachedTransactions();
            const income = cached
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expense = cached
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            setAggregates({ income, expense, balance: income - expense });
        }
    }, [user, isOnline, getCachedTransactions]);

    // Fetch just the recent 5 for dashboard
    const fetchRecent = useCallback(async () => {
        if (!user) return;

        // If offline, use cached data
        if (!isOnline) {
            const cached = await getCachedTransactions();
            setRecentTransactions(cached.slice(0, 5));
            return;
        }

        try {
            const { data } = await api.fetchTransactionsApi(user.id, 0, 5); // Limit 5
            setRecentTransactions(data);
        } catch (error) {
            console.error('Error fetching recent:', error);
            // Fallback to cached data
            const cached = await getCachedTransactions();
            setRecentTransactions(cached.slice(0, 5));
        }
    }, [user, isOnline, getCachedTransactions]);

    const fetchTransactions = useCallback(async (reset = false, newFilters = filters) => {
        if (!user) return;
        if (loading && !reset) return;

        setLoading(true);
        try {
            const online = await checkNetworkStatus();

            // If offline, use cached data
            if (!online) {
                const cached = await getCachedTransactions();
                let filteredData = cached;

                // Apply local filters
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
                setHasMore(false);
                setLoading(false);
                return;
            }

            const currentPage = reset ? 0 : page;

            // Use passed filters or current state
            const { data } = await api.fetchTransactionsApi(user.id, currentPage, api.PAGE_SIZE, newFilters);

            if (reset) {
                setTransactions(data);
                setPage(1);
                // Update cache with fresh data
                await refreshCache(data);
            } else {
                setTransactions(prev => [...prev, ...data]);
                setPage(prev => prev + 1);
            }

            setHasMore(data.length === api.PAGE_SIZE);

            // If fetching default list (no filters), update recent & totals too for consistency
            if (reset && newFilters.search === '' && newFilters.type === 'All') {
                fetchAggregates();
                fetchRecent();
            }

        } catch (error) {
            console.error('Error fetching transactions:', error);
            // Fallback to cached data on error
            const cached = await getCachedTransactions();
            setTransactions(cached);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [user, loading, page, filters, getCachedTransactions, refreshCache, fetchAggregates, fetchRecent]);

    const applyFilters = useCallback((newFilters: { search: string, type: string }) => {
        setFilters(newFilters);
        fetchTransactions(true, newFilters);
    }, [fetchTransactions]);

    useEffect(() => {
        if (user) {
            fetchTransactions(true);
        }
    }, [user]);

    // Refresh when coming back online or when pending items are synced
    useEffect(() => {
        if (user && isOnline) {
            fetchTransactions(true, { search: '', type: 'All' });
        }
    }, [isOnline, pendingCount]);

    const addTransaction = useCallback(async (newTransaction: Omit<Transaction, 'id'>) => {
        if (!user) return;

        try {
            const online = await checkNetworkStatus();

            if (!online) {
                // Use offline-first approach
                await addTransactionOffline(newTransaction);

                // Optimistically update UI
                const tempTransaction: Transaction = {
                    ...newTransaction,
                    id: `temp_${Date.now()}`,
                };

                setTransactions(prev => [tempTransaction, ...prev]);
                setRecentTransactions(prev => [tempTransaction, ...prev.slice(0, 4)]);

                // Update aggregates locally
                if (newTransaction.type === 'income') {
                    setAggregates(prev => ({
                        ...prev,
                        income: prev.income + newTransaction.amount,
                        balance: prev.balance + newTransaction.amount,
                    }));
                } else if (newTransaction.type === 'expense') {
                    setAggregates(prev => ({
                        ...prev,
                        expense: prev.expense + newTransaction.amount,
                        balance: prev.balance - newTransaction.amount,
                    }));
                }

                return;
            }

            await api.addTransactionApi(user.id, newTransaction);

            // Check budget alert immediately after adding
            const stats = await api.fetchBalanceStatsApi(user.id);
            checkBudgetExceeded(stats.income, stats.expense);

            // Reset main list and refresh globals
            await fetchTransactions(true, { search: '', type: 'All' });
            setFilters({ search: '', type: 'All' });
            fetchAggregates(); // Ensure totals are updated
            fetchRecent(); // Ensure dashboard is updated
        } catch (error) {
            console.error('Error adding transaction:', error);

            // If online call fails, queue for offline sync
            await addTransactionOffline(newTransaction);

            // Optimistically update UI
            const tempTransaction: Transaction = {
                ...newTransaction,
                id: `temp_${Date.now()}`,
            };

            setTransactions(prev => [tempTransaction, ...prev]);
            setRecentTransactions(prev => [tempTransaction, ...prev.slice(0, 4)]);
        }
    }, [user, addTransactionOffline, fetchTransactions, fetchAggregates, fetchRecent]);

    const deleteTransaction = useCallback(async (id: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const online = await checkNetworkStatus();

            if (!online) {
                await deleteTransactionOffline(id);

                // Optimistically update UI
                const deletedTransaction = transactions.find(t => t.id === id);
                setTransactions(prev => prev.filter(t => t.id !== id));
                setRecentTransactions(prev => prev.filter(t => t.id !== id));

                // Update aggregates locally
                if (deletedTransaction) {
                    if (deletedTransaction.type === 'income') {
                        setAggregates(prev => ({
                            ...prev,
                            income: prev.income - deletedTransaction.amount,
                            balance: prev.balance - deletedTransaction.amount,
                        }));
                    } else if (deletedTransaction.type === 'expense') {
                        setAggregates(prev => ({
                            ...prev,
                            expense: prev.expense - deletedTransaction.amount,
                            balance: prev.balance + deletedTransaction.amount,
                        }));
                    }
                }

                return;
            }

            await api.deleteTransactionApi(user.id, id);
            await fetchTransactions(true);
            fetchAggregates();
            fetchRecent();
        } catch (error) {
            console.error('Error deleting transaction:', error);

            // Queue for offline sync on failure
            await deleteTransactionOffline(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
            setRecentTransactions(prev => prev.filter(t => t.id !== id));
        }
    }, [user, transactions, deleteTransactionOffline, fetchTransactions, fetchAggregates, fetchRecent]);

    const updateTransaction = useCallback(async (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const online = await checkNetworkStatus();

            if (!online) {
                await updateTransactionOffline(id, updates);

                // Optimistically update UI
                setTransactions(prev => prev.map(t =>
                    t.id === id ? { ...t, ...updates } : t
                ));
                setRecentTransactions(prev => prev.map(t =>
                    t.id === id ? { ...t, ...updates } : t
                ));

                return;
            }

            await api.updateTransactionApi(user.id, id, updates);
            await fetchTransactions(true);
            fetchAggregates();
            fetchRecent();
        } catch (error) {
            console.error('Error updating transaction:', error);

            // Queue for offline sync on failure
            await updateTransactionOffline(id, updates);
            setTransactions(prev => prev.map(t =>
                t.id === id ? { ...t, ...updates } : t
            ));
            setRecentTransactions(prev => prev.map(t =>
                t.id === id ? { ...t, ...updates } : t
            ));
        }
    }, [user, updateTransactionOffline, fetchTransactions, fetchAggregates, fetchRecent]);

    const contextValue = React.useMemo(() => ({
        transactions,
        recentTransactions,
        loading,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        refreshTransactions: () => fetchTransactions(true),
        loadMore: () => fetchTransactions(false),
        applyFilters,
        hasMore,
        totals: aggregates,
        isOfflineMode,
    }), [transactions, recentTransactions, loading, hasMore, aggregates, user, filters, isOfflineMode, addTransaction, deleteTransaction, updateTransaction, applyFilters, fetchTransactions]);

    return (
        <TransactionContext.Provider value={contextValue}>
            {children}
        </TransactionContext.Provider>
    );
}
