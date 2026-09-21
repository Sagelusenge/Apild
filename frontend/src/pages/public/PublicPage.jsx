import { HERO_IMAGE } from '../../components/public/Hero';
import Reveal from '../../components/public/Reveal';

export default function PublicPage({ eyebrow, title, intro, children, photo = true, image = HERO_IMAGE }) {
  const style = photo ? { '--page-hero-image': `url("${image}")` } : undefined;
  return <><section className={`page-hero ${photo ? 'page-hero--photo' : 'page-hero--plain'}`} style={style}><Reveal as="div" className="container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></Reveal></section><section className="section"><div className="container">{children}</div></section></>;
}
