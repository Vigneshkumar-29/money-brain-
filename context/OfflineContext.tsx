import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { offlineQueue, TransactionCache } from '../utils/offlineQueue';
import { Transaction } from '../lib/types';
import { checkNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineContextType {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    syncError: string | null;
    lastSyncTime: number | null;
    syncNow: () => Promise<boolean>;

    // Offline-aware transaction methods
    addTransactionOffline: (transaction: Omit<Transaction, 'id' | 'created_at' | 'icon'>) => Promise<string>;
    updateTransactionOffline: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransactionOffline: (id: string) => Promise<void>;

    // Cache methods
    getCachedTransactions: () => Promise<Transaction[]>;
    refreshCache: (transactions: Transaction[]) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    syncError: null,
    lastSyncTime: null,
    syncNow: async () => false,
    addTransactionOffline: async () => '',
    updateTransactionOffline: async () => { },
    deleteTransactionOffline: async () => { },
    getCachedTransactions: async () => [],
    refreshCache: async () => { },
});

export function useOffline() {
    return useContext(OfflineContext);
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [syncTrigger, setSyncTrigger] = useState(0);

    const handleSyncComplete = useCallback(() => {
        setSyncTrigger(prev => prev + 1);
    }, []);

    const {
        isOnline,
        isSyncing,
        pendingCount,
        syncError,
        lastSyncTime,
        syncNow,
        updatePendingCount,
    } = useOfflineSync({
        userId: user?.id ?? null,
        onSyncComplete: handleSyncComplete,
    });

    // Generate a temporary ID for offline transactions
    const generateTempId = useCallback((): string => {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Add transaction with offline support
    const addTransactionOffline = useCallback(async (
        transaction: Omit<Transaction, 'id' | 'created_at' | 'icon'>
    ): Promise<string> => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        const tempId = generateTempId();
        const fullTransaction: Transaction = {
            ...transaction,
            id: tempId,
            // Ensure date is properly formatted
            date: transaction.date || new Date().toISOString().split('T')[0],
        };

        // Queue for sync with user_id included for proper server sync
        await offlineQueue.add('add', { ...fullTransaction, user_id: user.id } as any);

        // Update local cache
        const cached = await TransactionCache.loadFromCache();
        if (cached) {
            const updatedTransactions = [fullTransaction, ...cached.transactions];
            await TransactionCache.saveToCache(updatedTransactions);
        } else {
            await TransactionCache.saveToCache([fullTransaction]);
        }

        // Update pending count (debounced internally)
        updatePendingCount();

        // Try to sync if online
        const online = await checkNetworkStatus();
        if (online) {
            // Don't await - let it sync in background
            syncNow();
        }

        return tempId;
    }, [user, generateTempId, syncNow, updatePendingCount]);

    // Update transaction with offline support
    const updateTransactionOffline = useCallback(async (
        id: string,
        updates: Partial<Transaction>
    ): Promise<void> => {
        await offlineQueue.add('update', { id, ...updates });

        // Update local cache
        const cached = await TransactionCache.loadFromCache();
        if (cached) {
            const updatedTransactions = cached.transactions.map(t =>
                t.id === id ? { ...t, ...updates } : t
            );
            await TransactionCache.saveToCache(updatedTransactions);
        }

        updatePendingCount();

        const online = await checkNetworkStatus();
        if (online) {
            syncNow();
        }
    }, [syncNow, updatePendingCount]);

    // Delete transaction with offline support
    const deleteTransactionOffline = useCallback(async (id: string): Promise<void> => {
        await offlineQueue.add('delete', { id } as any);

        // Update local cache
        const cached = await TransactionCache.loadFromCache();
        if (cached) {
            const updatedTransactions = cached.transactions.filter(t => t.id !== id);
            await TransactionCache.saveToCache(updatedTransactions);
        }

        updatePendingCount();

        const online = await checkNetworkStatus();
        if (online) {
            syncNow();
        }
    }, [syncNow, updatePendingCount]);

    // Get cached transactions with pending changes applied
    const getCachedTransactions = useCallback(async (): Promise<Transaction[]> => {
        const cached = await TransactionCache.loadFromCache();
        const pending = await offlineQueue.getPending();

        if (!cached) {
            return pending
                .filter(p => p.action === 'add')
                .map(p => p.data as Transaction);
        }

        return TransactionCache.applyPendingChanges(cached.transactions, pending);
    }, []);

    // Refresh the local cache
    const refreshCache = useCallback(async (transactions: Transaction[]): Promise<void> => {
        await TransactionCache.saveToCache(transactions);
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo<OfflineContextType>(() => ({
        isOnline,
        isSyncing,
        pendingCount,
        syncError,
        lastSyncTime,
        syncNow,
        addTransactionOffline,
        updateTransactionOffline,
        deleteTransactionOffline,
        getCachedTransactions,
        refreshCache,
    }), [
        isOnline,
        isSyncing,
        pendingCount,
        syncError,
        lastSyncTime,
        syncNow,
        addTransactionOffline,
        updateTransactionOffline,
        deleteTransactionOffline,
        getCachedTransactions,
        refreshCache,
    ]);

    return (
        <OfflineContext.Provider value={contextValue}>
            {children}
        </OfflineContext.Provider>
    );
}
