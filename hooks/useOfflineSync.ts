import { useEffect, useRef, useCallback, useState } from 'react';
import { useNetworkStatus, checkNetworkStatus } from './useNetworkStatus';
import { offlineQueue, TransactionCache, PendingTransaction } from '../utils/offlineQueue';
import * as api from '../lib/api/transactions';
import { Transaction } from '../lib/types';
import { InteractionManager } from 'react-native';

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
 * Optimized to minimize re-renders and defer heavy operations
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
    const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastOnlineState = useRef<boolean>(true);

    // Debounced pending count update
    const pendingCountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updatePendingCount = useCallback(async () => {
        // Clear existing timeout
        if (pendingCountTimeoutRef.current) {
            clearTimeout(pendingCountTimeoutRef.current);
        }

        // Debounce the update
        pendingCountTimeoutRef.current = setTimeout(async () => {
            const stats = await offlineQueue.getStats();
            setSyncState(prev => {
                // Only update if changed
                if (prev.pendingCount === stats.pendingCount) return prev;
                return { ...prev, pendingCount: stats.pendingCount };
            });
        }, 300);
    }, []);

    // Process a single pending transaction
    const processPendingTransaction = useCallback(async (pending: PendingTransaction): Promise<boolean> => {
        if (!userId) return false;

        try {
            console.log(`[SYNC] Processing ${pending.action} transaction:`, {
                pendingId: pending.id,
                transactionType: pending.data.type,
                transactionId: pending.data.id,
            });

            switch (pending.action) {
                case 'add':
                    // Extract and exclude the temporary ID - server will generate a proper UUID
                    // Also remove icon and any other non-database fields
                    const { id: tempId, icon, user_id, ...addData } = pending.data as Transaction & { user_id?: string };

                    console.log('[SYNC] Add transaction data:', {
                        type: addData.type,
                        category: addData.category,
                        amount: addData.amount,
                        title: addData.title,
                        date: addData.date,
                    });

                    // Only sync if we have the required fields
                    if (!addData.title || !addData.amount || !addData.type || !addData.category || !addData.date) {
                        console.error('[SYNC] Missing required fields for add transaction:', addData);
                        await offlineQueue.complete(pending.id);
                        return false;
                    }

                    console.log('[SYNC] Calling API to add transaction...');
                    await api.addTransactionApi(userId, addData as Omit<Transaction, 'id' | 'created_at' | 'icon'>);
                    console.log('[SYNC] Transaction added successfully');
                    break;

                case 'update':
                    // Remove non-database fields from update data
                    const { id: updateId, icon: updateIcon, user_id: updateUserId, ...updateData } = pending.data as Transaction & { user_id?: string };
                    // Skip if the ID is a temporary ID (it was never synced to server)
                    if (updateId.startsWith('temp_')) {
                        console.warn('[SYNC] Skipping update for temporary transaction:', updateId);
                        await offlineQueue.complete(pending.id);
                        return true;
                    }
                    console.log('[SYNC] Calling API to update transaction...');
                    await api.updateTransactionApi(userId, updateId, updateData);
                    console.log('[SYNC] Transaction updated successfully');
                    break;

                case 'delete':
                    // Skip if the ID is a temporary ID (it was never synced to server)
                    if (pending.data.id.startsWith('temp_')) {
                        console.warn('[SYNC] Skipping delete for temporary transaction:', pending.data.id);
                        await offlineQueue.complete(pending.id);
                        return true;
                    }
                    console.log('[SYNC] Calling API to delete transaction...');
                    await api.deleteTransactionApi(userId, pending.data.id);
                    console.log('[SYNC] Transaction deleted successfully');
                    break;
            }

            await offlineQueue.complete(pending.id);
            console.log(`[SYNC] Completed ${pending.action} transaction successfully`);
            return true;
        } catch (error: any) {
            console.error(`[SYNC] Failed to sync ${pending.action} transaction ${pending.id}:`, {
                error: error?.message || error,
                details: error?.details || error?.hint || error,
                code: error?.code,
                transactionType: pending.data.type,
            });
            await offlineQueue.incrementRetry(pending.id);
            return false;
        }
    }, [userId]);

    // Main sync function - deferred to avoid blocking UI
    const syncPendingTransactions = useCallback(async (): Promise<boolean> => {
        if (!userId || isSyncingRef.current) return false;

        // Check network status before syncing
        const isOnline = await checkNetworkStatus();
        if (!isOnline) return false;

        isSyncingRef.current = true;

        // Defer state update to avoid blocking
        InteractionManager.runAfterInteractions(() => {
            setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));
        });

        try {
            // Force reload the queue to get the latest data
            await offlineQueue.load(true);
            const pending = await offlineQueue.getPending();

            if (pending.length === 0) {
                InteractionManager.runAfterInteractions(() => {
                    setSyncState(prev => ({
                        ...prev,
                        isSyncing: false,
                        pendingCount: 0,
                        lastSyncTime: Date.now(),
                    }));
                });
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
            await offlineQueue.removeFailedItems(5);

            // Update stats
            const stats = await offlineQueue.getStats();

            InteractionManager.runAfterInteractions(() => {
                setSyncState(prev => ({
                    ...prev,
                    isSyncing: false,
                    pendingCount: stats.pendingCount,
                    lastSyncTime: Date.now(),
                    syncError: failCount > 0 ? `${failCount} failed` : null,
                }));
            });

            if (successCount > 0) {
                onSyncComplete?.();
            }

            if (failCount > 0) {
                onSyncError?.(new Error(`${failCount} transactions failed to sync`));
            }

            return failCount === 0;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sync error';
            InteractionManager.runAfterInteractions(() => {
                setSyncState(prev => ({
                    ...prev,
                    isSyncing: false,
                    syncError: errorMessage,
                }));
            });
            onSyncError?.(error instanceof Error ? error : new Error(errorMessage));
            return false;
        } finally {
            isSyncingRef.current = false;
        }
    }, [userId, processPendingTransaction, onSyncComplete, onSyncError]);

    // Only sync when transitioning from offline to online
    useEffect(() => {
        const currentOnlineState = networkStatus.isConnected && networkStatus.isInternetReachable !== false;

        if (currentOnlineState && !lastOnlineState.current) {
            // Just came online - defer sync to avoid UI jank
            InteractionManager.runAfterInteractions(() => {
                syncPendingTransactions();
            });
        }

        lastOnlineState.current = currentOnlineState;
    }, [networkStatus.isConnected, networkStatus.isInternetReachable, syncPendingTransactions]);

    // Periodic sync check (every 60 seconds when online) - reduced frequency
    useEffect(() => {
        if (networkStatus.isConnected && userId) {
            syncIntervalRef.current = setInterval(() => {
                if (!isSyncingRef.current) {
                    syncPendingTransactions();
                }
            }, 60000); // Increased to 60 seconds
        }

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [networkStatus.isConnected, userId, syncPendingTransactions]);

    // Initial pending count load - deferred
    useEffect(() => {
        InteractionManager.runAfterInteractions(() => {
            updatePendingCount();
        });
    }, [updatePendingCount]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (pendingCountTimeoutRef.current) {
                clearTimeout(pendingCountTimeoutRef.current);
            }
        };
    }, []);

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
