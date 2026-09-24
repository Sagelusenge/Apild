import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useUi } from '../../context/UiContext';

const SCRIPT_ID = 'apild-google-translate-script';

function syncGoogleLanguage(language, force = false) {
  const combo = document.querySelector('.goog-te-combo');
  if (!combo) return false;
  const target = language === 'fr' ? '' : language;
  if (force || combo.value !== target) {
    combo.value = target;
    combo.dispatchEvent(new Event('change'));
  }
  return true;
}

export default function GoogleTranslateBridge() {
  const { language } = useUi();
  const { pathname } = useLocation();
  const translating = useRef(false);

  useEffect(() => {
    const initialize = () => {
      if (!window.google?.translate?.TranslateElement || document.querySelector('.goog-te-combo')) return;
      new window.google.translate.TranslateElement({
        pageLanguage: 'fr',
        includedLanguages: 'en,sw',
        autoDisplay: false,
        multilanguagePage: true
      }, 'google_translate_element');
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
  }, []);

  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (syncGoogleLanguage(language) || attempts >= 20) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [language]);

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
        release = window.setTimeout(() => { translating.current = false; }, 1400);
      }, 450);
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
