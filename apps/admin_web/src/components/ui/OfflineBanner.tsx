import { WifiOff, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OfflineBanner notifies the user when the connection is lost.
 * Premium design with glassmorphism and subtle animations.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4"
        >
          <div className="glass-card bg-amber-500/20 border-amber-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
              <WifiOff size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-500">Working Offline</h4>
              <p className="text-xs text-amber-500/80">
                Connection lost. Your sales will sync automatically when back online.
              </p>
            </div>
            <div className="animate-pulse">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
