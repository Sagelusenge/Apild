import { Eye, HandHeart, Scale, Sprout } from 'lucide-react';
import PublicPage from './PublicPage';
import { useUi } from '../../context/UiContext';
import { SITE_IMAGES } from '../../data/siteMedia';
import Reveal from '../../components/public/Reveal';

const icons = [Eye, Scale, HandHeart, Sprout];

export default function About() {
  const { text } = useUi();
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
  </PublicPage>;
}
