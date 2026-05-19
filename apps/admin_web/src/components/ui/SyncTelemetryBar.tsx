import React from 'react';

type SyncState = 'synced' | 'certifying' | 'offline';

interface SyncTelemetryBarProps {
  syncState: SyncState;
  pendingMutationCount: number;
  tenantNodeId: string;
}

export const SyncTelemetryBar: React.FC<SyncTelemetryBarProps> = ({
  syncState,
  pendingMutationCount,
  tenantNodeId,
}) => {
  const config = {
    synced: {
      dotClass: 'bg-emerald-500 animate-pulse',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30',
      label: 'Connected',
    },
    certifying: {
      dotClass: 'bg-amber-500 animate-spin rounded-sm',
      textClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30',
      label: `Certifying [${pendingMutationCount}]`,
    },
    offline: {
      dotClass: 'bg-slate-400',
      textClass: 'text-slate-600 dark:text-slate-400',
      bgClass: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
      label: 'Offline Queue Active',
    },
  };

  const current = config[syncState];

  return (
    <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 ${current.bgClass}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${current.dotClass}`} />
        <span className={`font-semibold ${current.textClass}`}>{current.label}</span>
      </div>
      <div className="text-slate-400 dark:text-slate-500 text-[10px] select-none uppercase tracking-wider">
        Node: <span className="text-slate-600 dark:text-slate-300">{tenantNodeId.substring(0, 8)}</span>
      </div>
    </div>
  );
};
