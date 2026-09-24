import { useMemo, useState } from 'react';
import { Check, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import Brand from '../../components/Brand';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { getApiMessage } from '../../api/axios';
import { homeForUser } from '../../utils/permissions';

const requirements = [
  ['Au moins 12 caractères', (value) => value.length >= 12],
  ['Une lettre minuscule', (value) => /[a-z]/.test(value)],
  ['Une lettre majuscule', (value) => /[A-Z]/.test(value)],
  ['Un chiffre', (value) => /\d/.test(value)],
  ['Un caractère spécial', (value) => /[^A-Za-z0-9\s]/.test(value)],
  ['Aucun espace', (value) => !/\s/.test(value)]
];

export default function ForcePasswordChange() {
  const { user, isAuthenticated, changePassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const checks = useMemo(() => requirements.map(([label, test]) => ({ label, valid: test(form.password) })), [form.password]);
  const isStrong = checks.every((check) => check.valid);

  if (!isAuthenticated) return <Navigate to="/connexion" replace />;
  if (!user?.must_change_password) return <Navigate to={homeForUser(user)} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isStrong) return setError('Le nouveau mot de passe ne respecte pas encore toutes les règles.');
    if (form.password !== form.confirmation) return setError('Les deux mots de passe ne correspondent pas.');
    setSaving(true);
    try {
      const nextUser = await changePassword({ newPassword: form.password });
      navigate(homeForUser(nextUser), { replace: true });
    } catch (requestError) {
      setError(getApiMessage(requestError, 'La modification du mot de passe a échoué.'));
    } finally {
      setSaving(false);
    }
  };

  return <main className="auth-simple force-password-page notranslate" translate="no"><form className="auth-form card" onSubmit={submit} noValidate><Brand/><h1>Créez votre mot de passe</h1><p>Pour protéger votre compte, choisissez maintenant un mot de passe personnel et robuste.</p>{error && <div className="form-error" role="alert">{error}</div>}<div className="field input-icon"><label htmlFor="new-password">Nouveau mot de passe</label><span><LockKeyhole/><input id="new-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" maxLength="72" required/><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff/> : <Eye/>}</button></span></div><div className="field"><label htmlFor="password-confirmation">Confirmer le mot de passe</label><input id="password-confirmation" type={showPassword ? 'text' : 'password'} value={form.confirmation} onChange={(event) => setForm((current) => ({ ...current, confirmation: event.target.value }))} autoComplete="new-password" maxLength="72" required/></div><ul className="password-rules">{checks.map((check) => <li key={check.label} className={check.valid ? 'is-valid' : ''}><Check size={14}/>{check.label}</li>)}</ul><Button disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer et continuer'}</Button></form></main>;
}
