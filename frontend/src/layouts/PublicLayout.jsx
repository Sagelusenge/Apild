import { Outlet, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import Header from '../components/public/Header';
import Footer from '../components/public/Footer';
import PublicAnalyticsTracker from '../components/public/PublicAnalyticsTracker';
import { PublicRevealObserver } from '../components/public/Reveal';
import GoogleTranslateBridge from '../components/public/GoogleTranslateBridge';
import { useUi } from '../context/UiContext';

export default function PublicLayout() {
  const contentRef = useRef(null);
  const { pathname } = useLocation();
  const { language } = useUi();

  return <><PublicAnalyticsTracker /><GoogleTranslateBridge /><Header key={`header-${language}`} /><main ref={contentRef} className="public-main"><PublicRevealObserver rootRef={contentRef} /><div className="public-route-transition" key={`${pathname}-${language}`}><Outlet /></div></main><Footer key={`footer-${language}`} /></>;
}
