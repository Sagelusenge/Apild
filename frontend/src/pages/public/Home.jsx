import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Building2, ClipboardCheck, FolderKanban, GraduationCap, Handshake, HeartHandshake, Leaf, Sprout, Users, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../../components/public/Hero';
import ProjectCard from '../../components/public/ProjectCard';
import ArticleCard from '../../components/public/ArticleCard';
import NewsletterForm from '../../components/public/NewsletterForm';
import { projectsApi } from '../../api/projects.api';
import { articlesApi } from '../../api/articles.api';
import { publicApi } from '../../api/public.api';
import { useUi } from '../../context/UiContext';
import { NEWS_IMAGES, PROJECT_IMAGES } from '../../data/siteMedia';
import Reveal from '../../components/public/Reveal';
import ImpactStat from '../../components/public/ImpactStat';
import { emailFeaturesEnabled } from '../../config/features';

const domainIcons = [HeartHandshake, Building2, GraduationCap, Leaf, Users, Handshake];
const impactIcons = [FolderKanban, UsersRound, ClipboardCheck, Handshake];

export default function Home() {
  const { language, text } = useUi();
  const [impact, setImpact] = useState(null);
  const [projects, setProjects] = useState([]);
  const [articles, setArticles] = useState([]);
  const locale = language === 'fr' ? 'fr-FR' : language === 'sw' ? 'sw-CD' : 'en-US';

  useEffect(() => {
    Promise.allSettled([publicApi.impact(), projectsApi.publicList(), articlesApi.publicList({ limit: 3 })]).then(([impactResult, projectsResult, articlesResult]) => {
      if (impactResult.status === 'fulfilled') setImpact(impactResult.value);
      if (projectsResult.status === 'fulfilled' && projectsResult.value.length) setProjects(projectsResult.value.slice(0, 3));
      if (articlesResult.status === 'fulfilled' && articlesResult.value.data?.length) setArticles(articlesResult.value.data.slice(0, 3));
    });
  }, []);

  const impactValues = [
    impact?.projects,
    impact?.beneficiaries,
    impact?.interventions,
    impact?.partners
  ];

  return <>
    <Hero />
    <section className="stats-strip" aria-label={text.home.stats.join(', ')}><div className="container stats-grid">{text.home.stats.map((label, index) => <ImpactStat key={label} value={impactValues[index]} label={label} locale={locale} icon={impactIcons[index]} delay={Math.min(index, 3) * 70} />)}</div></section>

    <section className="section"><Reveal as="div" className="container about-panel card">
      <div><span className="eyebrow">{text.home.aboutEyebrow}</span><h2>{text.home.aboutTitle}</h2><p>{text.home.aboutText}</p><Link to="/a-propos">{text.home.aboutLink} <ArrowRight size={17} /></Link></div>
      <div className="values-grid">{text.home.values.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div>
    </Reveal></section>

    <section className="section domain-section"><div className="container">
      <Reveal className="section-heading"><div><span className="eyebrow">{text.home.domainsEyebrow}</span><h2>{text.home.domainsTitle}</h2><p>{text.home.domainsText}</p></div><Link to="/interventions">{text.home.domainsLink} <ArrowRight size={17} /></Link></Reveal>
      <div className="domain-grid">{text.home.domains.map(([title, description], index) => { const Icon = domainIcons[index]; return <Reveal as="article" className="domain-card card" delay={Math.min(index, 4) * 55} key={title}><span><Icon /></span><h3>{title}</h3><p>{description}</p><Link to="/interventions">{text.home.more} <ArrowRight size={15} /></Link></Reveal>; })}</div>
    </div></section>

    <section className="section"><div className="container">
      <Reveal className="section-heading"><div><span className="eyebrow">{text.home.projectsEyebrow}</span><h2>{text.home.projectsTitle}</h2></div><Link to="/projets">{text.home.projectsLink} <ArrowRight size={17} /></Link></Reveal>
      {projects.length ? <div className="cards-3">{projects.map((project, index) => <ProjectCard key={project.id} project={project} image={PROJECT_IMAGES[index % PROJECT_IMAGES.length]} delay={Math.min(index, 3) * 65} showReference={false} />)}</div> : <Reveal className="public-placeholder card"><Sprout/><h3>{text.home.projectsEmpty}</h3><p>{text.home.projectsEmptyText}</p></Reveal>}
    </div></section>

    <section className="section news-section"><div className="container">
      <Reveal className="section-heading"><div><span className="eyebrow">{text.home.newsEyebrow}</span><h2>{text.home.newsTitle}</h2></div><Link to="/actualites">{text.home.newsLink} <ArrowRight size={17} /></Link></Reveal>
      {articles.length ? <div className="cards-3 news-cards">{articles.map((article, index) => <ArticleCard key={article.id} article={article} image={NEWS_IMAGES[index % NEWS_IMAGES.length]} delay={Math.min(index, 3) * 65} />)}</div> : <Reveal className="public-placeholder card"><BookOpen/><h3>{text.home.newsEmpty}</h3><p>{text.home.newsEmptyText}</p></Reveal>}
    </div></section>

    {emailFeaturesEnabled && <section className="newsletter-section"><Reveal as="div" className="container newsletter-panel"><div><span>{text.home.newsletterEyebrow}</span><h2>{text.home.newsletterTitle}</h2><p>{text.home.newsletterText}</p></div><NewsletterForm /></Reveal></section>}
  </>;
}
