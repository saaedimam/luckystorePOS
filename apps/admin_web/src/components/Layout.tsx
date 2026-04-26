import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';

export function Layout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
