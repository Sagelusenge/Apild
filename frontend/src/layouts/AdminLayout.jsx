import { CalendarDays, ClipboardList, FileClock, FolderKanban, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';
import { useUi } from '../context/UiContext';
import PortalLayout from './PortalLayout';
export default function AdminLayout() {
  const { text } = useUi();
  const { adminNav, managerNav } = text.portal;
  const items = [
    { to: '/admin', label: adminNav.dashboard, icon: LayoutDashboard },
    { to: '/admin/projets', label: managerNav.projects, icon: FolderKanban },
    { to: '/admin/taches', label: managerNav.tasks, icon: ClipboardList },
    { to: '/admin/calendrier', label: managerNav.calendar, icon: CalendarDays },
    { to: '/admin/equipe', label: managerNav.team, icon: Users },
    { to: '/admin/utilisateurs', label: adminNav.users, icon: Users },
    { to: '/admin/roles', label: adminNav.roles, icon: ShieldCheck },
    { to: '/admin/audit', label: adminNav.audit, icon: FileClock }
  ];
  return <PortalLayout items={items} />;
}
