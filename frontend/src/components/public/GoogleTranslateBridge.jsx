import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useUi } from '../../context/UiContext';

const SCRIPT_ID = 'apild-google-translate-script';

function syncGoogleLanguage(language, force = false) {
  const combo = document.querySelector('.goog-te-combo');
  if (!combo) return false;
  const target = language === 'fr' ? '' : language;
  if (force || combo.value !== target) {
    combo.value = target;
    combo.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return true;
}

function persistGoogleLanguage(language) {
  if (language === 'fr') {
    const expired = 'googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
    document.cookie = expired;
    document.cookie = `${expired};domain=${window.location.hostname}`;
    return;
  }
  const value = language === 'fr' ? '/fr/fr' : `/fr/${language}`;
  document.cookie = `googtrans=${value};path=/;SameSite=Lax`;
}

export default function GoogleTranslateBridge() {
  const { language } = useUi();
  const { pathname } = useLocation();
  const translating = useRef(false);
  const previousLanguage = useRef(language);

  useEffect(() => {
    const initialize = () => {
      if (!window.google?.translate?.TranslateElement || document.querySelector('.goog-te-combo')) return;
      new window.google.translate.TranslateElement({
        pageLanguage: 'fr',
        includedLanguages: 'en,sw',
        autoDisplay: false,
        multilanguagePage: true
      }, 'google_translate_element');
      window.requestAnimationFrame(() => syncGoogleLanguage(language, true));
    };

    window.apildGoogleTranslateInit = initialize;
    if (window.google?.translate?.TranslateElement) initialize();
    else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=apildGoogleTranslateInit';
      script.async = true;
      script.onerror = () => { delete window.apildGoogleTranslateInit; };
      document.head.appendChild(script);
    }

    return () => {
      if (window.apildGoogleTranslateInit === initialize) delete window.apildGoogleTranslateInit;
    };
  }, [language]);

  useLayoutEffect(() => {
    const previous = previousLanguage.current;
    previousLanguage.current = language;
    persistGoogleLanguage(language);

    // Google modifies article text received from the API in place and cannot
    // always reconstruct its original French nodes. A targeted refresh clears
    // only that stale translated DOM; the selected language survives in local
    // storage, so this runs once and the French article is restored reliably.
    if (language === 'fr' && previous !== 'fr' && pathname.startsWith('/actualites')) {
      localStorage.setItem('apild-language', 'fr');
      window.location.reload();
      return;
    }
    syncGoogleLanguage(language, true);
  }, [language, pathname]);

  useEffect(() => {
    if (syncGoogleLanguage(language, true)) return undefined;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (syncGoogleLanguage(language, true) || attempts >= 60) window.clearInterval(timer);
    }, 50);
    return () => window.clearInterval(timer);
  }, [language, pathname]);

  useEffect(() => {
    if (language === 'fr') return undefined;
    const root = document.querySelector('.public-main');
    if (!root) return undefined;
    let debounce;
    let release;
    const observer = new MutationObserver((mutations) => {
      if (translating.current) return;
      const hasNewContent = mutations.some((mutation) => [...mutation.addedNodes].some((node) => (
        node.nodeType === Node.TEXT_NODE ? node.textContent?.trim() : node.textContent?.trim()
      )));
      if (!hasNewContent) return;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        translating.current = true;
        syncGoogleLanguage(language, true);
        window.clearTimeout(release);
        release = window.setTimeout(() => { translating.current = false; }, 900);
      }, 100);
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(debounce);
      window.clearTimeout(release);
      translating.current = false;
    };
  }, [language, pathname]);

  return <div id="google_translate_element" className="google-translate-bridge" aria-hidden="true" />;
}
