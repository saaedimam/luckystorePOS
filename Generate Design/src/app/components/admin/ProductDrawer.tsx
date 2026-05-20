import { useState, useEffect, useRef } from "react";
import { X, ImagePlus, ChevronDown, Check, AlertCircle } from "lucide-react";

export interface ProductDraft {
  id?: string;
  name: string;
  nameBn?: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
}

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  initial?: ProductDraft | null;
  onSave?: (draft: ProductDraft) => void;
}

const CATEGORIES = [
  "Electronics",
  "Peripherals",
  "Accessories",
  "Furniture",
  "Storage",
  "আনুষাঙ্গিক",
];

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const DUR = "250ms";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block mb-2"
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </label>
  );
}

function ErrorCaption({ msg }: { msg: string }) {
  return (
    <div
      className="flex items-center gap-1.5 mt-1.5"
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--accent-rose)",
      }}
    >
      <AlertCircle size={11} strokeWidth={2.5} />
      {msg}
    </div>
  );
}

function ThemedInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    bangla?: boolean;
    invalid?: boolean;
  }
) {
  const { bangla, invalid, style, ...rest } = props;
  const [focused, setFocused] = useState(false);
  const ringColor = invalid ? "var(--accent-rose)" : "var(--accent-blue)";
  return (
    <input
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      className="w-full h-10 px-3 rounded-lg border outline-none transition-all duration-150"
      style={{
        fontSize: 13,
        fontFamily: bangla ? "'Hind Siliguri', sans-serif" : undefined,
        color: "var(--text-primary)",
        backgroundColor: "var(--input-background)",
        borderColor: invalid
          ? "var(--accent-rose)"
          : focused
          ? "var(--accent-blue)"
          : "var(--border)",
        boxShadow: focused
          ? `0 0 0 2px color-mix(in oklab, ${ringColor} 35%, transparent), 0 0 0 4px var(--surface)`
          : "none",
        ...style,
      }}
    />
  );
}

