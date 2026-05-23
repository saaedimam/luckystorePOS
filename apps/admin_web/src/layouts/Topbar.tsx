// Will integrate the existing topheader logic here later, this is a placeholder wrapper
import { TopHeader } from '../components/TopHeader';
import { useSidebarStore } from '../stores/sidebarStore';

export function Topbar() {
  const { isCollapsed, toggle } = useSidebarStore();
  // Eventually replace with a fully standard Tailwind/Token-based topbar
  return <TopHeader onToggleSidebar={toggle} sidebarCollapsed={isCollapsed} />;
}
