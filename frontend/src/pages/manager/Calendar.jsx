import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, Users } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { projectsApi } from '../../api/projects.api';
import Modal from '../../components/common/Modal';
import useNotifications from '../../hooks/useNotifications';
import { emailFeaturesEnabled } from '../../config/features';

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const pad = (value) => String(value).padStart(2, '0');
const toDateInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthLabel = (date) => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
const initialForm = () => ({ title: '', project_id: '', start_time: '09:00', end_time: '10:00', mode: 'onsite', location: '', meeting_url: '', reminder_minutes: '30', participant_ids: [] });

function monthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const leading = (first.getDay() + 6) % 7;
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((leading + total) / 7) * 7 }, (_, index) => {
    const day = index - leading + 1;
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return { date, inMonth: day >= 1 && day <= total };
  });
}

function isBeforeToday(date, today) {
  return toDateInput(date) < today;
}

function eventTime(event) {
  const value = String(event.starts_at || '').replace(' ', 'T');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(event.starts_at || '').slice(11, 16) : new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function Calendar() {
  const { notify } = useNotifications();
  const today = toDateInput(new Date());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const load = useCallback(async () => {
    setLoading(true);
    const visibleDays = monthDays(month);
    const [eventResult, projectResult, staffResult] = await Promise.allSettled([
      eventsApi.calendar(toDateInput(visibleDays[0].date), toDateInput(visibleDays.at(-1).date)),
      projectsApi.list({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      eventsApi.availableStaff()
    ]);
    if (eventResult.status === 'fulfilled') setEvents(eventResult.value || []);
    if (projectResult.status === 'fulfilled') setProjects(projectResult.value?.data || []);
    if (staffResult.status === 'fulfilled') setStaff(staffResult.value || []);
    if (eventResult.status === 'rejected') notify('Le calendrier n’a pas pu être chargé.', 'error');
    if (staffResult.status === 'rejected') notify('La liste des acteurs n’a pas pu être chargée.', 'error');
    setLoading(false);
  }, [notify, month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const receiveContextualSearch = (event) => setSearch(event.detail?.query || '');
    window.addEventListener('apild:portal-search', receiveContextualSearch);
    return () => window.removeEventListener('apild:portal-search', receiveContextualSearch);
  }, []);

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr-FR');
    if (!query) return events;
    return events.filter((event) => [event.title, event.location, event.description].some((value) => String(value || '').toLocaleLowerCase('fr-FR').includes(query)));
  }, [events, search]);
  const eventsByDate = useMemo(() => visibleEvents.reduce((result, event) => {
    const key = String(event.starts_at || '').slice(0, 10);
    if (key) (result[key] ||= []).push(event);
    return result;
  }, {}), [visibleEvents]);
  const selectedEvents = eventsByDate[selectedDate] || [];
  const days = useMemo(() => monthDays(month), [month]);
  const selectDate = (date) => {
    const next = toDateInput(date);
    setSelectedDate(next);
    if (date.getMonth() !== month.getMonth()) setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const openComposer = (date = selectedDate) => {
    if (date < today) {
      notify('Choisissez une date d’aujourd’hui ou une date future.', 'error');
      return;
    }
    setSelectedDate(date);
    setForm(initialForm());
    setComposerOpen(true);
  };

  const toggleParticipant = (userId) => {
    setForm((current) => {
      const selected = new Set(current.participant_ids);
      if (selected.has(userId)) selected.delete(userId); else selected.add(userId);
      return { ...current, participant_ids: [...selected] };
    });
  };

  const createEvent = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    if (form.end_time <= form.start_time) {
      notify('L’heure de fin doit être postérieure à l’heure de début.', 'error');
      return;
    }
    setSaving(true);
    try {
      const created = await eventsApi.create({
        title: form.title.trim(),
        event_type: 'meeting',
        status: 'scheduled',
        starts_at: `${selectedDate} ${form.start_time}:00`,
        ends_at: `${selectedDate} ${form.end_time}:00`,
        reminder_minutes: Number(form.reminder_minutes),
        ...(form.project_id ? { project_id: Number(form.project_id) } : {}),
        ...(form.location.trim() ? { location: form.location.trim() } : {}),
        ...(form.meeting_url.trim() ? { meeting_url: form.meeting_url.trim() } : {})
      });
      if (form.participant_ids.length) await eventsApi.replaceParticipants(created.id, form.participant_ids);
      notify(emailFeaturesEnabled && form.participant_ids.length ? 'Réunion créée : invitations et rappels mis en file d’attente.' : 'Réunion ajoutée au calendrier.', 'success');
      setComposerOpen(false);
      load();
    } catch (error) {
      notify(error.response?.data?.message || 'Création impossible.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return <section className="calendar-page">
    <header className="resource-title">
      <div><span className="eyebrow"><CalendarDays size={14} /> Planification</span><h1>Calendrier</h1><p>Consultez les activités passées et planifiez les prochaines réunions.</p></div>
      <button className="button button--primary" type="button" onClick={() => openComposer()}><Plus size={17} /> Planifier une réunion</button>
    </header>
    <div className="calendar-layout">
      <section className="card calendar-board" aria-label="Calendrier mensuel">
        <header className="calendar-board__header"><button className="icon-button" type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Mois précédent"><ChevronLeft /></button><h2>{monthLabel(month)}</h2><button className="icon-button" type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Mois suivant"><ChevronRight /></button></header>
        <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-days">{days.map(({ date, inMonth }) => {
          const key = toDateInput(date);
          const past = isBeforeToday(date, today);
          const hasEvents = Boolean(eventsByDate[key]?.length);
          return <button key={key} className={`calendar-day${inMonth ? '' : ' is-outside'}${key === selectedDate ? ' is-selected' : ''}${key === today ? ' is-today' : ''}${past ? ' is-past' : ''}${hasEvents ? ' has-events' : ''}`} type="button" onClick={() => selectDate(date)} aria-pressed={key === selectedDate} aria-label={`${key}${hasEvents ? `, ${eventsByDate[key].length} événement(s)` : ''}`}><b>{date.getDate()}</b>{hasEvents && <i aria-hidden="true">{eventsByDate[key].length}</i>}</button>;
        })}</div>
      </section>
      <aside className="card calendar-selection"><span className="eyebrow">Date sélectionnée</span><h2>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date(`${selectedDate}T12:00:00`))}</h2>{selectedDate >= today && <button className="button button--ghost" type="button" onClick={() => openComposer()}><Plus size={16} /> Planifier ici</button>}<div className="calendar-selection__events">{loading ? <p>Chargement…</p> : selectedEvents.length ? selectedEvents.map((event) => <article key={event.id}><strong>{event.title}</strong><small><Clock3 size={13} /> {eventTime(event)} · {event.location || 'Lieu à confirmer'}</small></article>) : <p>Aucun rendez-vous prévu pour cette date.</p>}</div></aside>
    </div>
    <Modal open={isComposerOpen} title="Planifier une réunion" onClose={() => !saving && setComposerOpen(false)}><form className="form-grid calendar-composer" onSubmit={createEvent}>
      <div className="field"><label htmlFor="calendar-title">Motif</label><input id="calendar-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Réunion de coordination" required autoFocus /></div>
      <div className="field"><label htmlFor="calendar-date">Date</label><input id="calendar-date" type="date" min={today} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} required /></div>
      <div className="field"><label htmlFor="calendar-start">Heure de début</label><input id="calendar-start" type="time" value={form.start_time} onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value }))} required /></div>
      <div className="field"><label htmlFor="calendar-end">Heure de fin</label><input id="calendar-end" type="time" value={form.end_time} onChange={(event) => setForm((current) => ({ ...current, end_time: event.target.value }))} required /></div>
      <div className="field"><label htmlFor="calendar-project">Projet associé <small>(facultatif)</small></label><select id="calendar-project" value={form.project_id} onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}><option value="">Aucun projet associé</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.reference ? `${project.reference} · ` : ''}{project.name}</option>)}</select></div>
      {emailFeaturesEnabled && <div className="field"><label htmlFor="calendar-reminder">Rappel par e-mail (minutes avant)</label><input id="calendar-reminder" type="number" min="0" max="43200" value={form.reminder_minutes} onChange={(event) => setForm((current) => ({ ...current, reminder_minutes: event.target.value }))} required /><small>Indiquez 0 pour ne pas envoyer de rappel.</small></div>}
      <div className="field"><label htmlFor="calendar-mode">Type de réunion</label><select id="calendar-mode" value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}><option value="onsite">En présentiel</option><option value="online">En ligne</option></select></div>
      {form.mode === 'onsite' ? <div className="field"><label htmlFor="calendar-location">Lieu <small>(facultatif)</small></label><input id="calendar-location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Ex. Salle de réunion APILD" /></div> : <div className="field"><label htmlFor="calendar-link">Lien de réunion <small>(facultatif)</small></label><input id="calendar-link" type="url" value={form.meeting_url} onChange={(event) => setForm((current) => ({ ...current, meeting_url: event.target.value }))} placeholder="https://…" /></div>}
      <fieldset className="field field--full calendar-participants"><legend><Users size={16} /> Participants <small>(facultatif)</small></legend>{staff.length ? <div className="calendar-participants__list">{staff.map((person) => <label key={person.id} className="calendar-participant"><input type="checkbox" checked={form.participant_ids.includes(person.id)} onChange={() => toggleParticipant(person.id)} /><span><strong>{person.first_name} {person.last_name}</strong><small>{person.job_title || person.email}</small></span></label>)}</div> : <p>Aucun membre du personnel actif n’est disponible.</p>}{emailFeaturesEnabled && <small>Chaque participant recevra une invitation et le rappel choisi.</small>}</fieldset>
      <div className="form-actions"><button className="button button--ghost" type="button" disabled={saving} onClick={() => setComposerOpen(false)}>Annuler</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Planification…' : 'Planifier la réunion'}</button></div>
    </form></Modal>
  </section>;
}
