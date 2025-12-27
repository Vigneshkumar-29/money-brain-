import { useEffect, useRef, useCallback, useState } from 'react';
import { useNetworkStatus, checkNetworkStatus } from './useNetworkStatus';
import { offlineQueue, TransactionCache, PendingTransaction } from '../utils/offlineQueue';
import * as api from '../lib/api/transactions';
import { Transaction } from '../lib/types';

interface SyncState {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime: number | null;
    syncError: string | null;
}

interface UseOfflineSyncOptions {
    userId: string | null;
    onSyncComplete?: () => void;
    onSyncError?: (error: Error) => void;
}

/**
 * Hook to manage offline synchronization
 * Automatically syncs pending transactions when network is restored
 */
export function useOfflineSync({ userId, onSyncComplete, onSyncError }: UseOfflineSyncOptions) {
    const networkStatus = useNetworkStatus();
    const [syncState, setSyncState] = useState<SyncState>({
        isSyncing: false,
        pendingCount: 0,
        lastSyncTime: null,
        syncError: null,
    });

    const isSyncingRef = useRef(false);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update pending count
    const updatePendingCount = useCallback(async () => {
        const stats = await offlineQueue.getStats();
        setSyncState(prev => ({ ...prev, pendingCount: stats.pendingCount }));
    }, []);

    // Process a single pending transaction
    const processPendingTransaction = useCallback(async (pending: PendingTransaction): Promise<boolean> => {
        if (!userId) return false;

        try {
            switch (pending.action) {
                case 'add':
                    const { id, ...addData } = pending.data;
                    await api.addTransactionApi(userId, addData as Omit<Transaction, 'id' | 'created_at' | 'icon'>);
                    break;

                case 'update':
                    const { id: updateId, ...updateData } = pending.data;
                    await api.updateTransactionApi(userId, updateId, updateData);
                    break;

                case 'delete':
                    await api.deleteTransactionApi(userId, pending.data.id);
                    break;
            }

            await offlineQueue.complete(pending.id);
            return true;
        } catch (error) {
            console.error(`Failed to sync transaction ${pending.id}:`, error);
            await offlineQueue.incrementRetry(pending.id);
            return false;
        }
    }, [userId]);

    // Main sync function
    const syncPendingTransactions = useCallback(async (): Promise<boolean> => {
        if (!userId || isSyncingRef.current) return false;

        // Check network status before syncing
        const isOnline = await checkNetworkStatus();
        if (!isOnline) return false;

        isSyncingRef.current = true;
        setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));

        try {
            const pending = await offlineQueue.getPending();

            if (pending.length === 0) {
                setSyncState(prev => ({
                    ...prev,
                    isSyncing: false,
                    pendingCount: 0,
                    lastSyncTime: Date.now(),
                }));
                isSyncingRef.current = false;
                return true;
            }

            let successCount = 0;
            let failCount = 0;

            // Process transactions in order (oldest first)
            const sortedPending = [...pending].sort((a, b) => a.timestamp - b.timestamp);

            for (const item of sortedPending) {
                const success = await processPendingTransaction(item);
                if (success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            // Remove items that have exceeded max retries
            const failed = await offlineQueue.removeFailedItems(5);
            if (failed.length > 0) {
                console.warn(`Removed ${failed.length} transactions that exceeded max retries`);
            }

            // Update stats
            const stats = await offlineQueue.getStats();

            setSyncState(prev => ({
                ...prev,
                isSyncing: false,
                pendingCount: stats.pendingCount,
                lastSyncTime: Date.now(),
                syncError: failCount > 0 ? `${failCount} transactions failed to sync` : null,
            }));

            if (successCount > 0) {
                onSyncComplete?.();
            }

            if (failCount > 0) {
                onSyncError?.(new Error(`${failCount} transactions failed to sync`));
            }

            return failCount === 0;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
            setSyncState(prev => ({
                ...prev,
                isSyncing: false,
                syncError: errorMessage,
            }));
            onSyncError?.(error instanceof Error ? error : new Error(errorMessage));
            return false;
        } finally {
            isSyncingRef.current = false;
        }
    }, [userId, processPendingTransaction, onSyncComplete, onSyncError]);

    // Auto-sync when coming back online
    useEffect(() => {
        if (networkStatus.isConnected && networkStatus.isInternetReachable) {
            syncPendingTransactions();
        }
    }, [networkStatus.isConnected, networkStatus.isInternetReachable, syncPendingTransactions]);

    // Periodic sync check (every 30 seconds when online)
    useEffect(() => {
        if (networkStatus.isConnected && userId) {
            syncIntervalRef.current = setInterval(() => {
                syncPendingTransactions();
            }, 30000);
        }

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [networkStatus.isConnected, userId, syncPendingTransactions]);

    // Initial pending count load
    useEffect(() => {
        updatePendingCount();
    }, [updatePendingCount]);

    return {
        ...syncState,
        isOnline: networkStatus.isConnected && networkStatus.isInternetReachable !== false,
        networkType: networkStatus.type,
        syncNow: syncPendingTransactions,
        updatePendingCount,
    };
}

/**
 * Utility to refresh transaction cache from server
 */
export async function refreshTransactionCache(userId: string): Promise<Transaction[]> {
    try {
        const { data } = await api.fetchTransactionsApi(userId, 0, 100);
        await TransactionCache.saveToCache(data);
        return data;
    } catch (error) {
        console.error('Failed to refresh transaction cache:', error);
        throw error;
    }
}
