import { RefreshCw } from "lucide-react";
import { usePOSStore } from "../store";

export function OfflineBanner() {
  const { isOnline, offlineQueueCount } = usePOSStore();

  if (isOnline) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 h-10 bg-amber/10 border-b border-amber/20 flex items-center justify-center gap-2 text-amber font-semibold text-sm backdrop-blur-sm shadow-sm"
      style={{
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDuration: "300ms",
      }}
    >
      <RefreshCw className="size-4 animate-pulse" />
      <span>
        Offline Mode — <span className="num">{offlineQueueCount}</span> sales queued locally. Waiting for network...
      </span>
    </div>
  );
}
