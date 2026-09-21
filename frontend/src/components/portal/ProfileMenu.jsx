import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, LogOut, Settings2, UserRound } from 'lucide-react';
import { getApiMessage } from '../../api/axios';
import Modal from '../common/Modal';
import useAuth from '../../hooks/useAuth';
import { resolveAvatarUrl } from '../../utils/avatar';

const passwordRequirements = [
  ['12 caractères minimum', (value) => value.length >= 12],
  ['Une minuscule', (value) => /[a-z]/.test(value)],
  ['Une majuscule', (value) => /[A-Z]/.test(value)],
  ['Un chiffre', (value) => /\d/.test(value)],
  ['Un caractère spécial', (value) => /[^A-Za-z0-9\s]/.test(value)],
  ['Aucun espace', (value) => !/\s/.test(value)]
];

const initialProfile = (user) => ({
  first_name: user?.first_name || '',
  last_name: user?.last_name || '',
  job_title: user?.job_title || ''
});

const initialPassword = { currentPassword: '', newPassword: '', confirmation: '' };

export default function ProfileMenu({ onRequestLogout }) {
  const { user, updateProfile, updateAvatar, changePassword } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(() => initialProfile(user));
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const wrapperRef = useRef(null);
  const avatarButtonRef = useRef(null);
  const avatarFileInputRef = useRef(null);
  const previewUrlRef = useRef('');
  const menuId = useId();
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}` || 'AP';
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Compte APILD';
  const passwordChecks = useMemo(() => passwordRequirements.map(([label, test]) => ({ label, valid: test(password.newPassword) })), [password.newPassword]);
  const storedAvatarUrl = useMemo(() => resolveAvatarUrl(user?.avatar_url), [user?.avatar_url]);
  const avatarUrl = avatarPreview || storedAvatarUrl;

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setIsMenuOpen(false);
      avatarButtonRef.current?.focus();
    };
    document.addEventListener('mousedown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setAvatarImageFailed(false);
  }, [avatarUrl]);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const clearAvatarSelection = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = '';
    setSelectedAvatar(null);
    setAvatarPreview('');
    setAvatarError('');
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
  };

  const selectAvatarFile = () => avatarFileInputRef.current?.click();

  const chooseAvatarFile = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    clearAvatarSelection();
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Choisissez une image JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('La photo de profil ne peut pas dépasser 5 Mo.');
      return;
    }
    const preview = URL.createObjectURL(file);
    previewUrlRef.current = preview;
    setSelectedAvatar(file);
    setAvatarPreview(preview);
    setAvatarImageFailed(false);
  };

  const submitAvatar = async (event) => {
    event.preventDefault();
    if (!selectedAvatar) {
      setAvatarError('Choisissez une photo avant de l’enregistrer.');
      return;
    }
    setIsUploadingAvatar(true);
    setAvatarError('');
    setSuccessMessage('');
    try {
      await updateAvatar(selectedAvatar);
      clearAvatarSelection();
      setSuccessMessage('Votre photo de profil a été mise à jour.');
    } catch (error) {
      setAvatarError(getApiMessage(error, 'Le téléversement de la photo a échoué.'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const openProfile = () => {
    setIsMenuOpen(false);
    clearAvatarSelection();
    setProfile(initialProfile(user));
    setPassword(initialPassword);
    setProfileError('');
    setPasswordError('');
    setSuccessMessage('');
    setShowPassword(false);
    setIsProfileOpen(true);
  };

  const closeProfile = () => {
    if (savingProfile || savingPassword || isUploadingAvatar) return;
    clearAvatarSelection();
    setIsProfileOpen(false);
    avatarButtonRef.current?.focus();
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    const payload = {
      first_name: profile.first_name.trim(),
      last_name: profile.last_name.trim(),
      job_title: profile.job_title.trim() || null
    };
    if (payload.first_name.length < 2 || payload.last_name.length < 2) {
      setProfileError('Le prénom et le nom doivent contenir au moins deux caractères.');
      return;
    }
    setSavingProfile(true);
    setProfileError('');
    setSuccessMessage('');
    try {
      await updateProfile(payload);
      setSuccessMessage('Vos informations ont été mises à jour.');
    } catch (error) {
      setProfileError(getApiMessage(error, 'La mise à jour du profil a échoué.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmation) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (!passwordChecks.every((check) => check.valid)) {
      setPasswordError('Le nouveau mot de passe ne respecte pas les règles de sécurité.');
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    setSuccessMessage('');
    try {
      await changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword });
      setPassword(initialPassword);
      setShowPassword(false);
      setSuccessMessage('Votre mot de passe a été modifié.');
    } catch (error) {
      setPasswordError(getApiMessage(error, 'La modification du mot de passe a échoué.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const requestLogout = () => {
    setIsMenuOpen(false);
    onRequestLogout?.();
  };

  const profileDialog = <Modal open={isProfileOpen} title="Mon profil" onClose={closeProfile}>
    <div className="profile-dialog__identity">
      <span className="profile-dialog__avatar" aria-hidden="true">{avatarUrl && !avatarImageFailed && <img className="profile-avatar-image" src={avatarUrl} alt="" onError={() => setAvatarImageFailed(true)} />}{initials}</span>
      <div><strong>{fullName}</strong><small>{user?.email}</small></div>
    </div>
    <form className="profile-avatar-editor" onSubmit={submitAvatar} noValidate>
      <input ref={avatarFileInputRef} className="sr-only" id="profile-avatar-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatarFile} tabIndex={-1} />
      <span className="profile-avatar-editor__preview" aria-hidden="true">{avatarUrl && !avatarImageFailed && <img className="profile-avatar-image" src={avatarUrl} alt="" onError={() => setAvatarImageFailed(true)} />}{initials}</span>
      <div className="profile-avatar-editor__content"><h3>Photo de profil</h3><p>JPG, PNG ou WebP, 5 Mo maximum.</p><div className="profile-avatar-editor__actions"><button className="button button--ghost" type="button" disabled={isUploadingAvatar} onClick={selectAvatarFile}>{selectedAvatar ? 'Changer la photo' : 'Choisir une photo'}</button>{selectedAvatar && <button className="button button--primary" type="submit" disabled={isUploadingAvatar}>{isUploadingAvatar ? 'Téléversement…' : 'Enregistrer la photo'}</button>}</div>{avatarError && <div className="form-error" role="alert">{avatarError}</div>}</div>
    </form>
    <form className="profile-settings-form" onSubmit={submitProfile} noValidate>
      <div className="profile-settings-form__heading"><UserRound size={18} aria-hidden="true" /><div><h3>Informations personnelles</h3><p>Ces informations sont visibles dans votre espace de travail.</p></div></div>
      {profileError && <div className="form-error" role="alert">{profileError}</div>}
      <div className="form-two">
        <div className="field"><label htmlFor="profile-first-name">Prénom</label><input id="profile-first-name" value={profile.first_name} onChange={(event) => setProfile((current) => ({ ...current, first_name: event.target.value }))} autoComplete="given-name" maxLength="100" required autoFocus /></div>
        <div className="field"><label htmlFor="profile-last-name">Nom</label><input id="profile-last-name" value={profile.last_name} onChange={(event) => setProfile((current) => ({ ...current, last_name: event.target.value }))} autoComplete="family-name" maxLength="100" required /></div>
      </div>
      <div className="field"><label htmlFor="profile-job-title">Fonction</label><input id="profile-job-title" value={profile.job_title} onChange={(event) => setProfile((current) => ({ ...current, job_title: event.target.value }))} autoComplete="organization-title" maxLength="150" placeholder="Ex. Chargée de communication" /></div>
      <div className="form-actions"><button className="button button--primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Enregistrement…' : 'Enregistrer les informations'}</button></div>
    </form>
    <form className="profile-settings-form profile-settings-form--password" onSubmit={submitPassword} noValidate>
      <div className="profile-settings-form__heading"><KeyRound size={18} aria-hidden="true" /><div><h3>Changer le mot de passe</h3><p>Utilisez votre mot de passe actuel pour confirmer cette action.</p></div></div>
      {passwordError && <div className="form-error" role="alert">{passwordError}</div>}
      <div className="field"><label htmlFor="profile-current-password">Mot de passe actuel</label><input id="profile-current-password" type={showPassword ? 'text' : 'password'} value={password.currentPassword} onChange={(event) => setPassword((current) => ({ ...current, currentPassword: event.target.value }))} autoComplete="current-password" maxLength="72" required /></div>
      <div className="field profile-password-field"><label htmlFor="profile-new-password">Nouveau mot de passe</label><span><input id="profile-new-password" type={showPassword ? 'text' : 'password'} value={password.newPassword} onChange={(event) => setPassword((current) => ({ ...current, newPassword: event.target.value }))} autoComplete="new-password" maxLength="72" required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></div>
      <div className="field"><label htmlFor="profile-password-confirmation">Confirmer le nouveau mot de passe</label><input id="profile-password-confirmation" type={showPassword ? 'text' : 'password'} value={password.confirmation} onChange={(event) => setPassword((current) => ({ ...current, confirmation: event.target.value }))} autoComplete="new-password" maxLength="72" required /></div>
      <ul className="password-rules profile-password-rules" aria-label="Règles du mot de passe">{passwordChecks.map((check) => <li key={check.label} className={check.valid ? 'is-valid' : ''}><Check size={14} aria-hidden="true" />{check.label}</li>)}</ul>
      <div className="form-actions"><button className="button button--ghost" type="button" disabled={savingPassword} onClick={() => { setPassword(initialPassword); setPasswordError(''); }}>Réinitialiser</button><button className="button button--primary" type="submit" disabled={savingPassword}>{savingPassword ? 'Modification…' : 'Modifier le mot de passe'}</button></div>
    </form>
    <p className="profile-settings-status" role="status" aria-live="polite">{successMessage}</p>
  </Modal>;

  return <div className="portal-profile" ref={wrapperRef}>
    <button ref={avatarButtonRef} className="top-avatar top-avatar--button" type="button" onClick={() => setIsMenuOpen((current) => !current)} aria-label="Ouvrir les paramètres du profil" aria-haspopup="dialog" aria-expanded={isMenuOpen} aria-controls={menuId}>{avatarUrl && !avatarImageFailed && <img className="profile-avatar-image" src={avatarUrl} alt="" onError={() => setAvatarImageFailed(true)} />}{initials}</button>
    {isMenuOpen && <section id={menuId} className="profile-menu" role="dialog" aria-label="Menu du profil">
      <div className="profile-menu__identity"><span className="profile-menu__avatar" aria-hidden="true">{avatarUrl && !avatarImageFailed && <img className="profile-avatar-image" src={avatarUrl} alt="" onError={() => setAvatarImageFailed(true)} />}{initials}</span><div><strong>{fullName}</strong><small>{user?.email}</small></div></div>
      <div className="profile-menu__actions">
        <button type="button" onClick={openProfile}><Settings2 size={19} aria-hidden="true" /><span><strong>Paramètres du profil</strong><small>Nom, fonction et sécurité</small></span></button>
        <button className="profile-menu__logout" type="button" onClick={requestLogout}><LogOut size={19} aria-hidden="true" />Déconnexion</button>
      </div>
    </section>}
    {profileDialog}
  </div>;
}
