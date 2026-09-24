import { CalendarDays, CalendarRange, FileSignature, FileText, FileUser, LayoutDashboard } from 'lucide-react';
import PortalLayout from './PortalLayout';

export default function HrLayout() {
  const items = [
    { to: '/rh', label: 'Tableau de bord RH', icon: LayoutDashboard },
    { to: '/rh/personnel', label: 'Dossiers du personnel', icon: FileUser },
    { to: '/rh/contrats', label: 'Contrats', icon: FileSignature },
    { to: '/rh/conges', label: 'Congés', icon: CalendarRange },
    { to: '/rh/calendrier', label: 'Mon calendrier', icon: CalendarDays },
    { to: '/rh/documents', label: 'Fichiers partagés', icon: FileText }
  ];
  return <PortalLayout items={items} />;
}
