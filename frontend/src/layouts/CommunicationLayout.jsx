import { Image, LayoutDashboard, Mail, Newspaper, Users } from 'lucide-react';
import PortalLayout from './PortalLayout';
import { emailFeaturesEnabled } from '../config/features';
const items = [{ to: '/communication', label: 'Tableau de bord', icon: LayoutDashboard }, { to: '/communication/articles', label: 'Articles', icon: Newspaper }, { to: '/communication/medias', label: 'Médiathèque', icon: Image }, ...(emailFeaturesEnabled ? [{ to: '/communication/newsletters', label: 'Newsletters', icon: Mail }, { to: '/communication/abonnes', label: 'Abonnés', icon: Users }] : [])];
export default function CommunicationLayout() { return <PortalLayout items={items} />; }
