import React from 'react';

interface TemporalFeedContainerProps {
  density: 'compact' | 'comfortable';
  children: React.ReactNode;
  rightSidebarContent?: React.ReactNode;
}

export const TemporalFeedContainer: React.FC<TemporalFeedContainerProps> = ({
  density,
  children,
  rightSidebarContent,
}) => {
  const isCompact = density === 'compact';

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen px-4 py-6 transition-all duration-150">
      {/* Dynamic Grid Layout: Adapts automatically if sub-panels are rendered */}
      <div className={`grid grid-cols-1 ${rightSidebarContent ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        
        {/* Primary Timeline Column */}
        <div className={`${rightSidebarContent ? 'lg:col-span-2' : 'col-span-1'} space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Operational Control Tower
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Temporal ledger flow for current accounting block
              </p>
            </div>
            
            {/* Inline Action Hub */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="px-2 py-1 text-[10px] font-mono bg-background-default text-text-secondary rounded border border-border-default">
                Mode: {isCompact ? 'Compact/Audit' : 'Comfortable/Cashier'}
              </span>
            </div>
          </div>

          {/* Temporal Core Flow */}
          <div className={`relative pl-6 border-l-2 border-border-default ${isCompact ? 'space-y-2' : 'space-y-4'}`}>
            {children}
          </div>
        </div>

        {/* Competitor Price Intelligence & Live Metrics Column */}
        {rightSidebarContent && (
          <div className="space-y-6 lg:h-[calc(100vh-7rem)] lg:sticky lg:top-24 overflow-y-auto pr-1">
            <div className="bg-background-subtle rounded-xl p-4 border border-border-default">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
                Real-Time Stream Targets
              </h2>
              {rightSidebarContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
