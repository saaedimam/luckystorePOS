type Status = "online" | "offline" | "syncing" | "warning" | "error";

const statusMap: Record<Status, { color: string; label: string; pulse: boolean }> = {
  online: { color: "var(--accent-emerald)", label: "Online", pulse: true },
  offline: { color: "var(--accent-amber)", label: "Offline", pulse: false },
  syncing: { color: "var(--accent-amber)", label: "Syncing", pulse: true },
  warning: { color: "var(--accent-amber)", label: "Warning", pulse: true },
  error: { color: "var(--accent-rose)", label: "Error", pulse: false },
};

interface StatusDotProps {
  status?: Status;
  size?: 8 | 12;
  label?: string;
  showLabel?: boolean;
}

export function StatusDot({ status = "online", size = 8, label, showLabel = true }: StatusDotProps) {
  const s = statusMap[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        {s.pulse && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: s.color, opacity: 0.35, animationDuration: "2s" }}
          />
        )}
        <span
          className="relative inline-block rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: s.color,
            boxShadow: `0 0 0 2px color-mix(in oklab, ${s.color} 18%, transparent)`,
          }}
        />
      </span>
      {showLabel && (
        <span className="text-micro" style={{ color: "var(--text-secondary)" }}>
          {label ?? s.label}
        </span>
      )}
    </span>
  );
}
