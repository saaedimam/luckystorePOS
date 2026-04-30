import { useState } from 'react';
import { Search, Plus, ScanLine } from 'lucide-react';

// Mock Data
const MOCK_CATEGORIES = [
  'All Categories',
  'Baking Needs',
  'Ice Cream',
  'Baby Care',
  'Spices',
  'Oil',
  'Cooking Ingredients'
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Nido Fortigo 350g', qty: 3, price: 430, initials: null, image: null },
  { id: 2, name: 'Nido 3+ 350g BiB', qty: 1, price: 520, initials: null, image: null },
  { id: 3, name: 'Rangdhanu Mixed Herbs - 30g (Exp01.23)', qty: 1, price: 80, initials: null, image: null },
  { id: 4, name: 'Maxline ML-073 Multi Color Multiplug 3 Port wi...', qty: 1, price: 290, initials: null, image: null },
  { id: 5, name: 'Kodomo Bubble Fruit Toothpaste Gel Ultra...', qty: 1, price: 165, initials: 'KB', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
  { id: 6, name: 'Ispahani Blenders Choice Premium Black Tea - 200g', qty: 1, price: 160, initials: null, image: '☕', bgColor: 'bg-red-50' },
  { id: 7, name: 'ABC Cup Hot Gulai Chicken Flavour - 60g', qty: 1, price: 190, initials: 'AC', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
  { id: 8, name: 'Samyang Extreme Hot Chicken Ramen Noodles...', qty: 2, price: 190, initials: 'SE', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
];

export function QuickPosPage() {
  const [activeCategory, setActiveCategory] = useState('All Categories');

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
                  />
                </div>
                <button className="button-primary">
                  <Plus size={16} /> Add New Item
                </button>
                <button className="button-outline">
                  <ScanLine size={16} /> Scan Code
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="pos-categories">
              {MOCK_CATEGORIES.map((category) => (
                <button
                  key={category}
                  className={`category-pill ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="pos-grid">
              {MOCK_PRODUCTS.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-avatar">
                    {product.initials ? (
                      <span>{product.initials}</span>
                    ) : product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span />
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-quantity">Qty: {product.qty}</div>
                    <div className="product-price">Tk. {product.price}</div>
                  </div>
                  <button className="button-primary w-full mt-2">Click to Select</button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Billing */}
          <div className="pos-billing">
            <div className="billing-header">
              <h2>Billing Items (4)</h2>
              <button className="text-danger">Clear Items</button>
            </div>
            <div className="billing-items">
              {/* Billing items would go here */}
            </div>
            <div className="billing-summary">
              <div className="billing-row"><span>Sub Total</span><span>Tk. 655</span></div>
              <div className="billing-actions">
                <button className="button-outline">Discount</button>
                <button className="button-outline">Tax</button>
                <button className="button-outline">Additional Charges</button>
              </div>
              <div className="billing-total"><span>Total Amount</span><span className="text-emerald-600 font-bold">Tk. 655</span></div>
              <button className="button-primary w-full mt-4">Continue Billing</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
