import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/offline-storage';

interface POSState {
  activeSessionId: string | null;
  storeId: string | null;
  cashierId: string | null;
  tenantId: string | null;
  
  // Actions
  setSession: (sessionId: string | null) => void;
  initialize: (config: { storeId: string; cashierId: string; tenantId: string }) => void;
  reset: () => void;
}

/**
 * usePOSStore manages global POS context.
 * Stores the current session and environment IDs.
 */
export const usePOSStore = create<POSState>()(
  persist(
    (set) => ({
      activeSessionId: null,
      storeId: null,
      cashierId: null,
      tenantId: null,

      setSession: (sessionId) => set({ activeSessionId: sessionId }),
      
      initialize: (config) => set({ 
        storeId: config.storeId, 
        cashierId: config.cashierId,
        tenantId: config.tenantId 
      }),

      reset: () => set({ 
        activeSessionId: null, 
        storeId: null, 
        cashierId: null,
        tenantId: null 
      }),
    }),
    {
      name: 'lucky-pos-context',
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
);
