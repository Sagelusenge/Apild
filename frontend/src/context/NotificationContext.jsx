import { createContext, useCallback, useMemo, useState } from 'react';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const notify = useCallback((text, type = 'info') => {
    const id = crypto.randomUUID();
    setMessages((current) => [...current, { id, text, type }]);
    window.setTimeout(() => setMessages((current) => current.filter((item) => item.id !== id)), 4500);
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {messages.map((message) => <div key={message.id} className={`toast toast--${message.type}`}>{message.text}</div>)}
      </div>
    </NotificationContext.Provider>
  );
}
