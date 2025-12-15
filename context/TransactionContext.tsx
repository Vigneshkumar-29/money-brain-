import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { ShoppingBag, Coffee, ArrowUpRight, Home, Car, Smartphone, Utensils, Zap, Tag, DollarSign } from 'lucide-react-native';

// Map icon string names to Lucide components for rendering
export const ICON_MAP: any = {
    ShoppingBag, Coffee, ArrowUpRight, Home, Car, Smartphone, Utensils, Zap, Tag, DollarSign
};

// Helper to map category to icon name (simplified)
export const getCategoryIconName = (category: string) => {
    switch (category.toLowerCase()) {
        case 'food': return 'Utensils';
        case 'shopping': return 'ShoppingBag';
        case 'transport': return 'Car';
        case 'home': return 'Home';
        case 'utilities': return 'Zap';
        case 'salary': return 'DollarSign';
        case 'freelance': return 'Coffee';
        case 'investment': return 'Tag';
        default: return 'DollarSign';
    }
};

export type Transaction = {
    id: string;
    amount: number;
    title: string;
    type: 'income' | 'expense' | 'lent' | 'borrowed';
    category: string;
    date: string;
    icon?: any; // We'll resolve this when using the data
};

type TransactionContextType = {
    transactions: Transaction[];
    loading: boolean;
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
    loading: false,
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
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchTransactions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                // Transform data to match UI needs
                const formattedData: Transaction[] = data.map(item => ({
                    ...item,
                    amount: parseFloat(item.amount), // Ensure number
                    icon: ICON_MAP[getCategoryIconName(item.category)] || DollarSign
                }));
                setTransactions(formattedData);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('transactions')
                .insert([{
                    user_id: user.id,
                    amount: newTransaction.amount,
                    title: newTransaction.title,
                    type: newTransaction.type,
                    category: newTransaction.category,
                    date: newTransaction.date
                }])
                .select()
                .single();

            if (error) throw error;

            await fetchTransactions();
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) {
            console.error('No user found for delete operation');
            throw new Error('User not authenticated');
        }

        try {
            console.log('Deleting transaction:', id, 'for user:', user.id);

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }

            console.log('Transaction deleted successfully');
            await fetchTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    };

    const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) => {
        if (!user) {
            console.error('No user found for update operation');
            throw new Error('User not authenticated');
        }

        try {
            console.log('Updating transaction:', id, 'for user:', user.id, 'with updates:', updates);

            // Only send fields that should be updated, exclude system fields
            const updateData: any = {};
            if (updates.amount !== undefined) updateData.amount = updates.amount;
            if (updates.title !== undefined) updateData.title = updates.title;
            if (updates.type !== undefined) updateData.type = updates.type;
            if (updates.category !== undefined) updateData.category = updates.category;
            if (updates.date !== undefined) updateData.date = updates.date;

            // Explicitly set updated_at to current timestamp
            // This works whether or not the trigger exists
            updateData.updated_at = new Date().toISOString();

            console.log('Sanitized update data:', updateData);

            const { error } = await supabase
                .from('transactions')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Transaction updated successfully');
            await fetchTransactions();
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
    };

    const totals = transactions.reduce(
        (acc, curr) => {
            if (curr.type === 'income' || curr.type === 'borrowed') {
                acc.income += curr.amount;
                acc.balance += curr.amount;
            } else {
                acc.expense += curr.amount;
                acc.balance -= curr.amount;
            }
            return acc;
        },
        { income: 0, expense: 0, balance: 0 }
    );

    return (
        <TransactionContext.Provider
            value={{
                transactions,
                loading,
                addTransaction,
                deleteTransaction,
                updateTransaction,
                refreshTransactions: fetchTransactions,
                totals,
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
}
