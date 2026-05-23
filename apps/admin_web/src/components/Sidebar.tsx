import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  Settings,
  LogOut,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSidebarStore } from '../stores/sidebarStore';

interface NavItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

function useNavSections(): NavSection[] {
  return [
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: ShoppingCart, label: 'Point of Sale', path: '/pos' },
        { icon: Package, label: 'Inventory', path: '/catalog/inventory' },
      ],
    },
    {
      id: 'management',
      label: 'Management',
      items: [
        { icon: Users, label: 'Sales & CRM', path: '/sales' },
        { icon: ShoppingBag, label: 'Purchases', path: '/purchase' },
        { icon: Wallet, label: 'Finance', path: '/finance/suppliers' },
        { icon: TrendingUp, label: 'Competitors', path: '/competitors' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      items: [
        { icon: Settings, label: 'Settings', path: '/settings' },
      ],
    },
  ];
}

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { signOut } = useAuth();
  const { toggle, isMobileOpen, setMobileOpen } = useSidebarStore();
  const navSections = useNavSections();
  const location = useLocation();

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Toggle button - visible when expanded */}
      <button
        onClick={toggle}
        className={`sidebar-toggle ${collapsed ? 'sidebar-toggle--collapsed' : ''}`}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${
          isMobileOpen ? 'sidebar--mobile-open' : ''
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-mark">L</div>
          {!collapsed && <span className="logo-text">LuckyStorePOS</span>}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.id} className="nav-section">
              {!collapsed && (
                <div className="nav-section-label">{section.label}</div>
              )}
              <div className="nav-items">
                {section.items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="nav-icon">
                        <item.icon size={20} />
                      </span>
                      {!collapsed && <span className="nav-label">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Branch selector */}
          <div className="branch-select" title={collapsed ? 'Dhanmondi Branch' : undefined}>
            <div className="branch-dot" />
            {!collapsed && (
              <div className="branch-info">
                <div className="branch-name">Dhanmondi Branch</div>
                <div className="branch-sub">Active · 3 staff</div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={signOut}
            className="logout-button"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
