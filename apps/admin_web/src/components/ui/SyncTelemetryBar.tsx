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
      dotClass: 'bg-success animate-pulse',
      textClass: 'text-success-dark dark:text-success',
      bgClass: 'bg-success/10 border-success/20',
      label: 'Connected',
    },
    certifying: {
      dotClass: 'bg-warning animate-spin rounded-sm',
      textClass: 'text-warning-dark dark:text-warning',
      bgClass: 'bg-warning/10 border-warning/20',
      label: `Certifying [${pendingMutationCount}]`,
    },
    offline: {
      dotClass: 'bg-text-muted',
      textClass: 'text-text-secondary dark:text-text-muted',
      bgClass: 'bg-background-subtle border-border-default',
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
      <div className="text-text-muted text-[10px] select-none uppercase tracking-wider">
        Node: <span className="text-text-secondary">{tenantNodeId.substring(0, 8)}</span>
      </div>
    </div>
  );
};
