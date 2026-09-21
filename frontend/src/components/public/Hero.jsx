import { ArrowDown, ArrowRight, Handshake, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUi } from '../../context/UiContext';
import { SITE_IMAGES } from '../../data/siteMedia';

export const HERO_IMAGE = SITE_IMAGES.home;

export default function Hero() {
  const { text } = useUi();
  return <section className="hero" style={{ '--hero-image': `url("${HERO_IMAGE}")` }}><div className="container hero-grid">
    <div className="hero-copy">
      <h1>{text.hero.title}</h1>
      <p>{text.hero.intro}</p>
      <div className="hero-buttons"><Link className="button button--primary" to="/projets">{text.hero.projects} <ArrowDown size={17} /></Link><Link className="button button--ghost" to="/a-propos">{text.hero.more} <ArrowRight size={17} /></Link></div>
      <div className="trust-row"><span><ShieldCheck size={17} /> {text.hero.transparency}</span><span><Handshake size={17} /> {text.hero.participation}</span></div>
    </div>
  </div></section>;
}
