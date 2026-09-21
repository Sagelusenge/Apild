import { Link } from 'react-router-dom';
import Brand from '../Brand';
import NewsletterForm from './NewsletterForm';
import { useUi } from '../../context/UiContext';

export default function Footer() {
  const { text } = useUi();
  return <footer className="public-footer"><div className="container footer-grid">
    <div><Link to="/" aria-label={text.a11y.home}><Brand inverse /></Link><p>{text.footer.description}</p></div>
    <div><h3>{text.footer.organization}</h3><Link to="/a-propos">{text.footer.presentation}</Link><Link to="/a-propos">{text.footer.mission}</Link><Link to="/a-propos">{text.footer.values}</Link></div>
    <div><h3>{text.footer.axes}</h3><Link to="/interventions">{text.footer.social}</Link><Link to="/interventions">{text.footer.capacities}</Link><Link to="/interventions">{text.footer.governance}</Link></div>
    <div><h3>{text.footer.newsletter}</h3><p>{text.footer.newsletterText}</p><NewsletterForm compact /></div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} APILD. {text.footer.rights}</span><span>{text.footer.location}</span></div></footer>;
}
