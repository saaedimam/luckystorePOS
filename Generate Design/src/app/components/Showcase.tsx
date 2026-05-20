import { useEffect, useState } from "react";
import { Moon, Sun, ArrowUpRight, Plus, Wifi, Printer, Activity } from "lucide-react";
import { Button } from "./Button";
import { MetricCard } from "./MetricCard";
import { StatusDot } from "./StatusDot";

const surfaceTokens = [
  { name: "background", light: "#F0F1F3", dark: "#0B0D12", usage: "Page canvas" },
  { name: "surface", light: "#FFFFFF", dark: "#151821", usage: "Cards, modals, sidebar" },
  { name: "surface-elevated", light: "#FFFFFF", dark: "#1A1F2E", usage: "Hover, active nav" },
  { name: "border", light: "#E8EAED", dark: "#2A2F3D", usage: "1px dividers" },
  { name: "border-hover", light: "#D1D5DB", dark: "#3D4451", usage: "Interactive hover" },
];

const textTokens = [
  { name: "text-primary", light: "#0F1117", dark: "#E8E8E8" },
  { name: "text-secondary", light: "#6B7280", dark: "#8B95A5" },
  { name: "text-tertiary", light: "#9CA3AF", dark: "#5A6270" },
  { name: "text-muted", light: "#D1D5DB", dark: "#3D4451" },
];

const accentTokens = [
  { name: "accent/gold", hex: "#D4A843", usage: "Primary CTAs · max 3 per screen" },
  { name: "accent/emerald", hex: "#10B981", usage: "Revenue · success · online" },
  { name: "accent/rose", hex: "#F43F5E", usage: "Expenses · critical · loss" },
  { name: "accent/blue", hex: "#3B82F6", usage: "bKash · info · hardware OK" },
  { name: "accent/amber", hex: "#F59E0B", usage: "Warnings · low stock · queued" },
];

const spacingTokens = [
  { name: "1", value: 4 },
  { name: "2", value: 8 },
  { name: "3", value: 12 },
  { name: "4", value: 16 },
  { name: "5", value: 20 },
  { name: "6", value: 24 },
  { name: "8", value: 32 },
  { name: "10", value: 40 },
  { name: "12", value: 48 },
  { name: "16", value: 64 },
];

function SectionHeader({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <header className="flex flex-col gap-2 mb-6">
      <span className="text-caption" style={{ color: "var(--accent-gold)" }}>
        {kicker}
      </span>
      <h2 className="text-heading" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      {desc && (
        <p className="text-body max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          {desc}
        </p>
      )}
    </header>
  );
}

function ColorSwatch({
  name,
  value,
  usage,
  large = false,
}: {
  name: string;
  value: string;
  usage?: string;
  large?: boolean;
}) {
  return (
    <div
      className="group rounded-lg border overflow-hidden transition-[border-color,transform] duration-300 hover:border-[var(--border-hover)] hover:-translate-y-px"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div
        className="w-full"
        style={{
          backgroundColor: value,
          height: large ? 88 : 64,
          borderBottom: "1px solid var(--border)",
        }}
      />
      <div className="px-3 py-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-body" style={{ color: "var(--text-primary)" }}>
            {name}
          </span>
          <span className="text-micro num" style={{ color: "var(--text-tertiary)" }}>
            {value.toUpperCase()}
          </span>
        </div>
        {usage && (
          <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
            {usage}
          </span>
        )}
      </div>
    </div>
  );
}

