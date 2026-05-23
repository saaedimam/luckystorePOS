// Will integrate the existing sidebar logic here later, this is a placeholder wrapper
import { Sidebar as NewSidebar } from '../components/Sidebar';
import { useSidebarStore } from '../stores/sidebarStore';

export function Sidebar() {
  const { isCollapsed } = useSidebarStore();
  // Eventually replace with a fully standard Tailwind/Token-based sidebar
  return <NewSidebar collapsed={isCollapsed} />;
}
