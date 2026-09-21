import { CalendarDays, ClipboardCheck, FileText, LayoutDashboard } from 'lucide-react';
import { useUi } from '../context/UiContext';
import PortalLayout from './PortalLayout';
export default function StaffLayout() {
  const { text } = useUi();
  const { staffNav } = text.portal;
  const items = [{ to: '/staff', label: staffNav.dashboard, icon: LayoutDashboard }, { to: '/staff/taches', label: staffNav.tasks, icon: ClipboardCheck }, { to: '/staff/calendrier', label: staffNav.calendar, icon: CalendarDays }, { to: '/staff/documents', label: staffNav.documents, icon: FileText }];
  return <PortalLayout items={items} />;
}
