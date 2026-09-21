import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Eye, EyeOff } from 'lucide-react';
import Brand from '../../components/Brand';
import Button from '../../components/common/Button';
import { authApi } from '../../api/auth.api';

const passwordRequirements = [
  ['12 caractères minimum', (value) => value.length >= 12],
  ['Une minuscule', (value) => /[a-z]/.test(value)],
  ['Une majuscule', (value) => /[A-Z]/.test(value)],
  ['Un chiffre', (value) => /\d/.test(value)],
  ['Un caractère spécial', (value) => /[^A-Za-z0-9\s]/.test(value)],
  ['Aucun espace', (value) => !/\s/.test(value)]
];

export default function ResetPassword() {
  const [params] = useSearchParams();
  const legacyToken = params.get('token');
  const [email, setEmail] = useState(() => params.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const checks = useMemo(() => passwordRequirements.map(([label, test]) => ({ label, valid: test(password) })), [password]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!legacyToken && !email.trim()) return setError('Saisissez l’adresse e-mail associée au compte.');
    if (!legacyToken && !/^\d{6}$/.test(code)) return setError('Saisissez le code à 6 chiffres reçu par e-mail.');
    if (password !== confirmation) return setError('Les deux mots de passe ne correspondent pas.');
    if (!checks.every((check) => check.valid)) return setError('Le nouveau mot de passe ne respecte pas les règles de sécurité.');
    setSaving(true);
    try {
      await (legacyToken
        ? authApi.resetPassword(legacyToken, password)
        : authApi.resetPassword({ email: email.trim(), code, password }));
      setDone(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Code invalide ou expiré.');
    } finally {
      setSaving(false);
    }
  };

  return <main className="auth-simple"><form className="auth-form card" onSubmit={submit} noValidate><Brand/><h1>Nouveau mot de passe</h1>{done ? <><p>Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.</p><Link className="button button--primary" to="/connexion">Se connecter</Link></> : <><p>{legacyToken ? 'Choisissez un mot de passe fort pour votre compte.' : 'Saisissez le code reçu par e-mail, puis choisissez un mot de passe fort.'}</p>{error && <div className="form-error" role="alert">{error}</div>}{!legacyToken && <><div className="field"><label htmlFor="reset-email">Adresse e-mail</label><input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required/></div><div className="field"><label htmlFor="reset-code">Code de confirmation</label><input id="reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength="6" required/></div></>}<div className="field input-icon"><label htmlFor="reset-password">Nouveau mot de passe</label><span><input id="reset-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" maxLength="72" required/><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff/> : <Eye/>}</button></span></div><div className="field"><label htmlFor="reset-confirmation">Confirmer le mot de passe</label><input id="reset-confirmation" type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" maxLength="72" required/></div><ul className="password-rules">{checks.map((check) => <li key={check.label} className={check.valid ? 'is-valid' : ''}><Check size={14}/>{check.label}</li>)}</ul><Button disabled={saving}>{saving ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}</Button><Link to="/mot-de-passe-oublie">Demander un nouveau code</Link></>}</form></main>;
}
