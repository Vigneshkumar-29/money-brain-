import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../lib/types';

const OFFLINE_QUEUE_KEY = 'offline_transaction_queue';
const OFFLINE_CACHE_KEY = 'offline_transactions_cache';

export type OfflineAction = 'add' | 'update' | 'delete';

export interface PendingTransaction {
    id: string;
    action: OfflineAction;
    data: Partial<Transaction> & { id: string };
    timestamp: number;
    retryCount: number;
}

export interface OfflineQueueStats {
    pendingCount: number;
    oldestPending: number | null;
    lastSyncAttempt: number | null;
}

/**
 * Offline Queue Manager
 * Handles storing and syncing transactions when offline
 */
export class OfflineQueue {
    private static instance: OfflineQueue;
    private queue: PendingTransaction[] = [];
    private isLoaded = false;
    private loadingPromise: Promise<void> | null = null;
    private savingPromise: Promise<void> | null = null;

    private constructor() { }

    static getInstance(): OfflineQueue {
        if (!OfflineQueue.instance) {
            OfflineQueue.instance = new OfflineQueue();
        }
        return OfflineQueue.instance;
    }

    /**
     * Load queue from storage with lock mechanism
     */
    async load(forceReload = false): Promise<void> {
        if (this.isLoaded && !forceReload) return;

        // If already loading, wait for it
        if (this.loadingPromise) {
            await this.loadingPromise;
            return;
        }

        this.loadingPromise = this._loadFromStorage();
        try {
            await this.loadingPromise;
        } finally {
            this.loadingPromise = null;
        }
    }

    private async _loadFromStorage(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate the parsed data is an array
                if (Array.isArray(parsed)) {
                    this.queue = parsed;
                } else {
                    console.error('Invalid queue data format, resetting queue');
                    this.queue = [];
                }
            } else {
                this.queue = [];
            }
            this.isLoaded = true;
        } catch (error) {
            console.error('Error loading offline queue:', error);
            this.queue = [];
            this.isLoaded = true;
        }
    }

    /**
     * Save queue to storage with lock mechanism
     */
    private async save(): Promise<void> {
        // Wait for any pending save to complete first
        if (this.savingPromise) {
            await this.savingPromise;
        }

        this.savingPromise = this._saveToStorage();
        try {
            await this.savingPromise;
        } finally {
            this.savingPromise = null;
        }
    }

    private async _saveToStorage(): Promise<void> {
        try {
            await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Error saving offline queue:', error);
        }
    }

    /**
     * Add a transaction to the offline queue
     */
    async add(action: OfflineAction, data: Partial<Transaction> & { id: string }): Promise<void> {
        await this.load();

        // Check if there's already a pending action for this transaction
        const existingIndex = this.queue.findIndex(item => item.data.id === data.id);

        if (existingIndex !== -1) {
            const existing = this.queue[existingIndex];

            // Merge actions intelligently
            if (existing.action === 'add' && action === 'delete') {
                // If we added offline and now delete, just remove from queue
                this.queue.splice(existingIndex, 1);
            } else if (existing.action === 'add' && action === 'update') {
                // If we added offline and now update, update the add action
                existing.data = { ...existing.data, ...data };
                existing.timestamp = Date.now();
            } else if (existing.action === 'update' && action === 'delete') {
                // If we updated and now delete, change to delete
                existing.action = 'delete';
                existing.timestamp = Date.now();
            } else if (existing.action === 'update' && action === 'update') {
                // Merge updates
                existing.data = { ...existing.data, ...data };
                existing.timestamp = Date.now();
            }
        } else {
            // Add new pending action
            const pending: PendingTransaction = {
                id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                action,
                data,
                timestamp: Date.now(),
                retryCount: 0,
            };
            this.queue.push(pending);
        }

        await this.save();
    }

    /**
     * Get all pending transactions
     */
    async getPending(): Promise<PendingTransaction[]> {
        await this.load();
        return [...this.queue];
    }

    /**
     * Get queue statistics
     */
    async getStats(): Promise<OfflineQueueStats> {
        await this.load();

        return {
            pendingCount: this.queue.length,
            oldestPending: this.queue.length > 0
                ? Math.min(...this.queue.map(p => p.timestamp))
                : null,
            lastSyncAttempt: null, // Could be tracked separately if needed
        };
    }

    /**
     * Mark a pending transaction as completed (remove from queue)
     */
    async complete(pendingId: string): Promise<void> {
        await this.load();
        this.queue = this.queue.filter(item => item.id !== pendingId);
        await this.save();
    }

    /**
     * Increment retry count for a pending transaction
     */
    async incrementRetry(pendingId: string): Promise<void> {
        await this.load();
        const item = this.queue.find(p => p.id === pendingId);
        if (item) {
            item.retryCount++;
            await this.save();
        }
    }

    /**
     * Remove items that have exceeded max retries
     */
    async removeFailedItems(maxRetries: number = 5): Promise<PendingTransaction[]> {
        await this.load();
        const failed = this.queue.filter(item => item.retryCount >= maxRetries);
        this.queue = this.queue.filter(item => item.retryCount < maxRetries);
        await this.save();
        return failed;
    }

    /**
     * Clear the entire queue
     */
    async clear(): Promise<void> {
        this.queue = [];
        await this.save();
    }

    /**
     * Check if there are pending items
     */
    async hasPending(): Promise<boolean> {
        await this.load();
        return this.queue.length > 0;
    }
}

/**
 * Local cache for transactions (for offline viewing)
 */
export class TransactionCache {
    private static CACHE_KEY = OFFLINE_CACHE_KEY;

    /**
     * Save transactions to local cache
     */
    static async saveToCache(transactions: Transaction[]): Promise<void> {
        try {
            await AsyncStorage.setItem(
                this.CACHE_KEY,
                JSON.stringify({
                    transactions,
                    lastUpdated: Date.now(),
                })
            );
        } catch (error) {
            console.error('Error saving transactions to cache:', error);
        }
    }

    /**
     * Load transactions from local cache
     */
    static async loadFromCache(): Promise<{ transactions: Transaction[]; lastUpdated: number } | null> {
        try {
            const stored = await AsyncStorage.getItem(this.CACHE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading transactions from cache:', error);
        }
        return null;
    }

    /**
     * Clear the cache
     */
    static async clearCache(): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.CACHE_KEY);
        } catch (error) {
            console.error('Error clearing transaction cache:', error);
        }
    }

    /**
     * Apply pending changes to cached transactions (for offline display)
     */
    static applyPendingChanges(
        cached: Transaction[],
        pending: PendingTransaction[]
    ): Transaction[] {
        let result = [...cached];

        for (const item of pending) {
            switch (item.action) {
                case 'add':
                    // Add if not already in list
                    if (!result.find(t => t.id === item.data.id)) {
                        result.unshift(item.data as Transaction);
                    }
                    break;
                case 'update':
                    const updateIndex = result.findIndex(t => t.id === item.data.id);
                    if (updateIndex !== -1) {
                        result[updateIndex] = { ...result[updateIndex], ...item.data } as Transaction;
                    }
                    break;
                case 'delete':
                    result = result.filter(t => t.id !== item.data.id);
                    break;
            }
        }

        return result;
    }
}

// Export singleton instance
export const offlineQueue = OfflineQueue.getInstance();
