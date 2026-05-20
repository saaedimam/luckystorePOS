import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ScanLine,
  Plus,
  Edit2,
  Trash2,
  ArrowDown,
  ArrowUp,
  Package,
  Check
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ProductDrawer, type ProductDraft } from "./ProductDrawer";
import { SuccessToast, type ToastPayload } from "./SuccessToast";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

type StockFilter = "all" | "low" | "out";
type ProductStatus = "active" | "inactive";
type SortKey = "name" | "sku" | "stock" | "price";
type SortDir = "asc" | "desc";

interface Product {
  id: string;
  name: string;
  variant: string;
  sku: string;
  category: string;
  stock: number;
  maxStock: number;
  price: number;
  status: ProductStatus;
  color: string;
  initials: string;
  bangla?: boolean;
}

function CustomCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onChange}
      className="size-[18px] rounded border flex items-center justify-center cursor-pointer transition-colors duration-200 shrink-0"
      style={{
        backgroundColor: checked ? "var(--accent-blue)" : "var(--surface-elevated)",
        borderColor: checked ? "var(--accent-blue)" : "var(--border)",
        boxShadow: checked ? "0 0 0 2px rgba(59,130,246,0.2)" : undefined,
      }}
    >
      {checked && <Check size={12} strokeWidth={3} color="#FFFFFF" />}
    </div>
  );
}

