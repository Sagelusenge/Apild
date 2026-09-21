import { useState } from 'react';
import { newsletterApi } from '../../api/newsletter.api';
import useNotifications from '../../hooks/useNotifications';
import { useUi } from '../../context/UiContext';

export default function NewsletterForm({ compact = false }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useNotifications();
  const { language, text } = useUi();
  const submit = async (event) => {
    event.preventDefault(); setLoading(true);
    try { await newsletterApi.subscribe(email); setEmail(''); notify(text.newsletter.success, 'success'); }
    catch (error) { notify(language === 'fr' ? error.response?.data?.message || text.newsletter.error : text.newsletter.error, 'error'); }
    finally { setLoading(false); }
  };
  return <form className={`newsletter-form ${compact ? 'compact' : ''}`} onSubmit={submit}>
    <label className="sr-only" htmlFor={compact ? 'footer-email' : 'newsletter-email'}>{text.newsletter.label}</label>
    <input id={compact ? 'footer-email' : 'newsletter-email'} type="email" placeholder={text.newsletter.placeholder} value={email} onChange={(event) => setEmail(event.target.value)} required />
    <button disabled={loading}>{loading ? text.newsletter.sending : text.newsletter.subscribe}</button>
  </form>;
}
