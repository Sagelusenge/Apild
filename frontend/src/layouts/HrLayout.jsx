import { CalendarDays, CalendarRange, FileSignature, FileUser, LayoutDashboard, Users } from 'lucide-react';
import PortalLayout from './PortalLayout';
import useAuth from '../hooks/useAuth';

export default function HrLayout() {
  const { user } = useAuth();
  const items = [
    { to: '/rh', label: 'Tableau de bord RH', icon: LayoutDashboard },
    { to: '/rh/personnel', label: 'Dossiers du personnel', icon: FileUser },
    { to: '/rh/contrats', label: 'Contrats', icon: FileSignature },
    { to: '/rh/conges', label: 'Congés', icon: CalendarRange },
    { to: '/rh/calendrier', label: 'Mon calendrier', icon: CalendarDays },
    ...(user?.roles?.includes('admin') ? [{ to: '/admin', label: 'Administration', icon: Users }] : [])
  ];
  return <PortalLayout items={items} />;
}
