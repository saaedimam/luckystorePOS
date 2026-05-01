import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Skeleton } from '../../components/Skeleton';
import { Search, Plus, ScanLine, AlertCircle, X, Trash2, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import type { PosProduct, PosCategory, CartItem, PaymentInput } from '../../lib/api/types';

// Debug mode toggle (set via VITE_DEBUG_POS=true in .env)
const DEBUG_POS = import.meta.env.VITE_DEBUG_POS === 'true';

function debugLog(label: string, data: unknown) {
  if (DEBUG_POS) {
    console.log(`[QuickPosPage] ${label}:`, JSON.stringify(data, null, 2));
  }
}

export function QuickPosPage() {
  const { storeId, tenantId } = useAuth();

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

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

  // Add item to cart with stock validation
  const addToCart = useCallback((product: PosProduct, qty: number = 1) => {
    debugLog('Adding to cart', { product, qty });

    // Stock guard: out of stock
    if (product.stock <= 0) {
      setError(`${product.name} is out of stock`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Find existing item
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const currentQty = existingIndex >= 0 ? cart[existingIndex].qty : 0;
    const newQty = currentQty + qty;

    // Stock guard: insufficient stock
    if (newQty > product.stock) {
      setError(`Only ${product.stock} available for ${product.name}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Update cart
    if (existingIndex >= 0) {
      setCart(prev => {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: newQty,
          lineTotal: newQty * updated[existingIndex].unitPrice,
        };
        return updated;
      });
    } else {
      setCart(prev => [...prev, {
        product,
        qty,
        unitPrice: product.price,
        lineTotal: qty * product.price,
      }]);
    }

    setError(null);
  }, [cart]);

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

    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    // Stock guard
    if (qty > item.product.stock) {
      setError(`Only ${item.product.stock} available for ${item.product.name}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setCart(prev => prev.map(cartItem =>
      cartItem.product.id === productId
        ? { ...cartItem, qty, lineTotal: qty * cartItem.unitPrice }
        : cartItem
    ));
  }, [cart, removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setCartDiscount(0);
    setError(null);
  }, []);

  // Handle barcode scan (Enter key, not debounce)
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

  // Handle checkout
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!selectedPaymentMethod || !paymentAmount) {
      setError('Please select payment method and enter amount');
      return;
    }

    const paid = parseFloat(paymentAmount);
    if (isNaN(paid) || paid < totalAmount) {
      setError(`Insufficient payment. Total: ৳${totalAmount.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Revalidate stock before sending (concurrency guard)
      for (const cartItem of cart) {
        const fresh = await api.pos.lookupByScan(cartItem.product.sku || cartItem.product.id, storeId);
        if (!fresh || fresh.stock < cartItem.qty) {
          setError(`${cartItem.product.name} is now out of stock. Please adjust quantity.`);
          setIsProcessing(false);
          return;
        }
      }

      // Build sale payload
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
          account_id: selectedPaymentMethod,
          amount: paid,
          party_id: null,
        }],
        notes: null,
      };

      debugLog('Sale payload', saleData);

      const result = await api.pos.createSale(saleData);
      debugLog('Sale result', result);

      if (result.status === 'success') {
        clearCart();
        setShowPaymentModal(false);
        setSelectedPaymentMethod(null);
        setPaymentAmount('');
        setError(null);
        // TODO: Show success notification with sale number
      } else {
        setError(result.error || 'Sale failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[QuickPosPage] Checkout error:', err);
      setError(err.message || 'Sale failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [cart, storeId, tenantId, selectedPaymentMethod, paymentAmount, totalAmount, clearCart, addToCart]);

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

          {/* Scanner Input (hidden unless scanning) */}
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
            <button
              className="button-primary w-full mt-4"
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0 || isProcessing}
              style={{
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            width: '400px',
            maxWidth: '90%',
            padding: 'var(--space-6)'
          }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Payment</h2>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                Total Amount
              </label>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-primary)' }}>
                ৳{totalAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                Payment Method
              </label>
              <select
                value={selectedPaymentMethod || ''}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)'
                }}
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method: any) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                Amount
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                className="button-secondary"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPaymentMethod(null);
                  setPaymentAmount('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="button-primary"
                onClick={handleCheckout}
                disabled={isProcessing}
                style={{ flex: 1 }}
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
