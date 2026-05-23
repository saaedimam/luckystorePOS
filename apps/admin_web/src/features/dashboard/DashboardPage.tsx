import { KpiCard } from '../../components/ui/KpiCard';
import { StatusPill } from '../../components/ui/StatusPill';

// Mock data for the dashboard
const KPI_DATA = [
  { label: "Today's Sales", value: '৳42,850', change: '12.5% vs yesterday', trend: 'up' as const },
  { label: 'Transactions', value: '186', change: '8.3% vs yesterday', trend: 'up' as const },
  { label: 'Avg. Basket', value: '৳230', change: '2.1% vs yesterday', trend: 'down' as const },
  { label: 'Stock Alert', value: '14', change: 'Items below threshold', trend: 'neutral' as const },
];

const LOW_STOCK_ITEMS = [
  { emoji: '🥛', name: 'Fresh Milk 1L', category: 'Dairy', sku: 'PRD-0012', current: 4, threshold: 20 },
  { emoji: '🍚', name: 'Basmati Rice 5kg', category: 'Grocery', sku: 'PRD-0045', current: 8, threshold: 15 },
  { emoji: '🧴', name: 'Coconut Oil 500ml', category: 'Grocery', sku: 'PRD-0078', current: 2, threshold: 12 },
  { emoji: '🥚', name: 'Brown Eggs (12pc)', category: 'Dairy', sku: 'PRD-0091', current: 6, threshold: 10 },
];

const RECENT_TRANSACTIONS = [
  { invoice: 'INV-240630-1842', customer: 'Rafiq Karim', initials: 'RK', items: 8, total: 1240, payment: 'bkash', status: 'paid', time: '2 min ago' },
  { invoice: 'INV-240630-1841', customer: 'Nusrat Ahmed', initials: 'NA', items: 3, total: 450, payment: 'Cash', status: 'paid', time: '8 min ago' },
  { invoice: 'INV-240630-1840', customer: 'Shahin Hossain', initials: 'SH', items: 12, total: 3680, payment: 'Card', status: 'paid', time: '15 min ago' },
  { invoice: 'INV-240630-1838', customer: 'Fatema Begum', initials: 'FM', items: 5, total: 890, payment: 'bkash', status: 'pending', time: '22 min ago' },
  { invoice: 'INV-240630-1835', customer: 'Jamal Mia', initials: 'JM', items: 1, total: 120, payment: 'Cash', status: 'paid', time: '31 min ago' },
];

// Simple SVG Area Chart component
function SalesChart() {
  return (
    <div className="chart-container">
      <svg className="chart-svg" viewBox="0 0 600 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c96442" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#c96442" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1="0" y1="180" x2="600" y2="180" stroke="#f0eee6" strokeWidth="1"/>
        <line x1="0" y1="120" x2="600" y2="120" stroke="#f0eee6" strokeWidth="1"/>
        <line x1="0" y1="60" x2="600" y2="60" stroke="#f0eee6" strokeWidth="1"/>
        {/* Area */}
        <path d="M0,180 L30,165 L60,140 L90,155 L120,110 L150,95 L180,105 L210,75 L240,60 L270,80 L300,55 L330,45 L360,70 L390,50 L420,65 L450,40 L480,55 L510,35 L540,48 L570,30 L600,42 L600,180 Z" fill="url(#areaGrad)"/>
        {/* Line */}
        <polyline points="0,180 30,165 60,140 90,155 120,110 150,95 180,105 210,75 240,60 270,80 300,55 330,45 360,70 390,50 420,65 450,40 480,55 510,35 540,48 570,30 600,42" fill="none" stroke="#c96442" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots */}
        <circle cx="300" cy="55" r="4" fill="#c96442" stroke="#fff" strokeWidth="2"/>
        <circle cx="450" cy="40" r="4" fill="#c96442" stroke="#fff" strokeWidth="2"/>
        <circle cx="570" cy="30" r="4" fill="#c96442" stroke="#fff" strokeWidth="2"/>
        {/* X labels */}
        <text x="0" y="220" fill="#87867f" fontSize="10" fontFamily="sans-serif">Jun 1</text>
        <text x="150" y="220" fill="#87867f" fontSize="10" fontFamily="sans-serif">Jun 8</text>
        <text x="300" y="220" fill="#87867f" fontSize="10" fontFamily="sans-serif">Jun 15</text>
        <text x="450" y="220" fill="#87867f" fontSize="10" fontFamily="sans-serif">Jun 22</text>
        <text x="570" y="220" fill="#87867f" fontSize="10" fontFamily="sans-serif">Jun 30</text>
      </svg>
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="dashboard-page">
      {/* KPI Grid */}
      <div className="kpi-grid">
        {KPI_DATA.map((kpi, index) => (
          <KpiCard
            key={index}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Layout 2-col */}
      <div className="layout-2col">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales Trend — Last 14 Days</h3>
            <button className="btn btn-ghost text-sm">View Report</button>
          </div>
          <div className="card-body">
            <SalesChart />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Low Stock Alert</h3>
            <button className="btn btn-ghost text-sm">Manage Stock</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Current</th>
                  <th className="text-right">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {LOW_STOCK_ITEMS.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="product-cell">
                        <div className="product-thumb">{item.emoji}</div>
                        <div>
                          <div className="product-name">{item.name}</div>
                          <div className="text-sm text-muted">{item.category} · {item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-mono" style={{ color: item.current < 5 ? 'var(--danger)' : 'var(--warning)' }}>
                      {item.current}
                    </td>
                    <td className="text-right font-mono">{item.threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Transactions</h3>
          <button className="btn btn-ghost text-sm">View All</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Items</th>
                <th className="text-right">Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TRANSACTIONS.map((tx, index) => (
                <tr key={index}>
                  <td className="font-mono text-accent" style={{ cursor: 'pointer' }}>{tx.invoice}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar-sm">{tx.initials}</div>
                      <span>{tx.customer}</span>
                    </div>
                  </td>
                  <td>{tx.items} items</td>
                  <td className="text-right font-mono">৳{tx.total.toLocaleString()}</td>
                  <td className="text-sm">{tx.payment}</td>
                  <td><StatusPill variant={tx.status as 'paid' | 'pending'}>{tx.status}</StatusPill></td>
                  <td className="text-muted text-sm">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
