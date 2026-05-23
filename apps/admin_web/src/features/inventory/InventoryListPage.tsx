import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { FilterChip } from '../../components/ui/FilterChip';

// Types
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  emoji: string;
  category: string;
  qty: number;
  threshold: number;
  cost: number;
  price: number;
  status: 'ok' | 'low' | 'critical';
}

interface StockMovement {
  date: string;
  product: string;
  type: 'sale' | 'received' | 'adjustment';
  qtyChange: number;
  balance: number;
  reference: string;
  user: string;
  userInitials: string;
}

// Mock data
const CATEGORIES = ['All Products', 'Dairy', 'Grocery', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Stationery'];

const INVENTORY_ITEMS: InventoryItem[] = [
  { id: '1', name: 'Fresh Milk 1L', sku: 'PRD-0012', emoji: '🥛', category: 'Dairy', qty: 42, threshold: 20, cost: 62, price: 78, status: 'ok' },
  { id: '2', name: 'Basmati Rice 5kg', sku: 'PRD-0045', emoji: '🍚', category: 'Grocery', qty: 8, threshold: 15, cost: 290, price: 340, status: 'low' },
  { id: '3', name: 'Coconut Oil 500ml', sku: 'PRD-0078', emoji: '🧴', category: 'Grocery', qty: 2, threshold: 12, cost: 145, price: 180, status: 'critical' },
  { id: '4', name: 'Brown Eggs 12pc', sku: 'PRD-0091', emoji: '🥚', category: 'Dairy', qty: 24, threshold: 10, cost: 98, price: 120, status: 'ok' },
  { id: '5', name: 'White Bread', sku: 'PRD-0023', emoji: '🍞', category: 'Bakery', qty: 36, threshold: 15, cost: 38, price: 45, status: 'ok' },
  { id: '6', name: 'Instant Noodles', sku: 'PRD-0156', emoji: '🍜', category: 'Snacks', qty: 180, threshold: 50, cost: 14, price: 18, status: 'ok' },
];

const STOCK_MOVEMENTS: StockMovement[] = [
  { date: 'Jun 30, 10:42 AM', product: 'Fresh Milk 1L', type: 'sale', qtyChange: -6, balance: 42, reference: 'INV-240630-1842', user: 'Ashik K.', userInitials: 'AK' },
  { date: 'Jun 30, 09:15 AM', product: 'Basmati Rice 5kg', type: 'received', qtyChange: 50, balance: 58, reference: 'PO-240628-003', user: 'Mizan R.', userInitials: 'MR' },
  { date: 'Jun 29, 06:30 PM', product: 'Coconut Oil 500ml', type: 'sale', qtyChange: -3, balance: 5, reference: 'INV-240629-1721', user: 'Sonia I.', userInitials: 'SI' },
  { date: 'Jun 29, 02:00 PM', product: 'White Bread', type: 'adjustment', qtyChange: -4, balance: 36, reference: 'ADJ-240629-008', user: 'Ashik K.', userInitials: 'AK' },
];

const getStockBadgeClass = (status: 'ok' | 'low' | 'critical') => {
  switch (status) {
    case 'ok':
      return 'inv-stock--ok';
    case 'low':
      return 'inv-stock--low';
    case 'critical':
      return 'inv-stock--critical';
  }
};

const getStockLabel = (status: 'ok' | 'low' | 'critical') => {
  switch (status) {
    case 'ok':
      return 'In Stock';
    case 'low':
      return 'Low';
    case 'critical':
      return 'Critical';
  }
};

const getProgressFillClass = (status: 'ok' | 'low' | 'critical') => {
  switch (status) {
    case 'ok':
      return 'progress-fill--success';
    case 'low':
      return 'progress-fill--warning';
    case 'critical':
      return 'progress-fill--danger';
  }
};

const getStatusPillVariant = (type: 'sale' | 'received' | 'adjustment') => {
  switch (type) {
    case 'sale':
      return 'paid' as const;
    case 'received':
      return 'draft' as const;
    case 'adjustment':
      return 'pending' as const;
  }
};

const getStatusPillLabel = (type: 'sale' | 'received' | 'adjustment') => {
  switch (type) {
    case 'sale':
      return 'Sale';
    case 'received':
      return 'Received';
    case 'adjustment':
      return 'Adjustment';
  }
};

export function InventoryListPage() {
  const [activeCategory, setActiveCategory] = useState('All Products');

  const filteredItems = activeCategory === 'All Products'
    ? INVENTORY_ITEMS
    : INVENTORY_ITEMS.filter(item => item.category === activeCategory);

  return (
    <div className="inventory-page">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Inventory</h1>
          <p className="section-subtitle">1,247 products across 8 categories</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost">Import</button>
          <button className="btn btn-secondary">Adjust Stock</button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="filter-chips">
          {CATEGORIES.map((category) => (
            <FilterChip
              key={category}
              active={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </FilterChip>
          ))}
        </div>
        <button className="filter-chip" style={{ marginLeft: 'auto' }}>
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* Inventory Cards Grid */}
      <div className="inv-grid" style={{ marginBottom: '24px' }}>
        {filteredItems.map((item) => (
          <div className="inv-card" key={item.id}>
            <div className="inv-card-header">
              <div className={`inv-stock ${getStockBadgeClass(item.status)}`}>
                {getStockLabel(item.status)}
              </div>
              <button className="icon-btn" style={{ width: '28px', height: '28px', fontSize: '14px' }}>
                ⋮
              </button>
            </div>
            <div className="inv-name">{item.name}</div>
            <div className="inv-sku">{item.sku}</div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${getProgressFillClass(item.status)}`}
                style={{ width: `${Math.min((item.qty / item.threshold) * 50, 100)}%` }}
              />
            </div>
            <div className="inv-meta" style={{ marginTop: '12px' }}>
              <span className="inv-meta-label">Qty</span>
              <span className="inv-meta-value">{item.qty} units</span>
            </div>
            <div className="inv-meta">
              <span className="inv-meta-label">Cost</span>
              <span className="inv-meta-value font-mono">৳{item.cost}</span>
            </div>
            <div className="inv-meta">
              <span className="inv-meta-label">Price</span>
              <span className="inv-meta-value font-mono">৳{item.price}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Movement Log */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Stock Movement Log</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost text-sm">Export</button>
            <button className="btn btn-ghost text-sm">This Week</button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th className="text-right">Qty Change</th>
                <th className="text-right">Balance</th>
                <th>Reference</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {STOCK_MOVEMENTS.map((movement, index) => (
                <tr key={index}>
                  <td className="text-sm text-muted">{movement.date}</td>
                  <td>{movement.product}</td>
                  <td>
                    <span className={`status-pill status-${getStatusPillVariant(movement.type)}`}>
                      <span className="status-pill__dot" />
                      {getStatusPillLabel(movement.type)}
                    </span>
                  </td>
                  <td
                    className="text-right font-mono"
                    style={{
                      color: movement.qtyChange > 0 ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {movement.qtyChange > 0 ? `+${movement.qtyChange}` : movement.qtyChange}
                  </td>
                  <td className="text-right font-mono">{movement.balance}</td>
                  <td className="font-mono text-sm">{movement.reference}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar-sm">{movement.userInitials}</div>
                      <span className="text-sm">{movement.user}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventoryListPage;