export function Showcase() {
  const [isDark, setIsDark] = useState(true);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const t = d.toLocaleTimeString("en-US", { hour12: false });
      setNow(t);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const spark = [4, 9, 6, 11, 8, 14, 12, 17, 15, 19, 18, 22];

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "var(--background)" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "color-mix(in oklab, var(--background) 72%, transparent)",
        }}
      >
        <div className="mx-auto max-w-[1280px] px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-md grid place-items-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, color-mix(in oklab, var(--accent-gold) 60%, #000) 100%)",
                boxShadow: "0 0 0 1px rgba(212,168,67,0.35), 0 8px 24px -12px rgba(212,168,67,0.6)",
              }}
            >
              <span style={{ color: "#0B0D12", fontWeight: 800, fontSize: 14 }}>L</span>
            </div>
            <div className="flex flex-col leading-none gap-1">
              <span className="text-body" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                Lucky Store POS
              </span>
              <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                Design System · v0.1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="hidden md:flex items-center gap-2 px-3 h-8 rounded-md border"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            >
              <StatusDot status="online" />
              <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>·</span>
              <span className="num text-micro" style={{ color: "var(--text-secondary)" }}>
                {now}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={isDark ? <Sun size={14} /> : <Moon size={14} />}
              onClick={() => setIsDark((v) => !v)}
            >
              {isDark ? "Light" : "Dark"}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1280px] px-8 py-12 flex flex-col gap-16">
        {/* Hero */}
        <section className="flex flex-col gap-5">
          <span className="text-caption" style={{ color: "var(--accent-gold)" }}>
            Tokens · Foundation · v0.1
          </span>
          <h1 className="text-hero max-w-3xl" style={{ color: "var(--text-primary)" }}>
            A mechanically precise design system for Lucky Store POS.
          </h1>
          <p className="text-body max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            Hyper-minimalist tokens, tabular numerals, and a dark-mode-first canvas. Every dimension
            divisible by 4. Every transition on{" "}
            <code
              className="num px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-primary)",
                fontSize: 12,
              }}
            >
              cubic-bezier(0.16, 1, 0.3, 1)
            </code>
            .
          </p>
        </section>

        {/* Metric cards */}
        <section>
          <SectionHeader
            kicker="Molecule"
            title="Metric Cards"
            desc="Tabular numerals locked at 20px / 800. Sparkline + delta badge. Hover lifts to surface-elevated."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Revenue · Today"
              value="$10,430.00"
              delta="+12.4%"
              trend="up"
              sparkline={spark}
              accent="emerald"
            />
            <MetricCard
              label="Expenses · Today"
              value="$3,218.75"
              delta="-4.1%"
              trend="down"
              sparkline={[14, 12, 13, 10, 9, 11, 8, 9, 7, 6, 5, 6]}
              accent="rose"
            />
            <MetricCard
              label="Orders · Today"
              value="1,284"
              delta="+186"
              trend="up"
              sparkline={[5, 6, 7, 9, 8, 11, 13, 14, 16, 15, 18, 20]}
              accent="gold"
            />
            <MetricCard
              label="বিক্রয় · আজ"
              value="৳১,২৩৪,৫৬৭"
              delta="+8.3%"
              trend="up"
              sparkline={[8, 9, 11, 10, 12, 13, 14, 13, 15, 16, 17, 19]}
              accent="blue"
            />
          </div>
        </section>

        {/* Surface tokens */}
        <section>
          <SectionHeader
            kicker="Tokens"
            title="Surface & Border"
            desc="Semantic surfaces — never hardcode. The current mode resolves to the value on the right."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {surfaceTokens.map((t) => (
              <ColorSwatch
                key={t.name}
                name={t.name}
                value={isDark ? t.dark : t.light}
                usage={t.usage}
              />
            ))}
          </div>
        </section>

        {/* Text tokens */}
        <section>
          <SectionHeader kicker="Tokens" title="Text" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {textTokens.map((t) => (
              <div
                key={t.name}
                className="rounded-lg border p-5 flex flex-col gap-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <span
                  style={{
                    color: isDark ? t.dark : t.light,
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Ag
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-body" style={{ color: "var(--text-primary)" }}>
                    {t.name}
                  </span>
                  <span className="text-micro num" style={{ color: "var(--text-tertiary)" }}>
                    {(isDark ? t.dark : t.light).toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accent tokens */}
        <section>
          <SectionHeader
            kicker="Tokens"
            title="Accents"
            desc="Mode-agnostic. They never invert between light and dark — brand and semantics stay intact."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {accentTokens.map((t) => (
              <ColorSwatch key={t.name} name={t.name} value={t.hex} usage={t.usage} large />
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <SectionHeader
            kicker="Foundation"
            title="Typography & Numerals"
            desc="Inter for Latin, Hind Siliguri for Bangla. All financial figures use tabular-nums."
          />
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr]">
              {/* Type ramp */}
              <div className="p-8 flex flex-col gap-6">
                <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
                  Type Ramp
                </span>
                {[
                  { cls: "text-hero", label: "hero · 32 / 800", sample: "Command Center" },
                  { cls: "text-heading", label: "heading · 20 / 700", sample: "Sales Overview" },
                  { cls: "text-subheading", label: "subheading · 16 / 600", sample: "Today's Revenue" },
                  { cls: "text-body", label: "body · 14 / 500", sample: "Showing 1,284 transactions across 3 cashiers." },
                  { cls: "text-caption", label: "caption · 12 / 600", sample: "STATUS · LIVE" },
                  { cls: "text-micro", label: "micro · 11 / 500", sample: "Updated 4 seconds ago" },
                ].map((row) => (
                  <div key={row.cls} className="flex flex-col gap-2">
                    <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                      {row.label}
                    </span>
                    <span className={row.cls} style={{ color: "var(--text-primary)" }}>
                      {row.sample}
                    </span>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block" style={{ backgroundColor: "var(--border)" }} />

              {/* Numerals */}
              <div className="p-8 flex flex-col gap-6 border-t lg:border-t-0" style={{ borderColor: "var(--border)" }}>
                <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
                  Tabular Numerals
                </span>
                <div className="flex flex-col gap-3">
                  <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                    English · Inter
                  </span>
                  <span className="num-financial" style={{ color: "var(--accent-emerald)" }}>
                    $10,430.00
                  </span>
                  <div
                    className="flex flex-col gap-1 num pt-2 mt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {["0123456789", "$1,234,567.89", "-2,481.55"].map((r) => (
                      <span key={r} className="num text-body" style={{ color: "var(--text-secondary)" }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                    Bangla · Hind Siliguri
                  </span>
                  <span
                    className="num-financial font-bangla"
                    style={{ color: "var(--accent-emerald)" }}
                  >
                    ৳১,২৩৪,৫৬৭
                  </span>
                  <div
                    className="flex flex-col gap-1 font-bangla pt-2 mt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {["০১২৩৪৫৬৭৮৯", "৳১২,৩৪৫.৬৭", "−২,৪৮১.৫৫"].map((r) => (
                      <span key={r} className="text-body font-bangla" style={{ color: "var(--text-secondary)" }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons & Status */}
        <section>
          <SectionHeader
            kicker="Atoms"
            title="Buttons & Status"
            desc="Primary uses accent/gold with a 200ms cross-fade. Status dots pulse at the 2s skeleton tempo."
          />
          <div
            className="rounded-lg border p-8 flex flex-col gap-8"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <div className="flex flex-col gap-3">
              <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
                Primary CTA · accent/gold
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" leftIcon={<Plus size={14} strokeWidth={2.5} />}>
                  New sale
                </Button>
                <Button size="md" rightIcon={<ArrowUpRight size={14} strokeWidth={2.5} />}>
                  Open command center
                </Button>
                <Button size="lg">Checkout · $10,430.00</Button>
                <Button size="md" loading>
                  Syncing
                </Button>
                <Button size="md" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
                Secondary · Ghost · Destructive
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" size="md">
                  Cancel
                </Button>
                <Button variant="ghost" size="md">
                  Skip for now
                </Button>
                <Button variant="destructive" size="md">
                  Void transaction
                </Button>
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="rounded-md border p-4 flex items-center gap-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}
              >
                <Activity size={16} style={{ color: "var(--accent-emerald)" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-body" style={{ color: "var(--text-primary)" }}>
                    Sync · live
                  </div>
                  <div className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                    Real-time queue empty
                  </div>
                </div>
                <StatusDot status="online" showLabel={false} />
              </div>
              <div
                className="rounded-md border p-4 flex items-center gap-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}
              >
                <Printer size={16} style={{ color: "var(--accent-blue)" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-body" style={{ color: "var(--text-primary)" }}>
                    Printer · paired
                  </div>
                  <div className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                    EPSON TM-T20III · 58mm
                  </div>
                </div>
                <StatusDot status="online" showLabel={false} />
              </div>
              <div
                className="rounded-md border p-4 flex items-center gap-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}
              >
                <Wifi size={16} style={{ color: "var(--accent-amber)" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-body" style={{ color: "var(--text-primary)" }}>
                    Network · queued
                  </div>
                  <div className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                    7 transactions waiting
                  </div>
                </div>
                <StatusDot status="syncing" showLabel={false} />
              </div>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section>
          <SectionHeader
            kicker="Foundation"
            title="Spacing Grid"
            desc="4px base unit. Every padding, gap, and margin in the system is divisible by 4."
          />
          <div
            className="rounded-lg border p-6"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <div className="flex flex-col gap-3">
              {spacingTokens.map((s) => (
                <div key={s.name} className="flex items-center gap-4">
                  <span
                    className="num text-micro w-12 shrink-0"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    space/{s.name}
                  </span>
                  <span
                    className="num text-micro w-12 shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.value}px
                  </span>
                  <span
                    className="h-2 rounded-sm"
                    style={{ width: s.value * 4, backgroundColor: "var(--accent-gold)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Motion */}
        <section>
          <SectionHeader
            kicker="Motion"
            title="Physics"
            desc="Mechanical, never bouncy. Page transitions land on the same easing as modals."
          />
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--surface-elevated)" }}>
                  {["Interaction", "Duration", "Easing"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-caption px-5 py-3 border-b"
                      style={{ color: "var(--text-tertiary)", borderColor: "var(--border)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Page transition", "300ms", "cubic-bezier(0.16, 1, 0.3, 1)"],
                  ["Modal open", "200ms", "cubic-bezier(0.16, 1, 0.3, 1)"],
                  ["Modal close", "150ms", "ease-in"],
                  ["Drawer slide", "250ms", "cubic-bezier(0.32, 0.72, 0, 1)"],
                  ["Button press", "100ms", "ease-out · scale 0.97"],
                  ["Cart item add", "400ms", "spring · damping 25"],
                  ["Skeleton pulse", "2s", "ease-in-out · infinite"],
                  ["Sync spinner", "1s", "linear · infinite"],
                ].map(([a, b, c]) => (
                  <tr
                    key={a}
                    className="transition-colors duration-150 hover:bg-[var(--surface-elevated)]"
                  >
                    <td
                      className="px-5 py-3 text-body border-b"
                      style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                    >
                      {a}
                    </td>
                    <td
                      className="px-5 py-3 text-body num border-b"
                      style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
                    >
                      {b}
                    </td>
                    <td
                      className="px-5 py-3 text-body num border-b"
                      style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
                    >
                      {c}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer
          className="pt-8 pb-2 flex items-center justify-between border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
            Lucky Store POS · Design System Foundation
          </span>
          <span className="text-micro num" style={{ color: "var(--text-tertiary)" }}>
            v0.1.0 · {isDark ? "dark" : "light"}
          </span>
        </footer>
      </main>
    </div>
  );
}
