import { useState } from 'react';
import { Link } from 'react-router-dom';
import Brand from '../../components/Brand';
import Button from '../../components/common/Button';
import { authApi } from '../../api/auth.api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try { await authApi.forgotPassword(email); setSent(true); }
    catch (requestError) { setError(requestError.response?.data?.message || requestError.response?.data?.error?.message || 'Envoi impossible. Réessayez plus tard.'); }
    finally { setSaving(false); }
  };

  const nextUrl = `/reinitialiser-mot-de-passe?email=${encodeURIComponent(email.trim())}`;
  return <main className="auth-simple notranslate" translate="no"><form className="auth-form card" onSubmit={submit} noValidate><Brand/><h1>Mot de passe oublié</h1>{error && <div className="form-error" role="alert">{error}</div>}{sent ? <><p>Si cette adresse correspond à un compte, un code de confirmation à 6 chiffres vient d’être envoyé. Il reste valable 15 minutes.</p><Link className="button button--primary" to={nextUrl}>Saisir le code</Link></> : <><p>Saisissez votre adresse professionnelle. Nous vous enverrons un code de confirmation à 6 chiffres.</p><div className="field"><label htmlFor="forgot-email">Adresse e-mail</label><input id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required/></div><Button disabled={saving}>{saving ? 'Envoi…' : 'Envoyer le code'}</Button></>}<Link to="/connexion">Retour à la connexion</Link></form></main>;
}
