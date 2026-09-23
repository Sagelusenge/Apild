import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { statisticsApi } from '../../api/statistics.api';
import StatCard from '../../components/dashboard/StatCard';
import CommunicationInsights from '../../components/dashboard/CommunicationInsights';
import { useUi } from '../../context/UiContext';
import { emailFeaturesEnabled } from '../../config/features';

const COPY = {
  fr: { eyebrow: 'Espace communication', title: 'Audience et publications', subtitle: 'Suivez les visites, les interactions et la croissance de la lettre d’information.', refresh: 'Actualiser' },
  en: { eyebrow: 'Communications workspace', title: 'Audience and publishing', subtitle: 'Monitor visits, interactions and newsletter growth.', refresh: 'Refresh' },
  sw: { eyebrow: 'Eneo la mawasiliano', title: 'Hadhira na machapisho', subtitle: 'Fuatilia matembezi, mwingiliano na ukuaji wa jarida.', refresh: 'Sasisha' }
};
const LOCALES = { fr: 'fr-FR', en: 'en-US', sw: 'sw-TZ' };

export default function Dashboard() {
  const { language } = useUi();
  const copy = COPY[language] || COPY.fr;
  const formatNumber = useMemo(() => new Intl.NumberFormat(LOCALES[language] || LOCALES.fr), [language]);
  const [stats, setStats] = useState({ popular_pages: [], click_targets: [] });
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setStats(await statisticsApi.communicationDashboard()); }
    catch { setStats({ popular_pages: [], click_targets: [] }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return <div className="communication-dashboard">
    <header className="dashboard-welcome"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{emailFeaturesEnabled ? copy.subtitle : language === 'fr' ? 'Suivez les visites, les interactions et les publications.' : language === 'sw' ? 'Fuatilia matembezi, mwingiliano na machapisho.' : 'Monitor visits, interactions and publications.'}</p></div><button className="sync-button" type="button" onClick={load} disabled={loading}><RefreshCw className={loading ? 'spinning' : ''} size={17} /> {copy.refresh}</button></header>
    <CommunicationInsights stats={stats} language={language} formatNumber={formatNumber} StatCard={StatCard} />
  </div>;
}
