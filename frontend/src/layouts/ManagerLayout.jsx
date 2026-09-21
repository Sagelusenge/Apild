import { CalendarDays, ClipboardList, FolderKanban, LayoutDashboard, Users } from 'lucide-react';
import { useUi } from '../context/UiContext';
import PortalLayout from './PortalLayout';
export default function ManagerLayout() {
  const { text } = useUi();
  const { managerNav } = text.portal;
  const items = [{ to: '/manager', label: managerNav.dashboard, icon: LayoutDashboard }, { to: '/manager/projets', label: managerNav.projects, icon: FolderKanban }, { to: '/manager/taches', label: managerNav.tasks, icon: ClipboardList }, { to: '/manager/calendrier', label: managerNav.calendar, icon: CalendarDays }, { to: '/manager/equipe', label: managerNav.team, icon: Users }];
  return <PortalLayout items={items} />;
}
