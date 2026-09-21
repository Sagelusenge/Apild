import { CalendarDays, MapPin } from 'lucide-react';

export default function CalendarWidget({ events = [] }) {
  return <section className="dashboard-panel card"><div className="panel-heading"><span><CalendarDays /></span><div><h2>Calendrier de la semaine</h2><p>Prochains rendez-vous</p></div></div><div className="event-list">{events.length ? events.slice(0, 3).map((event) => <article key={event.id}><time><b>{new Date(event.starts_at).toLocaleDateString('fr-FR', { day: '2-digit' })}</b><small>{new Date(event.starts_at).toLocaleDateString('fr-FR', { month: 'short' })}</small></time><div><strong>{event.title}</strong><small><MapPin size={13}/>{event.location || 'En ligne'}</small></div></article>) : <p className="muted">Aucun événement programmé.</p>}</div></section>;
}
