import { useEffect, useState } from 'react';
import { CheckSquare, FolderKanban, Plus, RefreshCw, TriangleAlert, Users } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import { statisticsApi } from '../../api/statistics.api';
import { projectsApi } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import { eventsApi } from '../../api/events.api';
import StatCard from '../../components/dashboard/StatCard';
import ProjectProgress from '../../components/dashboard/ProjectProgress';
import TaskCard from '../../components/dashboard/TaskCard';
import CalendarWidget from '../../components/dashboard/CalendarWidget';
import QuickActions from '../../components/dashboard/QuickActions';
import PerformanceCharts from '../../components/dashboard/PerformanceCharts';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

export default function ManagerDashboard() {
  const { notify } = useNotifications();
  const [data, setData] = useState({ stats: {}, projects: [], tasks: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium', due_date: '' });
  const load = async () => {
    setLoading(true);
    const results = await Promise.allSettled([statisticsApi.overview(), projectsApi.list({ limit: 3, status: 'active' }), tasksApi.list({ limit: 5 }), eventsApi.list({ limit: 4, status: 'scheduled' })]);
    setData({ stats: results[0].value || {}, projects: results[1].value?.data || [], tasks: results[2].value?.data || [], events: results[3].value?.data || [] });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const createTask = async (event) => {
    event.preventDefault();
    try { await tasksApi.create({ ...form }); notify('Tâche créée avec succès.', 'success'); setModal(false); setForm({ title: '', priority: 'medium', due_date: '' }); load(); }
    catch (error) { notify(error.response?.data?.message || 'Création impossible.', 'error'); }
  };
  const stats = data.stats;
  return <div className="manager-dashboard">
    <div className="dashboard-welcome"><div><h1>Tableau de bord</h1><p>Pilotez les projets, les équipes et les indicateurs opérationnels depuis un seul espace.</p></div><button className="sync-button" onClick={load}><RefreshCw className={loading ? 'spinning' : ''} size={17}/> Actualiser</button></div>
    <div className="metric-grid"><StatCard label="Tâches" value={stats.total_tasks ?? '—'} hint={`${stats.completed_tasks ?? 0} terminées`} icon={CheckSquare}/><StatCard label="Projets actifs" value={stats.active_projects ?? '—'} hint={`${stats.total_projects ?? 0} au total`} icon={FolderKanban} tone="blue"/><StatCard label="Tâches en retard" value={stats.overdue_tasks ?? '—'} hint="Action immédiate" icon={TriangleAlert} tone="red"/><StatCard label="Acteurs actifs" value={stats.active_users ?? '—'} hint="Comptes opérationnels" icon={Users} tone="gold"/></div>
    <PerformanceCharts stats={stats} loading={loading} />
    <div className="dashboard-grid"><div className="dashboard-main"><section className="dashboard-panel card"><div className="panel-heading panel-heading--between"><div><h2>Projets en cours</h2><p>Supervision et revue des étapes sur le terrain</p></div><span className="badge badge--success">{data.projects.length} actifs</span></div><div className="dash-projects">{data.projects.map((project) => <ProjectProgress key={project.id} project={project} />)}</div></section>
      <section className="dashboard-panel card"><div className="panel-heading panel-heading--between"><div><h2>Tâches et priorités</h2><p>Planification opérationnelle et suivi des livrables</p></div><Button onClick={() => setModal(true)}><Plus size={16}/> Nouvelle</Button></div><div className="task-table"><div className="task-row task-head"><span>Tâche</span><span>Projet</span><span>Échéance</span><span>Priorité</span><span>Statut</span></div>{data.tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div></section>
    </div><aside className="dashboard-side"><QuickActions onTask={() => setModal(true)} /><CalendarWidget events={data.events}/></aside></div>
    <Modal open={modal} title="Créer une tâche" onClose={() => setModal(false)}><form className="form-grid" onSubmit={createTask}><div className="field"><label>Intitulé</label><input value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} required /></div><div className="field"><label>Priorité</label><select value={form.priority} onChange={(e) => setForm({...form,priority:e.target.value})}><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Élevée</option><option value="critical">Critique</option></select></div><div className="field"><label>Échéance</label><input type="date" value={form.due_date} onChange={(e) => setForm({...form,due_date:e.target.value})} required /></div><Button type="submit">Enregistrer la tâche</Button></form></Modal>
  </div>;
}
