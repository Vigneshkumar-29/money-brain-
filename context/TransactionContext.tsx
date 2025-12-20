import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import * as api from '../lib/api/transactions';
import { Transaction } from '../lib/types';
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

    // Filters state
    const [filters, setFilters] = useState({ search: '', type: 'All' });

    const { user } = useAuth();

    // Fetch Summaries using Server-Side Aggregation
    const fetchAggregates = async () => {
        if (!user) return;
        try {

            const stats = await api.fetchBalanceStatsApi(user.id);
            setAggregates(stats);
        } catch (error) {
            console.error('Error fetching aggregates:', error);
        }
    };

    // Fetch just the recent 5 for dashboard
    const fetchRecent = async () => {
        if (!user) return;
        try {

            const { data } = await api.fetchTransactionsApi(user.id, 0, 5); // Limit 5
            setRecentTransactions(data);
        } catch (error) {
            console.error('Error fetching recent:', error);
        }
    };

    const fetchTransactions = async (reset = false, newFilters = filters) => {
        if (!user) return;
        if (loading && !reset) return;

        setLoading(true);
        try {

            const currentPage = reset ? 0 : page;

            // Use passed filters or current state
            const { data } = await api.fetchTransactionsApi(user.id, currentPage, api.PAGE_SIZE, newFilters);

            if (reset) {
                setTransactions(data);
                setPage(1);
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
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (newFilters: { search: string, type: string }) => {
        setFilters(newFilters);
        fetchTransactions(true, newFilters);
    };

    useEffect(() => {
        if (user) {
            fetchTransactions(true);
        }
    }, [user]);

    const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
        if (!user) return;
        try {

            await api.addTransactionApi(user.id, newTransaction);
            // Reset main list and refresh globals
            await fetchTransactions(true, { search: '', type: 'All' });
            setFilters({ search: '', type: 'All' });
            fetchAggregates(); // Ensure totals are updated
            fetchRecent(); // Ensure dashboard is updated
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) throw new Error('User not authenticated');
        try {

            await api.deleteTransactionApi(user.id, id);
            await fetchTransactions(true);
            fetchAggregates();
            fetchRecent();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    };

    const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) => {
        if (!user) throw new Error('User not authenticated');
        try {

            await api.updateTransactionApi(user.id, id, updates);
            await fetchTransactions(true);
            fetchAggregates();
            fetchRecent();
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
    };

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
    }), [transactions, recentTransactions, loading, hasMore, aggregates, user, filters]);

    return (
        <TransactionContext.Provider value={contextValue}>
            {children}
        </TransactionContext.Provider>
    );
}
