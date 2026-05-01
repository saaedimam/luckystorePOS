import { LayoutDashboard, ShoppingCart, Package, Warehouse, PlusCircle, Wallet, Users, PhoneCall, Settings, LogOut, Monitor, Receipt, Bell } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import '../styles/layout.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Monitor, label: 'Quick POS', path: '/pos' },
  { icon: ShoppingCart, label: 'Sales', path: '/sales' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Warehouse, label: 'Inventory', path: '/inventory' },
  { icon: PlusCircle, label: 'Purchase', path: '/purchase' },
  { icon: Wallet, label: 'Supplier Ledger', path: '/finance/suppliers' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Users, label: 'Customer Ledger', path: '/finance/customers' },
  { icon: PhoneCall, label: 'Collections', path: '/collections' },
  { icon: Bell, label: 'Reminders', path: '/reminders' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Lucky Store</h2>
        <p>Admin Panel</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              isActive ? 'sidebar-nav-item active' : 'sidebar-nav-item'
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={signOut} style={{ color: 'var(--text-sidebar)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
