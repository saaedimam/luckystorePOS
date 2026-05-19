import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/offline-storage';

/**
 * OfflineSale represents a transaction waiting to be synced.
 * Includes tracking for idempotency (operation_id) and retry logic.
 */
export interface OfflineSale {
  id: string; // The unique operation_id
  payload: any;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: string;
}

interface OfflineState {
  queue: OfflineSale[];
  
  // Actions
  addToQueue: (sale: Omit<OfflineSale, 'status' | 'retryCount' | 'createdAt'>) => void;
  removeFromQueue: (id: string) => void;
  markAsSyncing: (id: string) => void;
  markAsFailed: (id: string, error: string) => void;
  getPendingCount: () => number;
}

/**
 * useOfflineStore manages the FIFO queue for offline transactions.
 * Persists to IndexedDB to survive browser restarts and offline periods.
 */
export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      queue: [],

      addToQueue: (sale) => {
        const newSale: OfflineSale = {
          ...sale,
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ queue: [...state.queue, newSale] }));
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((s) => s.id !== id),
        }));
      },

      markAsSyncing: (id) => {
        set((state) => ({
          queue: state.queue.map((s) => 
            s.id === id ? { ...s, status: 'syncing' } : s
          ),
        }));
      },

      markAsFailed: (id, error) => {
        set((state) => ({
          queue: state.queue.map((s) => 
            s.id === id ? { 
              ...s, 
              status: 'failed', 
              retryCount: s.retryCount + 1,
              lastError: error 
            } : s
          ),
        }));
      },

      getPendingCount: () => {
        return get().queue.length;
      },
    }),
    {
      name: 'lucky-pos-offline-queue',
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
);
