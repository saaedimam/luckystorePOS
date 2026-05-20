import { TrendingUp, TrendingDown } from "lucide-react";

type Trend = "up" | "down" | "neutral";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: Trend;
  sparkline?: number[];
  accent?: "emerald" | "rose" | "gold" | "blue" | "amber" | "neutral";
}

const trendStyles: Record<Trend, { color: string; bg: string; Icon: typeof TrendingUp | null }> = {
  up: { color: "var(--accent-emerald)", bg: "var(--accent-emerald-soft)", Icon: TrendingUp },
  down: { color: "var(--accent-rose)", bg: "var(--accent-rose-soft)", Icon: TrendingDown },
  neutral: { color: "var(--text-secondary)", bg: "transparent", Icon: null },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  trend = "neutral",
  sparkline,
  accent = "neutral",
}: MetricCardProps) {
  const accentMap: Record<string, string> = {
    emerald: "var(--accent-emerald)",
    rose: "var(--accent-rose)",
    gold: "var(--accent-gold)",
    blue: "var(--accent-blue)",
    amber: "var(--accent-amber)",
    neutral: "var(--text-secondary)",
  };
  const t = trendStyles[trend];

  return (
    <div
      className="group relative rounded-lg border bg-surface p-5 transition-[background-color,border-color,transform] duration-300 hover:bg-surface-elevated hover:border-[var(--border-hover)] hover:-translate-y-px"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3 min-w-0">
          <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
            {label}
          </span>
          <span className="num-financial" style={{ color: "var(--text-primary)" }}>
            {value}
          </span>
        </div>
        {sparkline && (
          <div className="opacity-90">
            <Sparkline data={sparkline} color={accentMap[accent]} />
          </div>
        )}
      </div>

      {delta && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{
              backgroundColor: t.bg,
              color: t.color,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {t.Icon && <t.Icon size={11} strokeWidth={2.5} />}
            <span className="num">{delta}</span>
          </span>
          <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
            vs. last period
          </span>
        </div>
      )}
    </div>
  );
}
