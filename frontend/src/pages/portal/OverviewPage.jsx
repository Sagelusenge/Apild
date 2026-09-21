import { useCallback, useEffect, useState } from 'react';
import { FolderKanban, ListChecks, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { statisticsApi } from '../../api/statistics.api';
import PerformanceCharts from '../../components/dashboard/PerformanceCharts';
import StatCard from '../../components/dashboard/StatCard';
import { useUi } from '../../context/UiContext';

const COPY = {
  fr: {
    title: 'Vue d’ensemble',
    subtitle: 'Suivez les indicateurs clés et la progression des opérations.',
    refresh: 'Actualiser',
    areas: { admin: 'Administration', staff: 'Opérations terrain', communication: 'Communication' },
    activeUsers: 'Utilisateurs actifs',
    activeUsersHint: 'Comptes opérationnels',
    activeProjects: 'Projets actifs',
    totalSuffix: 'au total',
    completedTasks: 'Tâches terminées',
    activePartners: 'Partenaires',
    activePartnersHint: 'Partenaires actifs'
  },
  en: {
    title: 'Overview',
    subtitle: 'Monitor key indicators and operational progress.',
    refresh: 'Refresh',
    areas: { admin: 'Administration', staff: 'Field operations', communication: 'Communications' },
    activeUsers: 'Active users',
    activeUsersHint: 'Operational accounts',
    activeProjects: 'Active projects',
    totalSuffix: 'in total',
    completedTasks: 'Completed tasks',
    activePartners: 'Partners',
    activePartnersHint: 'Active partners'
  },
  sw: {
    title: 'Muhtasari',
    subtitle: 'Fuatilia viashiria muhimu na maendeleo ya shughuli.',
    refresh: 'Sasisha',
    areas: { admin: 'Utawala', staff: 'Shughuli za eneo', communication: 'Mawasiliano' },
    activeUsers: 'Watumiaji hai',
    activeUsersHint: 'Akaunti zinazofanya kazi',
    activeProjects: 'Miradi inayoendelea',
    totalSuffix: 'kwa jumla',
    completedTasks: 'Kazi zilizokamilika',
    activePartners: 'Washirika',
    activePartnersHint: 'Washirika hai'
  }
};

export default function OverviewPage({ area = 'admin' }) {
  const { language } = useUi();
  const copy = COPY[language] || COPY.fr;
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await statisticsApi.overview());
    } catch {
      setStats({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return <div className="portal-overview">
    <div className="dashboard-welcome">
      <div>
        <span className="eyebrow">{copy.areas[area] || area}</span>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>
      <button className="sync-button" type="button" onClick={loadStats} disabled={loading}>
        <RefreshCw className={loading ? 'spinning' : ''} size={17} /> {copy.refresh}
      </button>
    </div>

    <div className="metric-grid">
      <StatCard label={copy.activeUsers} value={stats.active_users ?? '—'} hint={copy.activeUsersHint} icon={Users} />
      <StatCard label={copy.activeProjects} value={stats.active_projects ?? '—'} hint={`${stats.total_projects ?? 0} ${copy.totalSuffix}`} icon={FolderKanban} tone="blue" />
      <StatCard label={copy.completedTasks} value={stats.completed_tasks ?? '—'} hint={`${stats.total_tasks ?? 0} ${copy.totalSuffix}`} icon={ListChecks} />
      <StatCard label={copy.activePartners} value={stats.active_partners ?? '—'} hint={copy.activePartnersHint} icon={ShieldCheck} tone="gold" />
    </div>

    <PerformanceCharts stats={stats} loading={loading} />
  </div>;
}
