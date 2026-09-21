import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Droplets, FlaskConical, HeartPulse, Leaf, MapPin, Sprout, Users } from 'lucide-react';
import PublicPage from './PublicPage';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { publicApi } from '../../api/public.api';
import { useUi } from '../../context/UiContext';
import { SITE_IMAGES } from '../../data/siteMedia';
import { localizeRecord } from '../../data/localizedContent';
import Reveal from '../../components/public/Reveal';
import { INTERVENTION_DOMAINS } from '../../data/publicEngagementContent';

const domainIcons = [Sprout, BriefcaseBusiness, Droplets, Leaf, HeartPulse, FlaskConical];

export default function Interventions() {
  const { language, text } = useUi();
  const [items, setItems] = useState(null);
  const domainContent = INTERVENTION_DOMAINS[language] || INTERVENTION_DOMAINS.fr;
  useEffect(() => { publicApi.interventions().then(setItems).catch(() => setItems([])); }, []);
  return <PublicPage image={SITE_IMAGES.interventions} eyebrow={text.interventionsPage.eyebrow} title={text.interventionsPage.title} intro={text.interventionsPage.intro}>
    <section className="intervention-domains" aria-labelledby="intervention-domains-title">
      <Reveal className="intervention-domains__heading"><span className="eyebrow">{domainContent.eyebrow}</span><h2 id="intervention-domains-title">{domainContent.title}</h2></Reveal>
      <div className="intervention-domains__grid">{domainContent.items.map((domain, index) => { const Icon = domainIcons[index]; return <Reveal as="article" className="intervention-domain card" delay={Math.min(index, 5) * 55} key={domain.title}><span className="intervention-domain__icon"><Icon size={22} /></span><h3>{domain.title}</h3><ul>{domain.points.map((point) => <li key={point}>{point}</li>)}</ul></Reveal>; })}</div>
    </section>
    <section className="intervention-records" aria-labelledby="intervention-records-title"><Reveal className="intervention-domains__heading"><span className="eyebrow">APILD</span><h2 id="intervention-records-title">{domainContent.documentedTitle}</h2><p>{domainContent.documentedIntro}</p></Reveal>{items === null ? <Loader/> : items.length ? <div className="intervention-grid">{items.map((item, index) => { const localizedItem = localizeRecord(language, 'interventions', item); return <Reveal as="article" className="card intervention-card" delay={Math.min(index, 4) * 65} key={localizedItem.id}><span className="badge badge--success">{localizedItem.domain_name}</span><h3>{localizedItem.title}</h3><p>{localizedItem.description}</p><footer><span><MapPin size={15}/>{localizedItem.locality || localizedItem.territory || localizedItem.province}</span><span><Users size={15}/>{Number(localizedItem.beneficiaries_men || 0) + Number(localizedItem.beneficiaries_women || 0) + Number(localizedItem.beneficiaries_children || 0)} {text.interventionsPage.beneficiaries}</span></footer></Reveal>; })}</div> : <EmptyState title={text.interventionsPage.empty}/>}</section>
  </PublicPage>;
}
