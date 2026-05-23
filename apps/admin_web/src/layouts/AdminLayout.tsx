import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import { useSidebarStore } from '../stores/sidebarStore';

type AdminLayoutProps = {
  children?: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isCollapsed, toggle } = useSidebarStore();

  return (
    <div className="app-shell">
      <Sidebar collapsed={isCollapsed} />
      <div className="main-area">
        <TopHeader onToggleSidebar={toggle} sidebarCollapsed={isCollapsed} />
        <main className="content">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
