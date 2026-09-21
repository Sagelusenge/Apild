import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import PublicPage from './PublicPage';
import Button from '../../components/common/Button';
import { publicApi } from '../../api/public.api';
import useNotifications from '../../hooks/useNotifications';
import { useUi } from '../../context/UiContext';
import Reveal from '../../components/public/Reveal';

export default function Contact() {
  const { notify } = useNotifications();
  const { language, text } = useUi();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await publicApi.contact(form);
      notify(text.contact.success, 'success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      notify(language === 'fr' ? error.response?.data?.message || text.contact.error : text.contact.error, 'error');
    } finally {
      setLoading(false);
    }
  };

  return <PublicPage photo={false} eyebrow={text.contact.eyebrow} title={text.contact.title} intro={text.contact.intro}>
    <div className="contact-grid">
      <Reveal as="aside" className="contact-info card" direction="left"><h2>{text.contact.official}</h2><p><Mail/> apildong@gmail.com</p><p><Phone/> +243 854 715 940</p><p><MapPin/> Goma, commune de Karisimbi, quartier Murara, n°05 avenue Mukosasenge</p></Reveal>
      <Reveal as="form" className="contact-form card form-grid" direction="right" delay={75} onSubmit={submit}>
        <div className="field"><label>{text.contact.name}</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required/></div>
        <div className="form-two"><div className="field"><label>{text.contact.email}</label><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required/></div><div className="field"><label>{text.contact.phone}</label><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></div></div>
        <div className="field"><label>{text.contact.subject}</label><input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required/></div>
        <div className="field"><label>{text.contact.message}</label><textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required/></div>
        <Button disabled={loading}>{loading ? text.contact.sending : text.contact.send}</Button>
      </Reveal>
    </div>
  </PublicPage>;
}
