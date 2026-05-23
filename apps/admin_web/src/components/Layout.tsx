import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { useSidebarStore } from '../stores/sidebarStore';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';

export function Layout() {
  const { isCollapsed, toggle } = useSidebarStore();

  return (
    <div className="app-shell">
      <Sidebar collapsed={isCollapsed} />
      <div className="main-area">
        <TopHeader onToggleSidebar={toggle} sidebarCollapsed={isCollapsed} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
