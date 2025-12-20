import { supabase } from '../supabase';
import { Transaction } from '../types';
import { ICON_MAP, getCategoryIconName } from '../constants';
import { DollarSign } from 'lucide-react-native';

export const PAGE_SIZE = 20;

export async function fetchTransactionsApi(
    userId: string,
    page: number = 0,
    limit: number = PAGE_SIZE,
    filters?: { search?: string, type?: string }
) {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

    if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }

    if (filters?.type && filters.type !== 'All') {
        query = query.eq('type', filters.type.toLowerCase());
    }

    const { data, error, count } = await query
        .order('date', { ascending: false })
        .range(from, to);

    if (error) throw error;

    const formattedData: Transaction[] = (data || []).map(item => ({
        ...item,
        amount: parseFloat(item.amount),
        icon: ICON_MAP[getCategoryIconName(item.category)] || DollarSign
    }));

    return { data: formattedData, count };
}

export async function fetchBalanceStatsApi(userId: string) {
    // Call the Postgres RPC function for server-side calculation
    const { data, error } = await supabase.rpc('get_balance_stats', { user_id_input: userId });

    if (error) throw error;

    // Default to zero if data is null for some reason (rare)
    return data || { income: 0, expense: 0, balance: 0 };
}

export async function addTransactionApi(userId: string, transaction: Omit<Transaction, 'id' | 'created_at' | 'icon'>) {
    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            user_id: userId,
            ...transaction
        }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteTransactionApi(userId: string, id: string) {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}

export async function updateTransactionApi(userId: string, id: string, updates: any) {
    const { error } = await supabase
        .from('transactions')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}
