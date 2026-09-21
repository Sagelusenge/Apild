import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Languages, LayoutDashboard, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import Brand from '../components/Brand';
import Modal from '../components/common/Modal';
import NotificationMenu from '../components/dashboard/NotificationMenu';
import ProfileMenu from '../components/portal/ProfileMenu';
import { useUi } from '../context/UiContext';
import useAuth from '../hooks/useAuth';
import { resolveAvatarUrl } from '../utils/avatar';
import './PortalSidebar.css';

const searchTargets = [
  ['/admin/projets', 'les projets'],
  ['/admin/taches', 'les tâches'],
  ['/admin/calendrier', 'le calendrier'],
  ['/admin/equipe', 'les acteurs'],
  ['/admin/documents', 'les documents'],
  ['/admin/utilisateurs', 'les acteurs'],
  ['/admin/roles', 'les rôles'],
  ['/admin/audit', 'le journal d’audit'],
  ['/communication/articles', 'les articles'],
  ['/communication/medias', 'les médias'],
  ['/communication/newsletters', 'les newsletters'],
  ['/communication/abonnes', 'les abonnés'],
  ['/staff/taches', 'mes tâches'],
  ['/staff/calendrier', 'mon calendrier'],
  ['/staff/documents', 'les documents']
];

const searchTargetFor = (pathname) => searchTargets.find(([path]) => pathname === path)?.[1] || '';

export default function PortalLayout({ items }) {
  const [open, setOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [topSearch, setTopSearch] = useState('');
  const { user, logout } = useAuth();
  const { language, setLanguage, theme, toggleTheme, text } = useUi();
  const location = useLocation();
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}` || 'AP';
  const sidebarAvatarUrl = resolveAvatarUrl(user?.avatar_url);
  const searchTarget = useMemo(() => searchTargetFor(location.pathname), [location.pathname]);

  useEffect(() => {
    setTopSearch('');
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  const updateTopSearch = (value) => {
    setTopSearch(value);
    window.dispatchEvent(new CustomEvent('apild:portal-search', { detail: { query: value, pathname: location.pathname } }));
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return <div className="portal-shell">
    <aside className={open ? 'portal-sidebar is-open' : 'portal-sidebar'}>
      <div className="sidebar-brand"><Link to="/" aria-label={text.a11y.home} onClick={() => setOpen(false)}><Brand inverse /></Link><button className="icon-button sidebar-close" type="button" onClick={() => setOpen(false)} aria-label={text.portal.closeMenu}><X /></button></div>
      <nav>{items.map(({ to, label: itemLabel, icon: Icon = LayoutDashboard }) => <NavLink key={to} to={to} end={to.split('/').length === 2} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={19} />{itemLabel}</NavLink>)}</nav>
      <button className="sidebar-logout" type="button" onClick={() => setShowLogoutDialog(true)}><LogOut size={17} /> {text.portal.logout}</button>
      <div className="sidebar-bottom"><div className="sidebar-user"><span className="sidebar-user__avatar">{sidebarAvatarUrl && <img src={sidebarAvatarUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}{initials}</span><div><strong>{user?.first_name} {user?.last_name}</strong>{user?.job_title && <small>{user.job_title}</small>}</div></div></div>
    </aside>
    <div className="portal-body"><header className="portal-topbar"><button className="icon-button portal-menu" type="button" onClick={() => setOpen(true)} aria-label={text.nav.menu}><Menu /></button>{searchTarget && <div className="top-search"><Search size={18} /><input value={topSearch} onChange={(event) => updateTopSearch(event.target.value)} placeholder={`Rechercher dans ${searchTarget}…`} aria-label={`Rechercher dans ${searchTarget}`} /></div>}<div className="portal-controls"><label className="language-select portal-language-select"><Languages size={17} aria-hidden="true"/><span className="sr-only">{text.language}</span><select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={text.language}><option value="fr">FR</option><option value="en">EN</option><option value="sw">SW</option></select></label><button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? text.theme.light : text.theme.dark} title={theme === 'dark' ? text.theme.light : text.theme.dark}>{theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button></div><div className="portal-notification-wrap"><button className="icon-button bell" type="button" onClick={() => setIsNotificationsOpen((current) => !current)} aria-label={text.portal.notifications} aria-expanded={isNotificationsOpen}><Bell />{notificationCount > 0 && <b>{notificationCount > 9 ? '9+' : notificationCount}</b>}</button><NotificationMenu open={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} user={user} onCountChange={setNotificationCount} /></div><ProfileMenu onRequestLogout={() => setShowLogoutDialog(true)} /></header><main className="portal-content"><div className="portal-page-transition" key={location.pathname}><Outlet /></div></main></div>
    {open && <button className="sidebar-overlay" type="button" aria-label={text.portal.closeMenu} onClick={() => setOpen(false)} />}
    <Modal open={showLogoutDialog} title="Confirmer la déconnexion" onClose={() => !isLoggingOut && setShowLogoutDialog(false)}><div className="logout-confirm"><p>Voulez-vous vraiment vous déconnecter de votre espace APILD ?</p><div className="form-actions"><button className="button button--ghost" type="button" disabled={isLoggingOut} onClick={() => setShowLogoutDialog(false)}>Annuler</button><button className="button button--primary" type="button" disabled={isLoggingOut} onClick={confirmLogout}>{isLoggingOut ? 'Déconnexion…' : 'Oui, me déconnecter'}</button></div></div></Modal>
  </div>;
}
