import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { SkeletonBlock } from '../../components/PageState';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { Search, ScanLine, AlertCircle, X, RefreshCw, ShoppingCart, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { PosProduct } from '../../lib/api/types';
import { ReceiptPreview } from './ReceiptPreview';
import { TouchCart } from './components/TouchCart';
import { ModernPaymentModal } from './ModernPaymentModal';
import { useCartStore } from '../../stores/useCartStore';
import { useOfflineStore } from '../../stores/useOfflineStore';
import { useSyncSales } from '../../hooks/useSyncSales';
import { usePosScanner } from './usePosScanner';
import { usePosSale } from './usePosSale';
import { ProductCard } from '../../components/product/ProductCard';

import './receipt.css';

export function QuickPosPage() {
  const { storeId, tenantId } = useAuth();

  // Error state (shared across hooks)
  const [error, setError] = useState<string | null>(null);
  const handleError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  // Category filter state
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Cart hook (Zustand)
  const cart = useCartStore();
  const { pendingCount } = useSyncSales();

  // Realtime: refresh product list on stock_levels changes
  useRealtimeSubscription({
    table: 'stock_levels',
    event: 'UPDATE',
    filter: storeId ? `store_id=eq.${storeId}` : undefined,
    invalidateKeys: [['pos-products', storeId]],
    onEvent: (payload) => {
      const newRecord = payload.new as Record<string, unknown> | undefined;
      if (newRecord && typeof newRecord.qty === 'number' && newRecord.qty <= 0) {
        const itemId = newRecord.item_id as string | undefined;
        if (itemId) {
          const itemInCart = cart.items.find(i => i.product.id === itemId);
          if (itemInCart) {
            setError(`⚠ ${itemInCart.product.name} is now out of stock!`);
            setTimeout(() => setError(null), 5000);
            cart.removeItem(itemId);
          }
        }
      }
    },
  });

  useRealtimeSubscription({
    table: 'items',
    event: '*',
    invalidateKeys: [['pos-products', storeId], ['pos-categories', storeId]],
  });

  // Scanner hook
  const scanner = usePosScanner(storeId, cart.addItem, handleError, cart.getTotal() === 0);

  // Fetch categories
  const { data: categories = [], isLoading: catLoading, error: catError } = useQuery({
    queryKey: ['pos-categories', storeId],
    queryFn: () => api.pos.getCategories(storeId),
    enabled: !!storeId,
  });

  // Fetch products
  const { data: products = [], isLoading: prodLoading, error: prodError } = useQuery({
    queryKey: ['pos-products', storeId, activeCategory, debouncedSearch],
    queryFn: () => api.pos.getProducts(storeId, debouncedSearch, activeCategory || undefined),
    enabled: !!storeId,
  });

  // Fetch payment methods
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods', storeId],
    queryFn: () => api.settings.getPaymentMethods(storeId),
    enabled: !!storeId,
  });

  // Fetch receipt config
  const { data: receiptConfig } = useQuery({
    queryKey: ['settings-receipt', storeId],
    queryFn: () => api.settings.getReceiptConfig(storeId),
    enabled: !!storeId,
  });

  // Sale hook
  const sale = usePosSale(
    cart.items as any,
    cart.getTotal(),
    cart.getTotal(), // Subtotal is same as total for now in simplified store
    0, // cartDiscount
    storeId,
    tenantId,
    paymentMethods,
    cart.clearCart,
    handleError,
  );

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Clear error on payment modal close
  useEffect(() => {
    if (!sale.showPaymentModal) setError(null);
  }, [sale.showPaymentModal]);

  return (
    <div className={clsx('pos-container', showMobileCart && 'pos-container--sheet-open')}>
      <div className="pos-content">
        {/* Left Panel - Categories */}
        <div className="pos-sidebar">
          <h2 className="text-sm font-bold text-text-muted mb-2 px-2 uppercase tracking-wider">Categories</h2>
          <div className="pos-categories">
            <button
              className={`category-pill ${activeCategory === null ? 'active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              All Categories
            </button>
            {catLoading ? (
              <div className="category-pill">Loading...</div>
            ) : catError ? (
              <div className="category-pill text-danger">Error loading</div>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-pill ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name} ({category.itemCount})
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center Panel - Products */}
        <div className="pos-products">
          {/* Action Bar */}
          <div className="pos-action-bar">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight">Lucky Store POS</h1>
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-sky-400 uppercase tracking-widest bg-sky-400/10 px-2 py-0.5 rounded-full w-fit">
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                  {pendingCount} syncing
                </div>
              )}
            </div>
            <div className="pos-action-buttons">
              <div className="pos-search">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="button-primary" onClick={() => scanner.setIsScanning(!scanner.isScanning)}>
                <ScanLine size={16} /> Scan Code
              </button>
            </div>
          </div>

          {/* Scanner Input */}
          {scanner.isScanning && (
            <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <input
                type="text"
                placeholder="Scan barcode or SKU... (Press Enter)"
                className="search-input"
                value={scanner.scanValue}
                onChange={(e) => scanner.setScanValue(e.target.value)}
                onKeyDown={scanner.handleScanKeyDown}
                autoFocus
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Error Display */}
          {error && !sale.showPaymentModal && (
            <div className="card" style={{
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="pos-grid">
            {prodLoading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="product-card" aria-busy="true">
                  <div className="product-avatar">
                    <SkeletonBlock className="w-full h-full" />
                  </div>
                  <div className="product-info">
                    <SkeletonBlock className="w-4/5 h-5 mb-2" />
                    <SkeletonBlock className="w-2/5 h-4 mb-2" />
                    <SkeletonBlock className="w-[30%] h-[18px]" />
                  </div>
                  <SkeletonBlock className="w-full h-9 mt-2" />
                </div>
              ))
            ) : prodError ? (
              <div className="card" style={{
                padding: 'var(--space-12)',
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'var(--color-danger)'
              }}>
                <AlertCircle size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                <p>Error loading products. Please try again.</p>
                <button
                  className="button-primary"
                  onClick={() => window.location.reload()}
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  <RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="card" style={{
                padding: 'var(--space-12)',
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <AlertCircle size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                <p>No products found.</p>
              </div>
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(p) => cart.addItem(p)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Billing (desktop only) */}
        <div className="pos-billing">
          <TouchCart onCheckout={() => sale.setShowPaymentModal(true)} />
        </div>
      </div>

      {/* Mobile: Sticky cart trigger bar */}
      <button
        className="mobile-cart-trigger"
        onClick={() => setShowMobileCart(true)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ShoppingCart size={20} />
          {cart.getItemCount()} {cart.getItemCount() === 1 ? 'item' : 'items'}
          <span className="mobile-cart-badge">{cart.getItemCount()}</span>
        </span>
        <span className="mobile-cart-total">৳{cart.getTotal().toFixed(2)}</span>
        <ChevronUp size={20} />
      </button>

      {/* Mobile: Cart sheet overlay */}
      {showMobileCart && (
        <>
          <div className="cart-sheet-overlay" onClick={() => setShowMobileCart(false)} />
          <div className="cart-sheet">
            <div className="cart-sheet-handle">
              <div className="cart-sheet-handle-bar" />
            </div>
            <div className="cart-sheet-header">
              <h2>Billing ({cart.getItemCount()})</h2>
              <button
                className="text-danger"
                onClick={cart.clearCart}
                disabled={cart.items.length === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: cart.items.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: cart.items.length === 0 ? 0.5 : 1,
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Clear Items
              </button>
            </div>
            <div className="cart-sheet-body">
              <TouchCart onCheckout={() => {
                setShowMobileCart(false);
                sale.setShowPaymentModal(true);
              }} />
            </div>
          </div>
        </>
      )}

          <ModernPaymentModal
            show={sale.showPaymentModal}
            totalAmount={cart.getTotal()}
            isProcessing={sale.isProcessing}
        isSplitMode={sale.isSplitMode}
        selectedPaymentMethod={sale.selectedPaymentMethod}
        paymentAmount={sale.paymentAmount}
        splitPayments={sale.splitPayments}
        splitMethod={sale.splitMethod}
        splitAmount={sale.splitAmount}
        paymentMethods={paymentMethods}
        paidTotal={sale.paidTotal}
        changeAmount={sale.changeAmount}
        remainingAmount={sale.remainingAmount}
        error={error}
        onClose={sale.resetPaymentModal}
        onSetIsSplitMode={sale.setIsSplitMode}
        onSelectPaymentMethod={sale.setSelectedPaymentMethod}
        onSetPaymentAmount={sale.setPaymentAmount}
        onSetSplitMethod={sale.setSplitMethod}
        onSetSplitAmount={sale.setSplitAmount}
        onAddSplitPayment={sale.addSplitPayment}
        onRemoveSplitPayment={sale.removeSplitPayment}
        onQuickAmount={sale.handleQuickAmount}
        onCheckout={sale.handleCheckout}
      />

      {sale.completedSale && (
        <ReceiptPreview
          cart={sale.completedSale.cart}
          subtotal={sale.completedSale.subtotal}
          discount={sale.completedSale.discount}
          totalAmount={sale.completedSale.totalAmount}
          paymentMethod={sale.completedSale.paymentMethod}
          paidAmount={sale.completedSale.paidAmount}
          changeAmount={sale.completedSale.changeAmount}
          saleNumber={sale.completedSale.saleNumber}
          batchId={sale.completedSale.batchId}
          receiptConfig={receiptConfig ? {
            store_name: receiptConfig.store_name || '',
            header_text: receiptConfig.header_text || '',
            footer_text: receiptConfig.footer_text || '',
          } : null}
          onClose={() => sale.resetPaymentModal}
        />
      )}
    </div>
  );
}