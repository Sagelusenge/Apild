import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle2, Mail, Newspaper, X } from 'lucide-react';
import { resourceApi } from '../../api/resource.api';
import { emailFeaturesEnabled } from '../../config/features';

const roleFallbacks = {
  admin: [{ id: 'admin-overview', icon: CheckCircle2, title: 'Suivi opérationnel', text: 'Consultez les tâches et les validations en attente.', time: 'À consulter' }],
  communication: [{ id: 'communication-overview', icon: Newspaper, title: 'Suivi éditorial', text: 'Les articles récents apparaîtront ici.', time: 'À jour' }],
  staff: [{ id: 'staff-overview', icon: CheckCircle2, title: 'Mes tâches', text: 'Vos tâches à suivre apparaîtront ici.', time: 'À jour' }]
};

const dateLabel = (value) => {
  if (!value) return 'Récemment';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Récemment';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export default function NotificationMenu({ open, onClose, user, onCountChange }) {
  const [state, setState] = useState({ items: [], loading: false });
  const roles = user?.roles || [];
  const isCommunication = roles.includes('communication');
  const isStaff = !isCommunication && !roles.includes('admin') && roles.includes('staff');
  const activeRole = isCommunication ? 'communication' : isStaff ? 'staff' : 'admin';

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    try {
      if (isCommunication) {
        const response = await resourceApi.list(emailFeaturesEnabled ? 'newsletter/subscribers' : 'articles', { page: 1, limit: 5, sortBy: 'created_at', sortOrder: 'desc' });
        const rows = Array.isArray(response.data) ? response.data : [];
        const items = rows.map((record) => ({
          id: `${emailFeaturesEnabled ? 'subscriber' : 'article'}-${record.id}`,
          icon: emailFeaturesEnabled ? Mail : Newspaper,
          title: emailFeaturesEnabled ? 'Nouvel abonnement newsletter' : 'Article récent',
          text: emailFeaturesEnabled ? `${record.email} s’est inscrit(e) à la newsletter.` : record.title,
          time: dateLabel(record.created_at)
        }));
        setState({ items, loading: false });
        onCountChange?.(items.length);
        return;
      }

      const response = await resourceApi.list('tasks', { page: 1, limit: 5, sortBy: 'updated_at', sortOrder: 'desc' });
      const rows = Array.isArray(response.data) ? response.data : [];
      const items = rows.map((task) => ({
        id: `task-${task.id}`,
        icon: CheckCircle2,
        title: isStaff ? 'Tâche à suivre' : 'Activité opérationnelle',
        text: task.title || 'Une tâche a été mise à jour.',
        time: dateLabel(task.updated_at || task.created_at)
      }));
      setState({ items, loading: false });
      onCountChange?.(items.length);
    } catch {
      const fallback = roleFallbacks[activeRole];
      setState({ items: fallback, loading: false });
      onCountChange?.(fallback.length);
    }
  }, [activeRole, isCommunication, isStaff, onCountChange]);

  useEffect(() => {
    if (open) load();
  }, [load, open]);

  if (!open) return null;
  return <section className="notification-menu" aria-label="Notifications">
    <header><div><span>Notifications</span><small>{isCommunication ? emailFeaturesEnabled ? 'Abonnements récents' : 'Articles récents' : 'Activité récente'}</small></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fermer les notifications"><X size={16} /></button></header>
    <div className="notification-menu__list" aria-live="polite">
      {state.loading ? <p className="notification-menu__empty">Chargement des notifications…</p> : state.items.length ? state.items.map(({ id, icon: Icon, title, text, time }) => <article key={id}><span><Icon size={16} /></span><div><strong>{title}</strong><p>{text}</p><small>{time}</small></div></article>) : <p className="notification-menu__empty"><Bell size={18} /> Aucune nouvelle notification.</p>}
    </div>
  </section>;
}