const PRODUCTS: Product[] = [
  {
    id: "PRD-001",
    name: "Premium Wireless Headphones",
    variant: "Matte Black / Over-ear",
    sku: "WH-PRO-001-BLK",
    category: "Electronics",
    stock: 45,
    maxStock: 100,
    price: 12500,
    status: "active",
    color: "#3B82F6",
    initials: "WH",
  },
  {
    id: "PRD-002",
    name: "Mechanical Keyboard",
    variant: "TKL / Cherry MX Red",
    sku: "KB-MEC-TKL-RED",
    category: "Peripherals",
    stock: 12,
    maxStock: 50,
    price: 8900,
    status: "active",
    color: "#8B5CF6",
    initials: "KB",
  },
  {
    id: "PRD-003",
    name: "USB-C Hub 7-in-1",
    variant: "Space Grey / Aluminum",
    sku: "HUB-7C-SGR-001",
    category: "Accessories",
    stock: 0,
    maxStock: 80,
    price: 3200,
    status: "inactive",
    color: "#6B7280",
    initials: "HB",
  },
  {
    id: "PRD-004",
    name: "Ergonomic Office Chair",
    variant: "Mesh Back / Black Frame",
    sku: "CHR-ERG-BLK-001",
    category: "Furniture",
    stock: 8,
    maxStock: 30,
    price: 45000,
    status: "active",
    color: "#10B981",
    initials: "EC",
  },
  {
    id: "PRD-005",
    name: "Wireless Charging Pad",
    variant: "15W Fast / White",
    sku: "CHG-WLS-15W-WHT",
    category: "Electronics",
    stock: 67,
    maxStock: 150,
    price: 2100,
    status: "active",
    color: "#F59E0B",
    initials: "WC",
  },
  {
    id: "PRD-006",
    name: "4K Webcam Pro",
    variant: "Sony Sensor / Auto-Focus",
    sku: "CAM-WEB-4K-001",
    category: "Electronics",
    stock: 19,
    maxStock: 60,
    price: 18500,
    status: "active",
    color: "#EF4444",
    initials: "4K",
  },
  {
    id: "PRD-007",
    name: "Laptop Stand Adjustable",
    variant: "Aluminum / 6-Angle",
    sku: "STD-LAP-ALU-6AJ",
    category: "Accessories",
    stock: 33,
    maxStock: 100,
    price: 4500,
    status: "active",
    color: "#14B8A6",
    initials: "LS",
  },
  {
    id: "PRD-008",
    name: "NVMe SSD 1TB",
    variant: "M.2 2280 / PCIe Gen 4",
    sku: "SSD-NVM-1T-PCG4",
    category: "Storage",
    stock: 3,
    maxStock: 40,
    price: 9800,
    status: "active",
    color: "#F97316",
    initials: "SS",
  },
  {
    id: "PRD-009",
    name: "Monitor Arm Single",
    variant: "Full Motion / VESA 75/100",
    sku: "ARM-MON-SGL-001",
    category: "Furniture",
    stock: 0,
    maxStock: 25,
    price: 6200,
    status: "inactive",
    color: "#EC4899",
    initials: "MA",
  },
  // ── Bangla Shift Test Row ─────────────────────────────────────────────────
  // This row proves the 40% width buffer handles extreme Bangla glyphs without
  // truncation or layout shift across Product, Variant, SKU, and Category cells.
  {
    id: "PRD-010",
    name: "প্রিমিয়াম স্মার্টফোন প্রোটেক্টিভ কেস",
    variant: "স্যামসাং গ্যালাক্সি এস২৪ আল্ট্রা / ম্যাট ব্ল্যাক",
    sku: "কেস-এস২৪-ম্যাট-০০১",
    category: "আনুষাঙ্গিক",
    stock: 5,
    maxStock: 60,
    price: 1200,
    status: "active",
    color: "#D4A843",
    initials: "বা",
    bangla: true,
  },
];

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  Electronics:  { bg: "rgba(59,130,246,0.12)",  color: "#60A5FA" },
  Peripherals:  { bg: "rgba(139,92,246,0.12)",  color: "#A78BFA" },
  Accessories:  { bg: "rgba(245,158,11,0.12)",  color: "#FBB03B" },
  Furniture:    { bg: "rgba(16,185,129,0.12)",  color: "#34D399" },
  Storage:      { bg: "rgba(249,115,22,0.12)",  color: "#FB923C" },
  "আনুষাঙ্গিক":  { bg: "rgba(212,168,67,0.12)", color: "#D4A843" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ProductThumbnail({ product }: { product: Product }) {
  return (
    <div
      className="size-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold tracking-tight select-none"
      style={{
        backgroundColor: product.color + "22",
        color: product.color,
        fontFamily: product.bangla ? "'Hind Siliguri', sans-serif" : "Inter, system-ui",
      }}
    >
      {product.initials}
    </div>
  );
}

function StockBar({ stock, maxStock }: { stock: number; maxStock: number }) {
  const pct = maxStock > 0 ? Math.min((stock / maxStock) * 100, 100) : 0;
  const barColor =
    stock === 0
      ? "var(--accent-rose)"
      : stock < 20
      ? "var(--accent-amber)"
      : "var(--accent-emerald)";
  const textColor = barColor;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-16 h-1.5 rounded-full overflow-hidden shrink-0"
        style={{ backgroundColor: "var(--surface-elevated)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <span
        className="font-mono tabular-nums text-xs w-6 text-right"
        style={{ color: textColor }}
      >
        {stock}
      </span>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const s = CATEGORY_STYLES[category] ?? {
    bg: "var(--surface-elevated)",
    color: "var(--text-secondary)",
  };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {category}
    </span>
  );
}

function StatusChip({ status }: { status: ProductStatus }) {
  const active = status === "active";
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
      style={{
        borderColor: "var(--border)",
        backgroundColor: active
          ? "rgba(16,185,129,0.10)"
          : "var(--surface-elevated)",
        color: active ? "var(--accent-emerald)" : "var(--text-tertiary)",
      }}
    >
      <div
        className="size-1.5 rounded-full"
        style={{
          backgroundColor: active
            ? "var(--accent-emerald)"
            : "var(--text-tertiary)",
        }}
      />
      <span className="text-[10px] uppercase font-bold tracking-wider">
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function InventoryGrid() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("lucky_store_inventory");
      if (saved) return JSON.parse(saved);
    } catch {}
    return PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem("lucky_store_inventory", JSON.stringify(products));
  }, [products]);

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  // Bulk selection mechanics
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);

  function toggleSelectAll(e: React.MouseEvent) {
    e.stopPropagation();
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function confirmBulkDelete() {
    setProducts((prev) => prev.filter((row) => !selectedIds.has(row.id)));
    setTimeout(() => {
      setToast({ message: `${selectedIds.size} products permanently deleted`, tone: "destructive" });
      setSelectedIds(new Set());
      setPendingBulkDelete(false);
    }, 180);
  }

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(p: Product) {
    setEditing({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      stock: p.stock,
    });
    setDrawerOpen(true);
  }

  function handleSave(draft: ProductDraft) {
    setDrawerOpen(false);
    const isBangla = /[ঀ-৿]/.test(draft.name);
    setProducts((prev) => {
      if (draft.id) {
        return prev.map((p) =>
          p.id === draft.id
            ? {
                ...p,
                name: draft.name,
                sku: draft.sku,
                category: draft.category,
                price: draft.price,
                stock: draft.stock,
                status: draft.stock === 0 ? "inactive" : "active",
                bangla: isBangla || p.bangla,
              }
            : p
        );
      }
      const nextId = `PRD-${String(prev.length + 1).padStart(3, "0")}`;
      const palette = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#14B8A6"];
      const color = palette[prev.length % palette.length];
      const initials =
        draft.name
          .split(/\s+/)
          .map((w) => w[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase() || "··";
      const created: Product = {
        id: nextId,
        name: draft.name,
        variant: "—",
        sku: draft.sku || nextId,
        category: draft.category,
        stock: draft.stock,
        maxStock: Math.max(draft.stock * 2, 50),
        price: draft.price,
        status: draft.stock === 0 ? "inactive" : "active",
        color,
        initials,
        bangla: isBangla,
      };
      return [created, ...prev];
    });
    setTimeout(() => {
      setToast({
        message: draft.id
          ? `${draft.name} updated successfully`
          : `${draft.name} created successfully`,
        tone: "success",
      });
    }, 180);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const p = pendingDelete;
    setPendingDelete(null);
    setProducts((prev) => prev.filter((row) => row.id !== p.id));
    setTimeout(() => {
      setToast({ message: `${p.name} deleted`, tone: "destructive" });
    }, 180);
  }
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let items = products;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.variant.toLowerCase().includes(q)
      );
    }

    if (stockFilter === "low") items = items.filter((p) => p.stock > 0 && p.stock < 20);
    if (stockFilter === "out") items = items.filter((p) => p.stock === 0);

    return [...items].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === "name")  { av = a.name;  bv = b.name; }
      else if (sortKey === "sku") { av = a.sku; bv = b.sku; }
      else if (sortKey === "stock") { av = a.stock; bv = b.stock; }
      else { av = a.price; bv = b.price; }

      if (typeof av === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv as string)
          : (bv as string).localeCompare(av);
      }
      return sortDir === "asc" ? av - (bv as number) : (bv as number) - av;
    });
  }, [products, search, stockFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ArrowDown className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3" style={{ color: "var(--accent-gold)" }} />
      : <ArrowDown className="w-3 h-3" style={{ color: "var(--accent-gold)" }} />;
  }

  const lowCount = products.filter((p) => p.stock > 0 && p.stock < 20).length;
  const outCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

      {/* ── Sticky Workspace Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-md shrink-0"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "color-mix(in oklab, var(--surface) 88%, transparent)",
        }}
      >
        {/* Title + CTA row */}
        <div className="flex items-start justify-between px-8 pt-6 pb-4 gap-6">
          <div className="min-w-0">
            <p
              className="text-[10px] uppercase font-bold tracking-widest mb-1"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.1em" }}
            >
              Admin › Inventory
            </p>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                lineHeight: 1.1,
              }}
            >
              Inventory &amp; Stock Center
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-1">
            {/* Ghost: Scan to Manage */}
            <button
              className="flex items-center gap-2 h-10 px-4 rounded-lg border transition-all duration-200"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--surface-elevated)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <ScanLine size={15} strokeWidth={2} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Scan to Manage</span>
            </button>

            {/* Primary: Add New Product */}
            <button
              onClick={openCreate}
              className="flex items-center gap-2 h-10 px-5 rounded-lg transition-all duration-200 active:scale-95"
              style={{
                backgroundColor: "var(--accent-gold)",
                color: "#0B0D12",
                fontSize: 13,
                fontWeight: 700,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >
              <Plus size={15} strokeWidth={2.5} />
              Add New Product
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 px-8 pb-4">
          {/* Search input */}
          <div className="relative w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              type="text"
              placeholder="Search products, SKU, variant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border pl-9 pr-4 outline-none transition-all duration-200"
              style={{
                fontSize: 13,
                borderColor: "var(--border)",
                backgroundColor: "var(--input-background)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent-gold)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>

          {/* Segmented stock toggle */}
          <div
            className="flex items-center p-1 rounded-lg border gap-0.5"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-elevated)",
            }}
          >
            {(
              [
                { v: "all" as StockFilter, label: "All", count: products.length },
                { v: "low" as StockFilter, label: "Low Stock", count: lowCount },
                { v: "out" as StockFilter, label: "Out of Stock", count: outCount },
              ]
            ).map(({ v, label, count }) => (
              <button
                key={v}
                onClick={() => setStockFilter(v)}
                className="relative h-7 px-3 rounded-md transition-all duration-200"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  backgroundColor:
                    stockFilter === v ? "var(--surface)" : "transparent",
                  color:
                    stockFilter === v
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  boxShadow:
                    stockFilter === v
                      ? "0 1px 3px rgba(0,0,0,0.2)"
                      : undefined,
                }}
              >
                {label}
                {count > 0 && v !== "all" && (
                  <span
                    className="ml-1.5 inline-flex items-center justify-center rounded-full w-4 h-4 text-[9px] font-black"
                    style={{
                      backgroundColor:
                        v === "out"
                          ? "rgba(244,63,94,0.15)"
                          : "rgba(245,158,11,0.15)",
                      color:
                        v === "out"
                          ? "var(--accent-rose)"
                          : "var(--accent-amber)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Live count */}
          <span
            className="ml-auto text-[11px] font-mono tabular-nums"
            style={{ color: "var(--text-tertiary)" }}
          >
            {filtered.length} / {products.length} products
          </span>
        </div>
      </header>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <Table>
            <TableHeader>
              <TableRow
                className="hover:bg-transparent border-0"
                style={{ backgroundColor: "var(--surface-elevated)" }}
              >
                {/* Checkbox col */}
                <TableHead className="w-12 pl-6 border-b" style={{ borderColor: "var(--border)" }}>
                  <CustomCheckbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>

                {/* Thumb col */}
                <TableHead className="w-14 pl-2 border-b" style={{ borderColor: "var(--border)" }} />

                {/* Product */}
                <TableHead
                  className="cursor-pointer group border-b"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary uppercase font-black tracking-widest py-1">
                    Product <SortIcon col="name" />
                  </div>
                </TableHead>

                {/* SKU */}
                <TableHead
                  className="cursor-pointer group border-b"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => handleSort("sku")}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary uppercase font-black tracking-widest py-1">
                    SKU <SortIcon col="sku" />
                  </div>
                </TableHead>

                {/* Category */}
                <TableHead
                  className="border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="text-[10px] text-text-tertiary uppercase font-black tracking-widest py-1">
                    Category
                  </div>
                </TableHead>

                {/* Current Stock */}
                <TableHead
                  className="cursor-pointer group border-b"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => handleSort("stock")}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary uppercase font-black tracking-widest py-1">
                    Current Stock <SortIcon col="stock" />
                  </div>
                </TableHead>

                {/* Unit Price */}
                <TableHead
                  className="cursor-pointer group border-b text-right"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-text-tertiary uppercase font-black tracking-widest py-1">
                    Unit Price <SortIcon col="price" />
                  </div>
                </TableHead>

                {/* Status */}
                <TableHead
                  className="border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="text-[10px] text-text-tertiary uppercase font-black tracking-widest py-1">
                    Status
                  </div>
                </TableHead>

                {/* Actions */}
                <TableHead
                  className="w-20 pr-4 border-b text-right"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="text-[10px] text-text-tertiary uppercase font-black tracking-widest py-1 text-right">
                    Actions
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((product, idx) => (
                <TableRow
                  key={product.id}
                  className="group cursor-pointer border-b transition-colors duration-150"
                  style={{
                    borderColor:
                      idx === filtered.length - 1 ? "transparent" : "var(--border)",
                    backgroundColor: selectedIds.has(product.id) ? "rgba(59,130,246,0.05)" : "transparent",
                  }}
                  onClick={(e) => toggleSelect(product.id, e)}
                  onMouseEnter={(e) => {
                    if (!selectedIds.has(product.id)) {
                      e.currentTarget.style.backgroundColor = "var(--surface-elevated)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedIds.has(product.id)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {/* Checkbox */}
                  <TableCell className="pl-6 py-3 w-12">
                    <CustomCheckbox
                      checked={selectedIds.has(product.id)}
                      onChange={(e) => toggleSelect(product.id, e)}
                    />
                  </TableCell>

                  {/* Thumbnail */}
                  <TableCell className="pl-2 py-3 w-14">
                    <ProductThumbnail product={product} />
                  </TableCell>

                  {/* Product name + variant */}
                  <TableCell className="py-3 max-w-[240px]">
                    <p
                      className="font-semibold text-sm leading-tight"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: product.bangla
                          ? "'Hind Siliguri', sans-serif"
                          : undefined,
                      }}
                    >
                      {product.name}
                    </p>
                    <p
                      className="text-xs mt-0.5 leading-tight"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: product.bangla
                          ? "'Hind Siliguri', sans-serif"
                          : undefined,
                      }}
                    >
                      {product.variant}
                    </p>
                  </TableCell>

                  {/* SKU */}
                  <TableCell className="py-3">
                    <span
                      className="font-mono tabular-nums text-xs"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: product.bangla
                          ? "'Hind Siliguri', monospace"
                          : undefined,
                      }}
                    >
                      {product.sku}
                    </span>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-3">
                    <CategoryBadge category={product.category} />
                  </TableCell>

                  {/* Stock bar */}
                  <TableCell className="py-3">
                    <StockBar stock={product.stock} maxStock={product.maxStock} />
                  </TableCell>

                  {/* Price */}
                  <TableCell className="py-3 text-right">
                    <span
                      className="font-mono tabular-nums text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      ৳&nbsp;{product.price.toLocaleString("en-IN")}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3">
                    <StatusChip status={product.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(product);
                        }}
                        className="p-1.5 rounded-md transition-colors duration-150"
                        title="Edit product"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--surface-elevated)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(product);
                        }}
                        className="p-1.5 rounded-md transition-colors duration-150"
                        title="Delete product"
                        style={{ color: "var(--accent-rose)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgba(244,63,94,0.10)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Empty state */}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="size-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: "var(--surface-elevated)" }}
                      >
                        <Package
                          size={22}
                          style={{ color: "var(--text-tertiary)" }}
                        />
                      </div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        No products match your filters
                      </p>
                      <button
                        className="text-xs transition-colors"
                        style={{ color: "var(--accent-gold)" }}
                        onClick={() => {
                          setSearch("");
                          setStockFilter("all");
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5 mt-4 px-1">
          {[
            { color: "var(--accent-emerald)", label: "Healthy stock  (>20)" },
            { color: "var(--accent-amber)",   label: "Low stock  (<20)" },
            { color: "var(--accent-rose)",    label: "Out of stock" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-6 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  fontWeight: 500,
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ProductDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
        onSave={handleSave}
      />
      
      {/* ── Floating Bulk Action Bar ────────────────────────────────────────── */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-2 rounded-full border shadow-2xl backdrop-blur-xl"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "color-mix(in oklab, var(--surface) 85%, transparent)",
          transform: `translate(-50%, ${selectedIds.size > 0 ? "0" : "150%"}) scale(${selectedIds.size > 0 ? 1 : 0.95})`,
          opacity: selectedIds.size > 0 ? 1 : 0,
          pointerEvents: selectedIds.size > 0 ? "auto" : "none",
          transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="flex items-center gap-2 pl-3">
          <span className="flex items-center justify-center size-5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: "var(--accent-blue)" }}>
            {selectedIds.size}
          </span>
          <span className="text-sm font-semibold pr-2 border-r" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
            Selected
          </span>
        </div>

        <div className="flex items-center gap-1 pr-1">
          <button
            onClick={() => setSelectedIds(new Set())}
            className="h-8 px-3 rounded-full text-xs font-semibold transition-colors duration-200"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-elevated)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Clear
          </button>
          
          <button
            onClick={() => setPendingBulkDelete(true)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-bold transition-all duration-200"
            style={{
              color: "var(--accent-rose)",
              backgroundColor: "rgba(244,63,94,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-rose)";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(244,63,94,0.1)";
              e.currentTarget.style.color = "var(--accent-rose)";
            }}
          >
            <Trash2 size={14} />
            Delete Selected
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        open={!!pendingDelete || pendingBulkDelete}
        productName={pendingBulkDelete ? `${selectedIds.size} Products` : (pendingDelete?.name ?? null)}
        isBangla={pendingBulkDelete ? false : pendingDelete?.bangla}
        onCancel={() => { setPendingDelete(null); setPendingBulkDelete(false); }}
        onConfirm={pendingBulkDelete ? confirmBulkDelete : confirmDelete}
      />
      <SuccessToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
