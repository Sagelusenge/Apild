import { BarChart3, Eye, FileText, Mail, MousePointerClick, Newspaper, Send, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const COPY = {
  fr: {
    views: 'Pages vues', viewsHint: 'sur les 30 derniers jours', visitors: 'Visiteurs uniques', visitorsHint: 'mesure anonyme, 30 jours', clicks: 'Clics internes', clicksHint: 'liens publics, 30 jours', newSubscribers: 'Nouveaux abonnés', newSubscribersHint: 'ce mois',
    popularTitle: 'Pages les plus consultées', popularSubtitle: 'Classement par vues sur les 30 derniers jours', clicksTitle: 'Liens les plus cliqués', clicksSubtitle: 'Interactions sur les liens publics', noTraffic: 'Les visites s’afficheront ici dès que la navigation publique produira des données.', viewsLabel: 'vues', visitorsLabel: 'visiteurs', clicksLabel: 'clics',
    audienceTitle: 'Croissance de la newsletter', audienceSubtitle: 'Abonnements créés par période', thisMonth: 'Ce mois', previousMonth: 'Mois précédent', lastTwoMonths: 'Deux derniers mois', activeSubscribers: 'Abonnés actifs',
    publicationTitle: 'État éditorial', publicationSubtitle: 'Contenus présents dans la plateforme', online: 'Publications en ligne', publishedThisMonth: 'mises en ligne ce mois', drafts: 'Brouillons', review: 'À relire', manageArticles: 'Gérer les articles', manageNewsletter: 'Voir les abonnés',
    home: 'Accueil', about: 'À propos', projects: 'Projets', interventions: 'Interventions', news: 'Actualités', contact: 'Contact', article: 'Actualité', project: 'Projet'
  },
  en: {
    views: 'Page views', viewsHint: 'in the last 30 days', visitors: 'Unique visitors', visitorsHint: 'anonymous measurement, 30 days', clicks: 'Internal clicks', clicksHint: 'public links, 30 days', newSubscribers: 'New subscribers', newSubscribersHint: 'this month',
    popularTitle: 'Most viewed pages', popularSubtitle: 'Ranked by views in the last 30 days', clicksTitle: 'Most clicked links', clicksSubtitle: 'Interactions with public links', noTraffic: 'Visits will appear here once public browsing starts producing data.', viewsLabel: 'views', visitorsLabel: 'visitors', clicksLabel: 'clicks',
    audienceTitle: 'Newsletter growth', audienceSubtitle: 'Subscriptions created by period', thisMonth: 'This month', previousMonth: 'Previous month', lastTwoMonths: 'Last two months', activeSubscribers: 'Active subscribers',
    publicationTitle: 'Editorial status', publicationSubtitle: 'Content currently in the platform', online: 'Published articles', publishedThisMonth: 'published this month', drafts: 'Drafts', review: 'In review', manageArticles: 'Manage articles', manageNewsletter: 'View subscribers',
    home: 'Home', about: 'About', projects: 'Projects', interventions: 'Interventions', news: 'News', contact: 'Contact', article: 'News item', project: 'Project'
  },
  sw: {
    views: 'Kurasa zilizoonekana', viewsHint: 'siku 30 zilizopita', visitors: 'Wageni wa kipekee', visitorsHint: 'kipimo kisichotambulisha, siku 30', clicks: 'Mibofyo ya ndani', clicksHint: 'viungo vya umma, siku 30', newSubscribers: 'Waliojiandikisha wapya', newSubscribersHint: 'mwezi huu',
    popularTitle: 'Kurasa zilizotembelewa zaidi', popularSubtitle: 'Zimepangwa kwa maoni katika siku 30 zilizopita', clicksTitle: 'Viungo vilivyobofywa zaidi', clicksSubtitle: 'Mwingiliano kwenye viungo vya umma', noTraffic: 'Matembezi yataonekana hapa mara data ya tovuti itakapopatikana.', viewsLabel: 'maoni', visitorsLabel: 'wageni', clicksLabel: 'mibofyo',
    audienceTitle: 'Ukuaji wa jarida', audienceSubtitle: 'Usajili ulioundwa kwa kipindi', thisMonth: 'Mwezi huu', previousMonth: 'Mwezi uliopita', lastTwoMonths: 'Miezi miwili iliyopita', activeSubscribers: 'Waliojiandikisha hai',
    publicationTitle: 'Hali ya maudhui', publicationSubtitle: 'Maudhui yaliyopo kwenye jukwaa', online: 'Machapisho mtandaoni', publishedThisMonth: 'yamechapishwa mwezi huu', drafts: 'Rasimu', review: 'Ya kukaguliwa', manageArticles: 'Simamia makala', manageNewsletter: 'Tazama waliojiandikisha',
    home: 'Nyumbani', about: 'Kutuhusu', projects: 'Miradi', interventions: 'Shughuli', news: 'Habari', contact: 'Mawasiliano', article: 'Habari', project: 'Mradi'
  }
};

function count(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function publicPathLabel(path, copy) {
  const direct = { '/': copy.home, '/a-propos': copy.about, '/projets': copy.projects, '/interventions': copy.interventions, '/actualites': copy.news, '/contact': copy.contact };
  if (direct[path]) return direct[path];
  if (path.startsWith('/actualites/')) return `${copy.article} · ${path.split('/').at(-1)}`;
  if (path.startsWith('/projets/')) return `${copy.project} · ${path.split('/').at(-1)}`;
  return path;
}

function RankedList({ rows, kind, copy, formatNumber }) {
  const valueKey = kind === 'pages' ? 'views' : 'clicks';
  const max = Math.max(1, ...rows.map((row) => count(row[valueKey])));
  if (!rows.length) return <div className="communication-empty"><BarChart3 size={22} /><p>{copy.noTraffic}</p></div>;
  return <ol className="communication-ranked-list">
    {rows.map((row) => {
      const value = count(row[valueKey]);
      const path = kind === 'pages' ? row.page_path : row.target_path;
      return <li key={`${kind}-${path}`}>
        <div className="communication-ranked-top"><span>{publicPathLabel(path, copy)}</span><strong>{formatNumber.format(value)} <small>{kind === 'pages' ? copy.viewsLabel : copy.clicksLabel}</small></strong></div>
        <div className="communication-ranked-track" aria-hidden="true"><i style={{ width: `${Math.round((value / max) * 100)}%` }} /></div>
        {kind === 'pages' && <small className="communication-ranked-meta">{formatNumber.format(count(row.visitors))} {copy.visitorsLabel}</small>}
      </li>;
    })}
  </ol>;
}

function SubscriptionBars({ stats, copy, formatNumber }) {
  const current = count(stats.subscriptions_current_month);
  const previous = count(stats.subscriptions_previous_month);
  const max = Math.max(1, current, previous);
  return <div className="communication-subscription-bars">
    {[[copy.thisMonth, current], [copy.previousMonth, previous]].map(([label, value]) => <div className="communication-subscription-row" key={label}>
      <div><span>{label}</span><strong>{formatNumber.format(value)}</strong></div><div aria-hidden="true"><i style={{ width: `${Math.round((value / max) * 100)}%` }} /></div>
    </div>)}
  </div>;
}

export default function CommunicationInsights({ stats = {}, language = 'fr', formatNumber, StatCard }) {
  const copy = COPY[language] || COPY.fr;
  return <>
    <section className="metric-grid communication-metric-grid" aria-label={copy.popularTitle}>
      <StatCard label={copy.views} value={formatNumber.format(count(stats.page_views_30_days))} hint={copy.viewsHint} icon={Eye} />
      <StatCard label={copy.visitors} value={formatNumber.format(count(stats.visitors_30_days))} hint={copy.visitorsHint} icon={UsersRound} tone="blue" />
      <StatCard label={copy.clicks} value={formatNumber.format(count(stats.clicks_30_days))} hint={copy.clicksHint} icon={MousePointerClick} tone="gold" />
      <StatCard label={copy.newSubscribers} value={formatNumber.format(count(stats.subscriptions_current_month))} hint={`${formatNumber.format(count(stats.subscriptions_last_two_months))} · ${copy.lastTwoMonths}`} icon={Mail} />
    </section>

    <section className="communication-analytics-grid">
      <article className="communication-panel card"><header className="communication-panel-heading"><span className="communication-panel-icon"><Eye size={19} /></span><div><h2>{copy.popularTitle}</h2><p>{copy.popularSubtitle}</p></div></header><RankedList rows={stats.popular_pages || []} kind="pages" copy={copy} formatNumber={formatNumber} /></article>
      <article className="communication-panel card"><header className="communication-panel-heading"><span className="communication-panel-icon communication-panel-icon--gold"><MousePointerClick size={19} /></span><div><h2>{copy.clicksTitle}</h2><p>{copy.clicksSubtitle}</p></div></header><RankedList rows={stats.click_targets || []} kind="clicks" copy={copy} formatNumber={formatNumber} /></article>
    </section>

    <section className="communication-summary-grid">
      <article className="communication-panel card communication-panel--newsletter"><header className="communication-panel-heading"><span className="communication-panel-icon"><Send size={19} /></span><div><h2>{copy.audienceTitle}</h2><p>{copy.audienceSubtitle}</p></div></header><SubscriptionBars stats={stats} copy={copy} formatNumber={formatNumber} /><footer className="communication-panel-footer"><span>{copy.lastTwoMonths}</span><strong>{formatNumber.format(count(stats.subscriptions_last_two_months))}</strong><span>{copy.activeSubscribers}</span><strong>{formatNumber.format(count(stats.active_subscribers))}</strong></footer><Link className="communication-panel-link" to="/communication/abonnes">{copy.manageNewsletter} <UsersRound size={15} /></Link></article>
      <article className="communication-panel card communication-panel--editorial"><header className="communication-panel-heading"><span className="communication-panel-icon communication-panel-icon--blue"><Newspaper size={19} /></span><div><h2>{copy.publicationTitle}</h2><p>{copy.publicationSubtitle}</p></div></header><div className="communication-editorial-number"><strong>{formatNumber.format(count(stats.published_articles))}</strong><div><span>{copy.online}</span><small>{formatNumber.format(count(stats.published_current_month))} {copy.publishedThisMonth}</small></div></div><div className="communication-editorial-status"><span><FileText size={15} /> {copy.drafts}<strong>{formatNumber.format(count(stats.draft_articles))}</strong></span><span><FileText size={15} /> {copy.review}<strong>{formatNumber.format(count(stats.review_articles))}</strong></span></div><Link className="communication-panel-link" to="/communication/articles">{copy.manageArticles} <Newspaper size={15} /></Link></article>
    </section>
  </>;
}
