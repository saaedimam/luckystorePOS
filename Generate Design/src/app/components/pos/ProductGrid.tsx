import { Package, Plus } from "lucide-react";
import type { Product } from "./data";
import { CATEGORIES } from "./data";

interface ProductGridProps {
  products: Product[];
  category: (typeof CATEGORIES)[number];
  onCategoryChange: (c: (typeof CATEGORIES)[number]) => void;
  onAdd: (p: Product) => void;
}

function stockMeta(stock: number) {
  if (stock === 0) return { label: "Out of stock", color: "var(--accent-rose)", bg: "var(--accent-rose-soft)" };
  if (stock <= 5) return { label: `Low · ${stock}`, color: "var(--accent-amber)", bg: "var(--accent-amber-soft)" };
  if (stock <= 10) return { label: `${stock} left`, color: "var(--accent-amber)", bg: "var(--accent-amber-soft)" };
  return { label: `${stock} in stock`, color: "var(--accent-emerald)", bg: "var(--accent-emerald-soft)" };
}

function fmtUSD(n: number) {
  return `৳${n.toFixed(2)}`;
}

function ProductCard({ p, onAdd }: { p: Product; onAdd: (p: Product) => void }) {
  const stock = stockMeta(p.stock);
  const disabled = p.stock === 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(p)}
      className="group relative text-left rounded-lg border overflow-hidden flex flex-col transition-[transform,border-color,background-color] duration-300 hover:border-[var(--border-hover)] hover:bg-[var(--surface-elevated)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${p.thumb} 0%, color-mix(in oklab, ${p.thumb} 50%, #000) 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6) 0%, transparent 50%)",
          }}
        />
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 num"
          style={{
            backgroundColor: "rgba(11,13,18,0.6)",
            color: "#E8E8E8",
            fontSize: 10,
            fontWeight: 600,
            backdropFilter: "blur(8px)",
          }}
        >
          {p.sku}
        </div>
        <div
          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5"
          style={{
            backgroundColor: stock.bg,
            color: stock.color,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.02em",
            backdropFilter: "blur(8px)",
          }}
        >
          <Package size={10} strokeWidth={2.5} />
          <span className="num">{stock.label}</span>
        </div>

        {/* Add affordance */}
        <div
          className="absolute bottom-2 right-2 h-8 w-8 rounded-md grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            backgroundColor: "var(--accent-gold)",
            color: "#0B0D12",
            boxShadow: "0 8px 20px -10px rgba(212,168,67,0.7)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </div>
      </div>

      {/* Body — fixed heights to prevent layout shift across cards */}
      <div className="p-3 flex flex-col gap-1" style={{ minHeight: 92 }}>
        <div className="text-body line-clamp-1" style={{ color: "var(--text-primary)" }}>
          {p.name}
        </div>
        {/* Bangla name — gets a 40% width buffer via min-height for expansion */}
        <div
          className="font-bangla line-clamp-1"
          style={{
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 500,
            minHeight: 20,
          }}
        >
          {p.nameBn}
        </div>
        <div className="flex items-baseline justify-between mt-1.5">
          <span className="num-financial" style={{ color: "var(--text-primary)", fontSize: 18 }}>
            {fmtUSD(p.price)}
          </span>
          <span className="text-micro num" style={{ color: "var(--text-tertiary)" }}>
            {p.category}
          </span>
        </div>
      </div>
    </button>
  );
}

export function ProductGrid({ products, category, onCategoryChange, onAdd }: ProductGridProps) {
  return (
    <section className="flex flex-col h-full min-h-0">
      {/* Category tabs */}
      <div
        className="flex items-center gap-1 px-1 py-1 rounded-md border self-start overflow-x-auto scrollbar-thin"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              className="relative h-8 px-3 rounded text-body transition-colors duration-300 whitespace-nowrap"
              style={{
                backgroundColor: active ? "var(--surface-elevated)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: active ? "inset 0 0 0 1px var(--border)" : undefined,
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="mt-4 flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-2">
        {products.length === 0 ? (
          <div
            className="h-full grid place-items-center rounded-lg border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", minHeight: 240 }}
          >
            <div className="flex flex-col items-center gap-2 py-12">
              <Package size={20} style={{ color: "var(--text-tertiary)" }} />
              <span className="text-body" style={{ color: "var(--text-secondary)" }}>
                No products match your search.
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={onAdd} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
