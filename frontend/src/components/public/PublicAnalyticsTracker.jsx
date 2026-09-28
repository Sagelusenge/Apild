import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsApi } from '../../api/analytics.api';

const VISITOR_KEY = 'apild_analytics_visitor';
const VIEW_DEDUPE_PREFIX = 'apild_analytics_view:';
const PUBLIC_PREFIXES = ['/', '/a-propos', '/projets', '/interventions', '/actualites', '/contact'];

function isPublicPath(pathname) {
  return PUBLIC_PREFIXES.some((prefix) => (
    prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
}

function anonymousVisitorId() {
  const generate = () => globalThis.crypto?.randomUUID?.().replaceAll('-', '')
    || `${Date.now()}${Math.random().toString(36).replace(/[^a-z0-9]/gi, '')}`;
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (/^[a-zA-Z0-9_-]{16,160}$/.test(existing || '')) return existing;
    const generated = generate();
    localStorage.setItem(VISITOR_KEY, generated);
    return generated;
  } catch {
    return generate();
  }
}

function record(payload) {
  analyticsApi.track({ ...payload, visitor_id: anonymousVisitorId() }).catch(() => undefined);
}

function slug(value, fallback = 'bouton') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return normalized || fallback;
}

function buttonTarget(button, pagePath) {
  const page = pagePath === '/' ? 'accueil' : slug(pagePath, 'page');
  const explicit = button.dataset.analyticsAction;
  const form = button.closest('form');
  const fallback = button.type === 'submit' && form
    ? `envoyer-${form.getAttribute('aria-label') || form.id || form.className || 'formulaire'}`
    : button.getAttribute('aria-label') || button.title || button.textContent;
  return `/_action/${page}/${slug(explicit || fallback)}`;
}

/**
 * Tracks only public routes and internal public links. No query strings,
 * contact form content, IP address, or browser information is collected.
 */
export default function PublicAnalyticsTracker() {
  const location = useLocation();
  const pagePath = useMemo(() => location.pathname, [location.pathname]);

  useEffect(() => {
    if (!isPublicPath(pagePath)) return undefined;
    const storageKey = `${VIEW_DEDUPE_PREFIX}${pagePath}`;
    const now = Date.now();
    const lastRecorded = Number(sessionStorage.getItem(storageKey) || 0);
    // React StrictMode invokes effects twice in development. A short debounce
    // removes that duplicate without suppressing later visits to the page.
    if (now - lastRecorded > 2000) {
      sessionStorage.setItem(storageKey, String(now));
      record({ event_type: 'page_view', page_path: pagePath });
    }
    return undefined;
  }, [pagePath]);

  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!isPublicPath(pagePath)) return;
      const control = event.target.closest?.('a[href], button, [role="button"]');
      if (!control || control.hasAttribute('disabled')) return;
      let targetPath;
      if (control.matches('a[href]')) {
        if (control.target === '_blank') return;
        const destination = new URL(control.href, window.location.origin);
        if (destination.origin !== window.location.origin || !isPublicPath(destination.pathname)) return;
        targetPath = destination.pathname;
      } else {
        targetPath = buttonTarget(control, pagePath);
      }
      record({ event_type: 'cta_click', page_path: pagePath, target_path: targetPath });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pagePath]);

  return null;
}
