import { useState, useEffect, useRef } from 'react';
import { Search, Bell, HelpCircle, Menu, Command } from 'lucide-react';
import { useSidebarStore } from '../stores/sidebarStore';
import { useAuth } from '../hooks/useAuth';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function TopHeader({ onToggleSidebar, sidebarCollapsed }: TopHeaderProps) {
  const { toggleMobile } = useSidebarStore();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount] = useState(3);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const userInitials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : 'AK';
  const userName = user?.name || 'Ashik Khan';
  const userRole = user?.role || 'Store Manager';

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="top-bar">
      {/* Left: Page title / Mobile menu */}
      <div className="top-bar-left">
        <button
          className="icon-btn md:hidden"
          onClick={toggleMobile}
          title="Menu"
        >
          <Menu size={20} />
        </button>

        <button
          className="icon-btn hidden md:flex"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Command size={18} />
        </button>
      </div>

      {/* Center: Search */}
      <div className="search-bar">
        <Search className="search-icon" size={16} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search products, invoices, customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Right: Actions */}
      <div className="top-bar-right">
        <button className="icon-btn relative" title="Notifications">
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="badge">{notificationCount}</span>
          )}
        </button>

        <button className="icon-btn" title="Help">
          <HelpCircle size={20} />
        </button>

        <div className="user-menu">
          <div className="user-avatar">{userInitials}</div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-role">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
