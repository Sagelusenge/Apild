import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Languages, LogIn, Menu, Moon, Sun, X } from 'lucide-react';
import Brand from '../Brand';
import { useUi } from '../../context/UiContext';

const links = [['/', 'home'], ['/a-propos', 'about'], ['/projets', 'projects'], ['/interventions', 'interventions'], ['/actualites', 'news'], ['/contact', 'contact']];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, theme, toggleTheme, text } = useUi();
  return <header className="public-header notranslate" translate="no"><div className="container public-nav">
    <Link to="/" aria-label={text.a11y.home}><Brand /></Link>
    <nav className={open ? 'public-links is-open' : 'public-links'} aria-label={text.a11y.navigation}>
      {links.map(([to, key]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{text.nav[key]}</NavLink>)}
      <Link className="button button--primary mobile-login" to="/connexion"><LogIn size={17} /> {text.nav.login}</Link>
    </nav>
    <div className="nav-actions">
      <label className="language-select"><Languages size={17} aria-hidden="true"/><span className="sr-only">{text.language}</span><select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={text.language}><option value="fr">FR</option><option value="en">EN</option><option value="sw">SW</option></select></label>
      <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? text.theme.light : text.theme.dark} title={theme === 'dark' ? text.theme.light : text.theme.dark}>{theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button>
      <Link className="button button--primary desktop-login" to="/connexion"><LogIn size={17} /> {text.nav.login}</Link>
      <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label={text.nav.menu}>{open ? <X /> : <Menu />}</button>
    </div>
  </div></header>;
}
