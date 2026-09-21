import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { messages } from '../data/translations';

const UiContext = createContext(null);

function initialTheme() {
  const saved = localStorage.getItem('apild-theme');
  return saved === 'dark' ? 'dark' : 'light';
}

export function UiProvider({ children }) {
  const savedLanguage = localStorage.getItem('apild-language');
  const [language, setLanguage] = useState(messages[savedLanguage] ? savedLanguage : 'fr');
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('apild-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('apild-language', language);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, theme, toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'), text: messages[language] }), [language, theme]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi must be used within UiProvider');
  return context;
}
