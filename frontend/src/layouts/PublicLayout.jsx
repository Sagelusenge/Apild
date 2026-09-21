import { Outlet, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import Header from '../components/public/Header';
import Footer from '../components/public/Footer';
import PublicAnalyticsTracker from '../components/public/PublicAnalyticsTracker';
import { PublicRevealObserver } from '../components/public/Reveal';

export default function PublicLayout() {
  const contentRef = useRef(null);
  const { pathname } = useLocation();

  return <><PublicAnalyticsTracker /><Header /><main ref={contentRef} className="public-main"><PublicRevealObserver rootRef={contentRef} /><div className="public-route-transition" key={pathname}><Outlet /></div></main><Footer /></>;
}
