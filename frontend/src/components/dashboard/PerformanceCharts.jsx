import { Activity, BarChart3, CheckCircle2 } from 'lucide-react';
import { useUi } from '../../context/UiContext';

const COPY = {
  fr: {
    completion: 'Taux de réalisation',
    completionDetail: 'des tâches enregistrées sont finalisées',
    activity: 'Suivi des opérations',
    activityDetail: 'État actuel des projets et des tâches',
    activeProjects: 'Projets actifs',
    completedTasks: 'Tâches finalisées',
    projects: 'projets',
    tasks: 'tâches',
    availability: 'Indicateurs de performance',
    interventions: 'Interventions documentées',
    beneficiaries: 'Bénéficiaires accompagnés',
    partners: 'Partenaires actifs',
    pending: 'Synchronisation des indicateurs…'
  },
  en: {
    completion: 'Completion rate',
    completionDetail: 'of recorded tasks are completed',
    activity: 'Operations tracking',
    activityDetail: 'Current status of projects and tasks',
    activeProjects: 'Active projects',
    completedTasks: 'Completed tasks',
    projects: 'projects',
    tasks: 'tasks',
    availability: 'Performance indicators',
    interventions: 'Documented interventions',
    beneficiaries: 'People supported',
    partners: 'Active partners',
    pending: 'Synchronizing indicators…'
  },
  sw: {
    completion: 'Kiwango cha utekelezaji',
    completionDetail: 'ya kazi zilizosajiliwa zimekamilika',
    activity: 'Ufuatiliaji wa shughuli',
    activityDetail: 'Hali ya sasa ya miradi na kazi',
    activeProjects: 'Miradi inayoendelea',
    completedTasks: 'Kazi zilizokamilika',
    projects: 'miradi',
    tasks: 'kazi',
    availability: 'Viashiria vya utendaji',
    interventions: 'Shughuli zilizoandikwa',
    beneficiaries: 'Walengwa waliosaidiwa',
    partners: 'Washirika hai',
    pending: 'Viashiria vinasawazishwa…'
  }
};

const LOCALES = { fr: 'fr-FR', en: 'en-US', sw: 'sw-TZ' };

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentage(value, total) {
  if (!total) return 0;
  return Math.round(Math.min(100, Math.max(0, (value / total) * 100)));
}

function CompletionDonut({ value, label, detail }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return <div className="performance-donut-wrap">
    <div className="performance-donut" role="img" aria-label={`${label}: ${value}%`}>
      <svg viewBox="0 0 132 132" aria-hidden="true">
        <circle className="performance-donut-track" cx="66" cy="66" r={radius} />
        <circle
          className="performance-donut-progress"
          cx="66"
          cy="66"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="performance-donut-value">{value}%</span>
    </div>
    <p>{detail}</p>
  </div>;
}

function ProgressBar({ label, value, total, unit, tone }) {
  const rate = percentage(value, total);
  return <div className="performance-bar-row">
    <div className="performance-bar-label">
      <span>{label}</span>
      <strong>{value}<small> / {total} {unit}</small></strong>
    </div>
    <div className="performance-bar-track" aria-hidden="true">
      <i className={`performance-bar-fill performance-bar-fill--${tone}`} style={{ width: `${rate}%` }} />
    </div>
    <span className="performance-bar-percent">{rate}%</span>
  </div>;
}

/**
 * Displays current, factual operational ratios from the statistics overview.
 * It deliberately avoids fabricating a time series when historical data is not available.
 */
export default function PerformanceCharts({ stats = {}, loading = false }) {
  const { language } = useUi();
  const copy = COPY[language] || COPY.fr;
  const formatNumber = new Intl.NumberFormat(LOCALES[language] || LOCALES.fr);
  const totalTasks = numeric(stats.total_tasks);
  const completedTasks = numeric(stats.completed_tasks);
  const totalProjects = numeric(stats.total_projects);
  const activeProjects = numeric(stats.active_projects);
  const completion = percentage(completedTasks, totalTasks);
  const summary = [
    { label: copy.interventions, value: numeric(stats.interventions), icon: Activity },
    { label: copy.beneficiaries, value: numeric(stats.beneficiaries), icon: CheckCircle2 },
    { label: copy.partners, value: numeric(stats.active_partners), icon: BarChart3 }
  ];

  return <section className="performance-grid" aria-label={copy.availability}>
    <article className="performance-panel card">
      <header className="performance-heading">
        <div className="performance-heading-icon"><CheckCircle2 size={19} /></div>
        <div><h2>{copy.completion}</h2><p>{loading ? copy.pending : copy.completionDetail}</p></div>
      </header>
      <CompletionDonut value={completion} label={copy.completion} detail={`${formatNumber.format(completedTasks)} / ${formatNumber.format(totalTasks)} ${copy.tasks}`} />
    </article>

    <article className="performance-panel card">
      <header className="performance-heading">
        <div className="performance-heading-icon performance-heading-icon--blue"><BarChart3 size={19} /></div>
        <div><h2>{copy.activity}</h2><p>{copy.activityDetail}</p></div>
      </header>
      <div className="performance-bars">
        <ProgressBar label={copy.activeProjects} value={activeProjects} total={totalProjects} unit={copy.projects} tone="green" />
        <ProgressBar label={copy.completedTasks} value={completedTasks} total={totalTasks} unit={copy.tasks} tone="blue" />
      </div>
      <div className="performance-summary" aria-label={copy.availability}>
        {summary.map(({ label, value, icon: Icon }) => <div key={label}>
          <Icon size={16} aria-hidden="true" />
          <span>{label}</span>
          <strong>{formatNumber.format(value)}</strong>
        </div>)}
      </div>
    </article>
  </section>;
}