export function ProductDrawer({
  open,
  onClose,
  initial,
  onSave,
}: ProductDrawerProps) {
  const [mounted, setMounted] = useState(open);
  const [animating, setAnimating] = useState(false);

  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!initial?.id;

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
      // Prefill
      setNameEn(initial?.name ?? "");
      setNameBn(initial?.nameBn ?? "");
      setSku(initial?.sku ?? "");
      setCategory(initial?.category ?? "Electronics");
      setPrice(initial?.price ? String(initial.price) : "");
      setStock(initial?.stock != null ? String(initial.stock) : "");
      setErrors({});
      setPreview(null);
      setCatOpen(false);
    } else if (mounted) {
      setAnimating(false);
      const t = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(t);
    }
  }, [open, initial, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleSave() {
    const next: { name?: string; price?: string } = {};
    if (!nameEn.trim()) next.name = "Product name is required";
    const priceNum = parseFloat(price);
    if (!price.trim() || isNaN(priceNum) || priceNum <= 0)
      next.price = "Valid base price required";
    setErrors(next);
    if (next.name || next.price) return;

    onSave?.({
      id: initial?.id,
      name: nameEn.trim(),
      nameBn: nameBn.trim() || undefined,
      sku: sku.trim(),
      category,
      price: priceNum,
      stock: parseInt(stock || "0", 10) || 0,
    });
  }

  const title = isEdit ? `Edit ${initial?.name}` : "Create New Product";

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          opacity: animating ? 1 : 0,
          transition: `opacity ${DUR} ${EASE}`,
        }}
      />

      <aside
        className="absolute top-0 right-0 h-full flex flex-col border-l"
        style={{
          width: 450,
          maxWidth: "100vw",
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "-24px 0 48px rgba(0,0,0,0.45)",
          transform: animating ? "translateX(0)" : "translateX(100%)",
          transition: `transform ${DUR} ${EASE}`,
          willChange: "transform",
        }}
      >
        <header
          className="flex items-center justify-between px-6 h-16 border-b shrink-0 gap-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0">
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              {isEdit ? "Modify Product" : "Inventory Action"}
            </p>
            <h2
              className="truncate"
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.2,
                fontFamily:
                  isEdit && /[ঀ-৿]/.test(initial?.name ?? "")
                    ? "'Hind Siliguri', sans-serif"
                    : undefined,
              }}
              title={title}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-elevated)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <FieldLabel>Product Media</FieldLabel>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer overflow-hidden"
              style={{
                height: 160,
                borderColor: dragOver
                  ? "var(--accent-blue)"
                  : "rgba(255,255,255,0.20)",
                backgroundColor: dragOver
                  ? "color-mix(in oklab, var(--accent-blue) 8%, var(--input-background))"
                  : "var(--input-background)",
              }}
              onMouseEnter={(e) => {
                if (!dragOver)
                  e.currentTarget.style.backgroundColor = "var(--surface-elevated)";
              }}
              onMouseLeave={(e) => {
                if (!dragOver)
                  e.currentTarget.style.backgroundColor = "var(--input-background)";
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div
                    className="size-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--surface-elevated)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <ImagePlus size={18} />
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    Drag &amp; drop image, or click to browse
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                    PNG, JPG up to 5MB · 1:1 ratio recommended
                  </p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </button>
          </div>

          <div>
            <FieldLabel>Product Name (English)</FieldLabel>
            <ThemedInput
              type="text"
              placeholder="e.g. Premium Wireless Headphones"
              value={nameEn}
              invalid={!!errors.name}
              onChange={(e) => {
                setNameEn(e.target.value);
                if (errors.name && e.target.value.trim())
                  setErrors((p) => ({ ...p, name: undefined }));
              }}
            />
            {errors.name && <ErrorCaption msg={errors.name} />}
          </div>

          <div>
            <FieldLabel>Product Name (Bangla)</FieldLabel>
            <ThemedInput
              type="text"
              placeholder="যেমন: প্রিমিয়াম ওয়্যারলেস হেডফোন"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              bangla
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>SKU</FieldLabel>
              <ThemedInput
                type="text"
                placeholder="WH-PRO-001-BLK"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                style={{
                  fontFamily: "ui-monospace, monospace",
                  letterSpacing: "0.02em",
                }}
              />
            </div>
            <div className="relative">
              <FieldLabel>Category</FieldLabel>
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                className="w-full h-10 px-3 rounded-lg border outline-none transition-all duration-150 flex items-center justify-between"
                style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  backgroundColor: "var(--input-background)",
                  borderColor: catOpen ? "var(--accent-blue)" : "var(--border)",
                  boxShadow: catOpen
                    ? "0 0 0 2px color-mix(in oklab, var(--accent-blue) 35%, transparent), 0 0 0 4px var(--surface)"
                    : "none",
                  fontFamily:
                    category === "আনুষাঙ্গিক"
                      ? "'Hind Siliguri', sans-serif"
                      : undefined,
                }}
              >
                <span>{category}</span>
                <ChevronDown
                  size={14}
                  style={{
                    color: "var(--text-tertiary)",
                    transform: catOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease",
                  }}
                />
              </button>
              {catOpen && (
                <div
                  className="absolute z-10 mt-1.5 left-0 right-0 rounded-lg border overflow-hidden"
                  style={{
                    backgroundColor: "var(--surface-elevated)",
                    borderColor: "var(--border)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCategory(c);
                        setCatOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 h-9 transition-colors"
                      style={{
                        fontSize: 12,
                        color: "var(--text-primary)",
                        backgroundColor:
                          c === category
                            ? "color-mix(in oklab, var(--accent-blue) 10%, transparent)"
                            : "transparent",
                        fontFamily:
                          c === "আনুষাঙ্গিক"
                            ? "'Hind Siliguri', sans-serif"
                            : undefined,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "color-mix(in oklab, var(--accent-blue) 12%, transparent)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          c === category
                            ? "color-mix(in oklab, var(--accent-blue) 10%, transparent)"
                            : "transparent")
                      }
                    >
                      <span>{c}</span>
                      {c === category && (
                        <Check size={13} style={{ color: "var(--accent-blue)" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Base Price (৳)</FieldLabel>
              <ThemedInput
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={price}
                invalid={!!errors.price}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.]/g, "");
                  setPrice(v);
                  if (errors.price && v.trim())
                    setErrors((p) => ({ ...p, price: undefined }));
                }}
                style={{
                  fontFeatureSettings: '"tnum"',
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "ui-monospace, monospace",
                }}
              />
              {errors.price && <ErrorCaption msg={errors.price} />}
            </div>
            <div>
              <FieldLabel>Initial Stock</FieldLabel>
              <ThemedInput
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                style={{
                  fontFeatureSettings: '"tnum"',
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "ui-monospace, monospace",
                }}
              />
            </div>
          </div>
        </div>

        <footer
          className="shrink-0 px-6 py-4 border-t flex items-center justify-end gap-3"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "color-mix(in oklab, var(--surface) 96%, transparent)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg transition-colors duration-150"
            style={{
              fontSize: 13,
              fontWeight: 600,
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-10 px-5 rounded-lg transition-all duration-150 active:scale-[0.97]"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0B0D12",
              backgroundColor: "var(--accent-gold)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 20px rgba(212,168,67,0.25)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(1.08)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          >
            {isEdit ? "Save Changes" : "Save Product"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
