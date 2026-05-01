import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Skeleton } from '../../components/Skeleton';
import {
  Search, Plus, ScanLine, AlertCircle, X, Trash2, RefreshCw,
  CheckCircle, ShoppingCart, Pause, Play, Banknote, CreditCard, Smartphone, Wallet, Minus
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PosProduct, PosCategory, CartItem, SplitPayment, HeldCart } from '../../lib/api/types';

const DEBUG_POS = import.meta.env.VITE_DEBUG_POS === 'true';

function debugLog(label: string, data: unknown) {
  if (DEBUG_POS) {
    console.log(`[QuickPosPage] ${label}:`, JSON.stringify(data, null, 2));
  }
}

const HELD_CARTS_KEY = 'luckystore_held_carts';

function loadHeldCarts(storeId: string): HeldCart[] {
  try {
    const raw = localStorage.getItem(`${HELD_CARTS_KEY}_${storeId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHeldCarts(storeId: string, carts: HeldCart[]) {
  localStorage.setItem(`${HELD_CARTS_KEY}_${storeId}`, JSON.stringify(carts));
}

function getPaymentIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('cash') || lower.includes('নগদ')) return <Banknote size={18} />;
  if (lower.includes('bkash') || lower.includes('বকাশ')) return <Smartphone size={18} />;
  if (lower.includes('card') || lower.includes('কার্ড')) return <CreditCard size={18} />;
  return <Wallet size={18} />;
}

export function QuickPosPage() {
  const { storeId, tenantId } = useAuth();
  const queryClient = useQueryClient();

  // Category filter state
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Search state with debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState(0);

  // Scanner state
  const [scanValue, setScanValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Checkout state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Payment state
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [isSplitMode, setIsSplitMode] = useState(false);

  // Sale completion state
  const [lastSaleResult, setLastSaleResult] = useState<{ batchId: string; totalAmount: number } | null>(null);

  // Hold/Recall state
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [showHoldDrawer, setShowHoldDrawer] = useState(false);
  const [holdLabel, setHoldLabel] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

  const paymentInputRef = useRef<HTMLInputElement>(null);

  // Load held carts on mount / storeId change
  useEffect(() => {
    if (storeId) {
      setHeldCarts(loadHeldCarts(storeId));
    }
  }, [storeId]);

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    enabled: !!storeId && showPaymentModal,
  });

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalAmount = Math.max(0, subtotal - cartDiscount);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Split payment calculations
  const splitTotal = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAmount - splitTotal;
  const changeAmount = isSplitMode
    ? Math.max(0, splitTotal - totalAmount)
    : Math.max(0, (parseFloat(paymentAmount) || 0) - totalAmount);

  // Add item to cart with stock validation
  const addToCart = useCallback((product: PosProduct, qty: number = 1) => {
    debugLog('Adding to cart', { product, qty });

    if (product.stock <= 0) {
      setError(`${product.name} is out of stock`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      const currentQty = existingIndex >= 0 ? prev[existingIndex].qty : 0;
      const newQty = currentQty + qty;

      if (newQty > product.stock) {
        setError(`Only ${product.stock} available for ${product.name}`);
        setTimeout(() => setError(null), 3000);
        return prev;
      }

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: newQty,
          lineTotal: newQty * updated[existingIndex].unitPrice,
        };
        return updated;
      }

      return [...prev, {
        product,
        qty,
        unitPrice: product.price,
        lineTotal: qty * product.price,
      }];
    });

    setError(null);
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  // Update item quantity
  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => {
      const item = prev.find(i => i.product.id === productId);
      if (!item) return prev;

      if (qty > item.product.stock) {
        setError(`Only ${item.product.stock} available for ${item.product.name}`);
        setTimeout(() => setError(null), 3000);
        return prev;
      }

      return prev.map(cartItem =>
        cartItem.product.id === productId
          ? { ...cartItem, qty, lineTotal: qty * cartItem.unitPrice }
          : cartItem
      );
    });
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setCartDiscount(0);
    setError(null);
  }, []);

  // Hold cart
  const holdCart = useCallback(() => {
    if (cart.length === 0) return;
    const label = holdLabel.trim() || `Cart #${heldCarts.length + 1}`;
    const held: HeldCart = {
      id: crypto.randomUUID(),
      label,
      items: [...cart],
      discount: cartDiscount,
      heldAt: Date.now(),
    };
    const updated = [held, ...heldCarts];
    setHeldCarts(updated);
    saveHeldCarts(storeId!, updated);
    setCart([]);
    setCartDiscount(0);
    setHoldLabel('');
    setShowHoldDrawer(false);
  }, [cart, cartDiscount, heldCarts, holdLabel, storeId]);

  // Recall cart
  const recallCart = useCallback((heldCart: HeldCart) => {
    if (cart.length > 0) {
      const currentHeld: HeldCart = {
        id: crypto.randomUUID(),
        label: `Auto-saved`,
        items: [...cart],
        discount: cartDiscount,
        heldAt: Date.now(),
      };
      const updated = [currentHeld, ...heldCarts.filter(h => h.id !== heldCart.id)];
      setHeldCarts(updated);
      saveHeldCarts(storeId!, updated);
    } else {
      const updated = heldCarts.filter(h => h.id !== heldCart.id);
      setHeldCarts(updated);
      saveHeldCarts(storeId!, updated);
    }
    setCart(heldCart.items);
    setCartDiscount(heldCart.discount);
    setShowHoldDrawer(false);
  }, [cart, cartDiscount, heldCarts, storeId]);

  // Delete held cart
  const deleteHeldCart = useCallback((id: string) => {
    const updated = heldCarts.filter(h => h.id !== id);
    setHeldCarts(updated);
    saveHeldCarts(storeId!, updated);
  }, [heldCarts, storeId]);

  // Handle barcode scan
  const handleScanKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value.trim();
      if (!value) return;

      debugLog('Scanning barcode', value);

      try {
        const product = await api.pos.lookupByScan(value, storeId);
        if (product) {
          addToCart(product, 1);
          setScanValue('');
        } else {
          setError(`Item not found: ${value}`);
          setTimeout(() => setError(null), 3000);
          setScanValue('');
        }
      } catch (err: any) {
        setError(`Scan error: ${err.message}`);
        setTimeout(() => setError(null), 3000);
        setScanValue('');
      }
    }
  }, [storeId, addToCart]);

  // Add split payment entry
  const addSplitPayment = useCallback(() => {
    if (!selectedPaymentAccountId || !paymentAmount) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > remaining + 0.01) {
      setError(`Amount exceeds remaining ৳${remaining.toFixed(2)}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const method = paymentMethods.find((m: any) => m.id === selectedPaymentAccountId);
    const entry: SplitPayment = {
      id: crypto.randomUUID(),
      accountId: selectedPaymentAccountId,
      methodName: method?.name || 'Unknown',
      amount: amt,
    };
    setSplitPayments(prev => [...prev, entry]);
    setPaymentAmount('');
    setSelectedPaymentAccountId(null);
    setError(null);
  }, [selectedPaymentAccountId, paymentAmount, remaining, paymentMethods]);

  // Remove split payment entry
  const removeSplitPayment = useCallback((id: string) => {
    setSplitPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  // Handle checkout — single payment
  const handleSingleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }
    if (!selectedPaymentAccountId || !paymentAmount) {
      setError('Please select payment method and enter amount');
      return;
    }

    const paid = parseFloat(paymentAmount);
    if (isNaN(paid) || paid < totalAmount - 0.01) {
      setError(`Insufficient payment. Total: ৳${totalAmount.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Revalidate stock
      for (const cartItem of cart) {
        const fresh = await api.pos.lookupByScan(cartItem.product.sku || cartItem.product.id, storeId);
        if (!fresh || fresh.stock < cartItem.qty) {
          setError(`${cartItem.product.name} is now out of stock. Please adjust quantity.`);
          setIsProcessing(false);
          return;
        }
      }

      const saleData = {
        idempotencyKey: crypto.randomUUID(),
        tenantId: tenantId || '',
        storeId: storeId || '',
        items: cart.map(item => ({
          item_id: item.product.id,
          quantity: item.qty,
          unit_price: item.unitPrice,
        })),
        payments: [{
          account_id: selectedPaymentAccountId,
          amount: paid,
          party_id: null,
        }],
        notes: null,
      };

      debugLog('Sale payload', saleData);
      const result = await api.pos.createSale(saleData);
      debugLog('Sale result', result);

      if (result.status === 'success') {
        setLastSaleResult({
          batchId: result.batchId || '',
          totalAmount: result.totalAmount || totalAmount,
        });
        clearCart();
        setShowPaymentModal(false);
        setSelectedPaymentAccountId(null);
        setPaymentAmount('');
        setSplitPayments([]);
        setIsSplitMode(false);
      } else {
        setError(result.error || 'Sale failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[QuickPosPage] Checkout error:', err);
      setError(err.message || 'Sale failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [cart, storeId, tenantId, selectedPaymentAccountId, paymentAmount, totalAmount, clearCart]);

  // Handle checkout — split payment
  const handleSplitCheckout = useCallback(async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }
    if (splitPayments.length === 0) {
      setError('Add at least one payment');
      return;
    }
    if (Math.abs(remaining) > 0.01 && remaining > 0) {
      setError(`Still ৳${remaining.toFixed(2)} remaining to pay`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      for (const cartItem of cart) {
        const fresh = await api.pos.lookupByScan(cartItem.product.sku || cartItem.product.id, storeId);
        if (!fresh || fresh.stock < cartItem.qty) {
          setError(`${cartItem.product.name} is now out of stock. Please adjust quantity.`);
          setIsProcessing(false);
          return;
        }
      }

      const saleData = {
        idempotencyKey: crypto.randomUUID(),
        tenantId: tenantId || '',
        storeId: storeId || '',
        items: cart.map(item => ({
          item_id: item.product.id,
          quantity: item.qty,
          unit_price: item.unitPrice,
        })),
        payments: splitPayments.map(p => ({
          account_id: p.accountId,
          amount: p.amount,
          party_id: null,
        })),
        notes: null,
      };

      debugLog('Split sale payload', saleData);
      const result = await api.pos.createSale(saleData);
      debugLog('Split sale result', result);

      if (result.status === 'success') {
        setLastSaleResult({
          batchId: result.batchId || '',
          totalAmount: result.totalAmount || totalAmount,
        });
        clearCart();
        setShowPaymentModal(false);
        setSelectedPaymentAccountId(null);
        setPaymentAmount('');
        setSplitPayments([]);
        setIsSplitMode(false);
      } else {
        setError(result.error || 'Sale failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[QuickPosPage] Split checkout error:', err);
      setError(err.message || 'Sale failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [cart, storeId, tenantId, splitPayments, remaining, totalAmount, clearCart]);

  // New sale
  const startNewSale = useCallback(() => {
    setLastSaleResult(null);
  }, []);

  // Quick amount buttons for cash
  const quickAmounts = [
    { label: '৳100', value: 100 },
    { label: '৳500', value: 500 },
    { label: '৳1000', value: 1000 },
    { label: 'Exact', value: totalAmount },
  ];

  // Get initials for product avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar background color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-emerald-100 text-emerald-600',
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-orange-100 text-orange-600',
      'bg-teal-100 text-teal-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // ── Sale Success Overlay ──────────────────────────────────────────
  if (lastSaleResult) {
    return (
      <div className="sale-success-overlay">
        <div className="sale-success-card">
          <div className="sale-success-icon">
            <CheckCircle size={36} />
          </div>
          <div className="sale-success-title">Sale Complete</div>
          <div className="sale-success-detail">
            Batch: {lastSaleResult.batchId.slice(0, 8).toUpperCase()}
          </div>
          <div className="sale-success-amount">
            ৳{lastSaleResult.totalAmount.toFixed(2)}
          </div>
          <div className="sale-success-actions">
            <button className="button-primary" onClick={startNewSale}>
              <Plus size={16} /> New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-container">
      <div className="pos-content">
        {/* Left Panel - Products */}
        <div className="pos-products">
          {/* Action Bar */}
          <div className="pos-action-bar">
            <h1 className="text-xl font-bold">Quick POS</h1>
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
              <button className="button-primary" onClick={() => setIsScanning(!isScanning)}>
                <ScanLine size={16} /> Scan Code
              </button>
            </div>
          </div>

          {/* Scanner Input */}
          {isScanning && (
            <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <input
                type="text"
                placeholder="Scan barcode or SKU... (Press Enter)"
                className="search-input"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyDown={handleScanKeyDown}
                autoFocus
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
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

          {/* Category Pills */}
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
              <div className="category-pill" style={{ color: 'var(--color-danger)' }}>
                Error loading categories
              </div>
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

          {/* Product Grid */}
          <div className="pos-grid">
            {prodLoading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="product-card">
                  <div className="product-avatar">
                    <Skeleton style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div className="product-info">
                    <Skeleton style={{ width: '80%', height: '20px', marginBottom: 'var(--space-2)' }} />
                    <Skeleton style={{ width: '40%', height: '16px', marginBottom: 'var(--space-2)' }} />
                    <Skeleton style={{ width: '30%', height: '18px' }} />
                  </div>
                  <Skeleton style={{ width: '100%', height: '36px', marginTop: 'var(--space-2)' }} />
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
                <div key={product.id} className="product-card">
                  <div className="product-avatar">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span className={getAvatarColor(product.name)}>
                        {getInitials(product.name)}
                      </span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-quantity">
                      Stock: {product.stock}
                    </div>
                    <div className="product-price">
                      ৳{product.price.toFixed(2)}
                    </div>
                  </div>
                  <button
                    className={clsx(
                      'button-primary w-full mt-2',
                      product.stock <= 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => product.stock > 0 && addToCart(product, 1)}
                    disabled={product.stock <= 0}
                  >
                    {product.stock > 0 ? 'Click to Select' : 'Out of Stock'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Billing */}
        <div className="pos-billing">
          <div className="billing-header">
            <h2>Billing Items ({itemCount})</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button
                className="button-outline"
                onClick={() => setShowHoldDrawer(true)}
                title="View held carts"
                style={{ padding: '2px 8px' }}
              >
                <span className="held-carts-badge">
                  <Pause size={16} />
                  {heldCarts.length > 0 && (
                    <span className="held-carts-count">{heldCarts.length}</span>
                  )}
                </span>
              </button>
              <button
                className="text-danger"
                onClick={clearCart}
                disabled={cart.length === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: cart.length === 0 ? 0.5 : 1
                }}
              >
                Clear Items
              </button>
            </div>
          </div>

          <div className="billing-items">
            {cart.length === 0 ? (
              <div style={{
                padding: 'var(--space-12)',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <AlertCircle size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                <p>No items in cart</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="billing-item">
                  <div className="billing-item-info">
                    <div className="billing-item-name">{item.product.name}</div>
                    <div className="billing-item-price">
                      ৳{item.product.price.toFixed(2)} × {item.qty}
                    </div>
                  </div>
                  <div className="billing-item-controls">
                    <button
                      className="button-outline"
                      onClick={() => updateQty(item.product.id, item.qty - 1)}
                      style={{ padding: '2px 8px' }}
                    >
                      -
                    </button>
                    <span style={{ margin: '0 8px' }}>{item.qty}</span>
                    <button
                      className="button-outline"
                      onClick={() => updateQty(item.product.id, item.qty + 1)}
                      style={{ padding: '2px 8px' }}
                    >
                      +
                    </button>
                    <button
                      className="text-danger"
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        marginLeft: 'var(--space-2)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="billing-item-total">
                    ৳{item.lineTotal.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="billing-summary">
            <div className="billing-row">
              <span>Sub Total</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="billing-actions">
              <button className="button-outline">Discount</button>
              <button className="button-outline">Tax</button>
              <button className="button-outline">Additional Charges</button>
            </div>
            <div className="billing-total">
              <span>Total Amount</span>
              <span className="text-emerald-600 font-bold">
                ৳{totalAmount.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className="button-secondary"
                onClick={holdCart}
                disabled={cart.length === 0}
                style={{ flex: 1, opacity: cart.length === 0 ? 0.5 : 1 }}
              >
                <Pause size={16} /> Hold
              </button>
              <button
                className="button-primary"
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0 || isProcessing}
                style={{
                  flex: 2,
                  opacity: cart.length === 0 || isProcessing ? 0.5 : 1,
                  cursor: cart.length === 0 || isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" style={{ marginRight: 'var(--space-2)' }} />
                    Processing...
                  </>
                ) : (
                  'Continue Billing'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hold Cart Drawer */}
      {showHoldDrawer && (
        <>
          <div className="hold-drawer-overlay" onClick={() => setShowHoldDrawer(false)} />
          <div className="hold-drawer">
            <div className="hold-drawer-header">
              <h3>Held Carts ({heldCarts.length})</h3>
              <button
                onClick={() => setShowHoldDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="hold-drawer-body">
              {heldCarts.length === 0 ? (
                <div className="hold-drawer-empty">
                  <Pause size={32} style={{ opacity: 0.2, marginBottom: 'var(--space-2)' }} />
                  <p>No held carts</p>
                </div>
              ) : (
                <div className="held-carts-list">
                  {heldCarts.map(hc => (
                    <div key={hc.id} className="held-cart-item" onClick={() => recallCart(hc)}>
                      <div className="held-cart-info">
                        <div className="held-cart-label">{hc.label}</div>
                        <div className="held-cart-meta">
                          {hc.items.length} item{hc.items.length !== 1 ? 's' : ''} · ৳{hc.items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2)} · {new Date(hc.heldAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="held-cart-actions" onClick={e => e.stopPropagation()}>
                        <button
                          className="button-outline"
                          onClick={() => recallCart(hc)}
                          style={{ padding: '4px 8px' }}
                          title="Recall this cart"
                        >
                          <Play size={14} />
                        </button>
                        <button
                          className="button-danger"
                          onClick={() => deleteHeldCart(hc.id)}
                          style={{ padding: '4px 8px' }}
                          title="Delete held cart"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal">
          <div className="payment-modal-content">
            <h2 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
              Payment
            </h2>

            {/* Total Display */}
            <div className="payment-section">
              <span className="payment-section-label">Total Amount</span>
              <div className="payment-total-display">৳{totalAmount.toFixed(2)}</div>
            </div>

            {/* Split Mode Toggle */}
            <div className="payment-section" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className={isSplitMode ? 'button-primary' : 'button-outline'}
                onClick={() => {
                  setIsSplitMode(!isSplitMode);
                  setSplitPayments([]);
                  setPaymentAmount('');
                  setSelectedPaymentAccountId(null);
                }}
                style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-3)', minHeight: 32, minWidth: 32 }}
              >
                {isSplitMode ? 'Split Payment ✓' : 'Split Payment'}
              </button>
            </div>

            {/* Split Payments List */}
            {isSplitMode && splitPayments.length > 0 && (
              <div className="payment-section">
                <span className="payment-section-label">Payments Added</span>
                <div className="split-payment-list">
                  {splitPayments.map(sp => (
                    <div key={sp.id} className="split-payment-item">
                      <div className="split-payment-info">
                        {getPaymentIcon(sp.methodName)}
                        <span>{sp.methodName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className="split-payment-amount">৳{sp.amount.toFixed(2)}</span>
                        <button
                          onClick={() => removeSplitPayment(sp.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {remaining > 0.01 && (
                  <div className="split-remaining">
                    <span className="split-remaining-label">Remaining</span>
                    <span className="split-remaining-amount">৳{remaining.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="payment-section">
              <span className="payment-section-label">Payment Method</span>
              <div className="payment-methods-grid">
                {paymentMethods.map((method: any) => (
                  <button
                    key={method.id}
                    className={`payment-method-chip ${selectedPaymentAccountId === method.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPaymentAccountId(method.id)}
                  >
                    <span className="payment-method-icon">{getPaymentIcon(method.name)}</span>
                    <span>{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amount Buttons (for cash) */}
            {selectedPaymentAccountId && (
              <div className="payment-section">
                <span className="payment-section-label">Quick Amount</span>
                <div className="quick-amount-grid">
                  {quickAmounts.map(qa => (
                    <button
                      key={qa.label}
                      className={`quick-amount-btn ${qa.label === 'Exact' ? 'exact' : ''}`}
                      onClick={() => {
                        if (isSplitMode) {
                          const amt = qa.value;
                          if (amt > remaining + 0.01) return;
                          const method = paymentMethods.find((m: any) => m.id === selectedPaymentAccountId);
                          const entry: SplitPayment = {
                            id: crypto.randomUUID(),
                            accountId: selectedPaymentAccountId,
                            methodName: method?.name || 'Unknown',
                            amount: Math.min(amt, remaining),
                          };
                          setSplitPayments(prev => [...prev, entry]);
                          setSelectedPaymentAccountId(null);
                        } else {
                          setPaymentAmount(qa.value.toFixed(2));
                        }
                      }}
                    >
                      {qa.label === 'Exact' ? 'Exact' : qa.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Input */}
            {!isSplitMode && (
              <div className="payment-section">
                <span className="payment-section-label">Amount</span>
                <input
                  ref={paymentInputRef}
                  type="number"
                  className="payment-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            )}

            {/* Add Payment Button (Split Mode) */}
            {isSplitMode && selectedPaymentAccountId && remaining > 0.01 && (
              <div className="payment-section">
                <span className="payment-section-label">Add Payment</span>
                <input
                  type="number"
                  className="payment-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max ৳${remaining.toFixed(2)}`}
                  style={{ marginBottom: 'var(--space-2)' }}
                />
                <button
                  className="button-outline w-full"
                  onClick={addSplitPayment}
                  disabled={!paymentAmount || !selectedPaymentAccountId}
                  style={{ minHeight: 36 }}
                >
                  <Plus size={14} /> Add Payment
                </button>
              </div>
            )}

            {/* Change Calculation */}
            {(!isSplitMode ? (parseFloat(paymentAmount) || 0) > totalAmount : splitTotal > totalAmount) && (
              <div className="change-display">
                <div className="change-label">Change Due</div>
                <div className="change-amount">৳{changeAmount.toFixed(2)}</div>
              </div>
            )}

            {/* Error in payment modal */}
            {error && (
              <div style={{
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-3)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger)',
                fontSize: 'var(--font-size-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
                <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Footer Actions */}
            <div className="payment-footer">
              <button
                className="button-secondary"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPaymentAccountId(null);
                  setPaymentAmount('');
                  setSplitPayments([]);
                  setIsSplitMode(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                className="button-primary"
                onClick={isSplitMode ? handleSplitCheckout : handleSingleCheckout}
                disabled={isProcessing || (isSplitMode ? remaining > 0.01 : false)}
                style={{ opacity: isProcessing ? 0.5 : 1 }}
              >
                {isProcessing ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}