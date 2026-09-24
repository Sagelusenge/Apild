import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Brand from '../../components/Brand';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { getApiMessage } from '../../api/axios';
import { emailFeaturesEnabled } from '../../config/features';
import { homeForUser } from '../../utils/permissions';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  if (isAuthenticated) return <Navigate to={user?.must_change_password ? '/premiere-connexion' : homeForUser(user)} replace />;
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const connected = await login(form);
      navigate(connected.must_change_password ? '/premiere-connexion' : location.state?.from?.pathname || homeForUser(connected), { replace: true });
    } catch (requestError) { setError(getApiMessage(requestError, 'Connexion impossible.')); }
    finally { setLoading(false); }
  };

  return <main className="auth-page notranslate" translate="no"><section className="auth-story"><Link to="/"><Brand inverse /></Link><div><h1>Agir, mesurer et rendre compte.</h1><p>Un espace de coordination unique pour suivre les projets, les équipes et l’impact sur le terrain.</p></div><small>APILD · Opérations & gouvernance</small></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><Link className="auth-mobile-brand" to="/"><Brand /></Link><h2>Bienvenue</h2><p>Connectez-vous avec votre compte APILD.</p>{error && <div className="form-error">{error}</div>}<div className="field input-icon"><label>Email professionnel</label><span><Mail /><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="username" required /></span></div><div className="field input-icon"><label>Mot de passe</label><span><LockKeyhole /><input type={show ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" required /><button type="button" onClick={() => setShow(!show)} aria-label="Afficher le mot de passe">{show ? <EyeOff /> : <Eye />}</button></span></div>{emailFeaturesEnabled && <div className="auth-help"><Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link></div>}<Button className="notranslate" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</Button></form></section></main>;
}
