import { useEffect, useState } from 'react';
import { Building2, Eye, HandHeart, HeartPulse, Scale, Sprout, UsersRound } from 'lucide-react';
import PublicPage from './PublicPage';
import { useUi } from '../../context/UiContext';
import { SITE_IMAGES } from '../../data/siteMedia';
import Reveal from '../../components/public/Reveal';
import { publicApi } from '../../api/public.api';

const icons = [Eye, Scale, HandHeart, Sprout];
const partnerIcons = { foundation: Building2, health_facility: HeartPulse, community_organization: UsersRound };
const demonstrationPartnerNames = new Set(['Fondation Horizon', 'Centre Medical Umoja', 'Cooperative Tuendelee']);
const partnerCopy = {
  fr: { eyebrow: 'Collaborations', title: 'Nos partenaires', intro: 'Des collaborations au service des communautés et des initiatives locales.', example: 'Exemple', empty: 'Les partenaires actifs apparaîtront ici.', types: { foundation: 'Fondation', health_facility: 'Structure de santé', community_organization: 'Organisation communautaire' } },
  en: { eyebrow: 'Collaboration', title: 'Our partners', intro: 'Collaborations supporting communities and local initiatives.', example: 'Example', empty: 'Active partners will appear here.', types: { foundation: 'Foundation', health_facility: 'Health facility', community_organization: 'Community organization' } },
  sw: { eyebrow: 'Ushirikiano', title: 'Washirika wetu', intro: 'Ushirikiano unaosaidia jamii na mipango ya ndani.', example: 'Mfano', empty: 'Washirika walio hai wataonekana hapa.', types: { foundation: 'Taasisi', health_facility: 'Kituo cha afya', community_organization: 'Shirika la jamii' } }
};

export default function About() {
  const { language, text } = useUi();
  const [partners, setPartners] = useState(null);
  const copy = partnerCopy[language] || partnerCopy.fr;

  useEffect(() => {
    let active = true;
    publicApi.partners().then((rows) => { if (active) setPartners(Array.isArray(rows) ? rows : []); }).catch(() => { if (active) setPartners([]); });
    return () => { active = false; };
  }, []);

  return <PublicPage image={SITE_IMAGES.about} eyebrow={text.aboutPage.eyebrow} title={text.aboutPage.title} intro={text.aboutPage.intro}>
    <Reveal className="about-facts card">{text.aboutPage.facts.map(([label, title, description]) => <div key={title}><span>{label}</span><h2>{title}</h2><p>{description}</p></div>)}</Reveal>
    <Reveal as="section" className="about-story" direction="left">
      <figure className="about-story__photo">
        <img src={SITE_IMAGES.aboutStory} alt={text.aboutPage.story.imageAlt} loading="lazy" />
      </figure>
      <div className="about-story__copy">
        <span className="eyebrow">{text.aboutPage.story.eyebrow}</span>
        <h2>{text.aboutPage.story.title}</h2>
        <p>{text.aboutPage.story.intro}</p>
        <p>{text.aboutPage.story.detail}</p>
        <ol className="about-story__timeline">{text.aboutPage.story.steps.map(([year, title, description]) => <li key={year}>
          <span>{year}</span><div><h3>{title}</h3><p>{description}</p></div>
        </li>)}</ol>
      </div>
    </Reveal>
    <Reveal className="section-heading values-heading"><div><span className="eyebrow">{text.aboutPage.valuesEyebrow}</span><h2>{text.aboutPage.valuesTitle}</h2></div></Reveal>
    <div className="domain-grid">{text.aboutPage.values.map(([title, description], index) => { const Icon = icons[index]; return <Reveal as="article" className="domain-card card" delay={Math.min(index, 3) * 65} key={title}><span><Icon/></span><h3>{title}</h3><p>{description}</p></Reveal>; })}</div>
    <section className="about-partners" aria-labelledby="about-partners-title">
      <Reveal className="section-heading"><div><span className="eyebrow">{copy.eyebrow}</span><h2 id="about-partners-title">{copy.title}</h2><p>{copy.intro}</p></div></Reveal>
      {partners?.length ? <div className="about-partners__grid">{partners.map((partner, index) => { const Icon = partnerIcons[partner.partner_type] || Building2; const isExample = demonstrationPartnerNames.has(partner.name) || String(partner.website || '').endsWith('.test'); return <Reveal as="article" className="about-partner card" delay={Math.min(index, 3) * 65} key={partner.id}><span className="about-partner__icon"><Icon size={23} aria-hidden="true" /></span><h3>{partner.name}</h3><p>{copy.types[partner.partner_type] || copy.title}</p>{isExample && <small className="about-partner__demo">{copy.example}</small>}</Reveal>; })}</div> : partners && <p>{copy.empty}</p>}
    </section>
  </PublicPage>;
}
