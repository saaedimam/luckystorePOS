import { LayoutDashboard, ShoppingCart, Package, Warehouse, PlusCircle, Wallet, Users, PhoneCall, Settings, LogOut, Monitor } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import '../styles/layout.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Monitor, label: 'Quick POS', path: '/pos' },
  { icon: ShoppingCart, label: 'Sales', path: '/sales' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Warehouse, label: 'Inventory', path: '/inventory' },
  { icon: PlusCircle, label: 'Purchase', path: '/purchase' },
  { icon: Wallet, label: 'Supplier Ledger', path: '/finance/suppliers' },
  { icon: Users, label: 'Customer Ledger', path: '/finance/customers' },
  { icon: PhoneCall, label: 'Collections', path: '/collections' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--color-primary)' }}>
          Lucky Store
        </h2>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Admin Panel</p>
      </div>

      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              fontWeight: isActive ? '600' : '500',
              transition: 'all var(--transition-fast)',
            })}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            color: 'var(--color-danger)',
            width: '100%',
            fontWeight: '500',
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
