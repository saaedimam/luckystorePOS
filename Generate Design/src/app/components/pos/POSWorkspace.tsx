import { useEffect, useMemo, useState } from "react";
import { CommandBar } from "./CommandBar";
import { ProductGrid } from "./ProductGrid";
import { Cart, type CartItem, type PaymentMethod } from "./Cart";
import { PRODUCTS, type Product, CATEGORIES } from "./data";
import { ScannerOverlay } from "./ScannerOverlay";
import { SplitPaymentDrawer, type TenderType } from "./SplitPaymentDrawer";
import { ReceiptModal } from "./ReceiptModal";
import { usePOSStore } from "../../store";
import { useToast } from "../ToastSystem";

export function POSWorkspace() {
  const { isOnline, incrementOfflineQueue } = usePOSStore();
  const { addToast } = useToast();
  
  const [isDark, setIsDark] = useState(true);
  const [now, setNow] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [cart, setCart] = useState<CartItem[]>([
    { product: PRODUCTS[0], qty: 2 },
    { product: PRODUCTS[2], qty: 1 },
    { product: PRODUCTS[4], qty: 3 },
  ]);
  const [discount, setDiscount] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");

  // Overlay state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedTenders, setCompletedTenders] = useState<
    { type: TenderType; amount: number }[]
  >([]);
  const [snapshot, setSnapshot] = useState<{
    items: CartItem[];
    subtotal: number;
    discountAmt: number;
    vat: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const inCat = category === "All" || p.category === category;
      const matches =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.nameBn.includes(query.trim());
      return inCat && matches;
    });
  }, [query, category]);

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const discountPct = Math.max(0, Math.min(100, parseFloat(discount) || 0));
  const discountAmt = (subtotal * discountPct) / 100;
  const taxable = subtotal - discountAmt;
  const vat = taxable * 0.05;
  const total = taxable + vat;

  function addToCart(p: Product) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { product: p, qty: 1 }];
    });
  }
  function inc(id: string) {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: i.qty + 1 } : i)));
  }
  function dec(id: string) {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i)));
  }
  function remove(id: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const invId = Math.floor(1000 + Math.random() * 9000);
    
    if (isOnline) {
      setTimeout(() => {
        addToast({
          title: "Sale Synced",
          description: `Sale #INV-${invId} synced to Supabase`,
          variant: "success"
        });
        setCart([]);
        setDiscount("");
      }, 500);
    } else {
      addToast({
        title: "Offline Sync Pending",
        description: "Sale saved locally. Sync pending.",
        variant: "warning"
      });
      incrementOfflineQueue();
      setCart([]);
      setDiscount("");
    }
  };

  function handleSplitComplete(tenders: { type: TenderType; amount: number }[]) {
    setCompletedTenders(tenders);
    setSplitOpen(false);
    // Brief gap to allow drawer to start closing before modal enters
    setTimeout(() => setReceiptOpen(true), 180);
  }

  function handleReceiptClose() {
    setReceiptOpen(false);
    // Start a fresh sale
    setCart([]);
    setDiscount("");
    setCompletedTenders([]);
    setSnapshot(null);
  }

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      <CommandBar
        query={query}
        onQueryChange={setQuery}
        isDark={isDark}
        onToggleDark={() => setIsDark((v) => !v)}
        now={now}
        cashier="Tanvir · #04"
        onScan={() => setScannerOpen(true)}
      />

      <div className="flex-1 min-h-0 grid gap-4 p-4 md:p-6">
        {/* Desktop / tablet 60/40 */}
        <div
          className="hidden md:grid gap-6 min-h-0 h-full"
          style={{ gridTemplateColumns: "minmax(0, 6fr) minmax(360px, 4fr)" }}
        >
          <ProductGrid
            products={filtered}
            category={category}
            onCategoryChange={setCategory}
            onAdd={addToCart}
          />
          <Cart
            items={cart}
            onInc={inc}
            onDec={dec}
            onRemove={remove}
            discount={discount}
            onDiscountChange={setDiscount}
            payment={payment}
            onPaymentChange={setPayment}
            onCheckout={handleCheckout}
          />
        </div>

        {/* Mobile stacked */}
        <div className="grid md:hidden gap-4 min-h-0">
          <ProductGrid
            products={filtered}
            category={category}
            onCategoryChange={setCategory}
            onAdd={addToCart}
          />
          <Cart
            items={cart}
            onInc={inc}
            onDec={dec}
            onRemove={remove}
            discount={discount}
            onDiscountChange={setDiscount}
            payment={payment}
            onPaymentChange={setPayment}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Overlays */}
      <ScannerOverlay
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetect={(p) => {
          addToCart(p);
          setTimeout(() => setScannerOpen(false), 320);
        }}
      />

      <SplitPaymentDrawer
        open={splitOpen}
        total={snapshot?.total ?? total}
        initialTender={payment}
        onClose={() => setSplitOpen(false)}
        onComplete={handleSplitComplete}
      />

      <ReceiptModal
        open={receiptOpen}
        items={snapshot?.items ?? cart}
        tenders={completedTenders}
        total={snapshot?.total ?? total}
        vat={snapshot?.vat ?? vat}
        discountAmt={snapshot?.discountAmt ?? discountAmt}
        subtotal={snapshot?.subtotal ?? subtotal}
        onClose={handleReceiptClose}
      />
    </div>
  );
}
