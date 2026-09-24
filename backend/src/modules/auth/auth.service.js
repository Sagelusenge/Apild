const crypto = require('crypto');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const repository = require('./auth.repository');
const emailService = require('../../services/email.service');
const operationalEmailQueue = require('../../services/operationalEmailQueue.service');
const fileService = require('../../services/file.service');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const { addMinutes, toSqlDateTime } = require('../../utils/date');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function issueTokens(user, context = {}) {
  const accessToken = jwt.sign(
    { email: user.email, type: 'access' },
    env.JWT_ACCESS_SECRET,
    { subject: String(user.id), expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { type: 'refresh', nonce: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { subject: String(user.id), expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
  const decoded = jwt.decode(refreshToken);
  await repository.storeRefreshToken(user.id, hashToken(refreshToken), toSqlDateTime(new Date(decoded.exp * 1000)), context);
  return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_EXPIRES_IN };
}

async function withAccess(user) {
  const access = await repository.getAccess(user.id);
  return { ...user, must_change_password: Boolean(user.must_change_password), ...access };
}

async function register(payload, context) {
  void payload;
  void context;
  throw new AppError('Les comptes sont crees par un administrateur.', 403, 'REGISTRATION_DISABLED');
}

async function login(payload, context) {
  const userWithPassword = await repository.findUserByEmail(payload.email.toLowerCase());
  if (!userWithPassword || !(await bcrypt.compare(payload.password, userWithPassword.password_hash))) {
    throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
  }
  if (userWithPassword.status !== 'active') throw new AppError('Ce compte est inactif', 403, 'ACCOUNT_INACTIVE');
  await repository.updateLastLogin(userWithPassword.id);
  const user = await repository.findUserById(userWithPassword.id);
  const securedUser = await withAccess(user);
  if (!securedUser.roles.length) throw new AppError('Aucun role actif attribue. Contactez un administrateur.', 403, 'ROLE_REQUIRED');
  return {
    user: securedUser,
    tokens: await issueTokens(user, context),
    must_change_password: securedUser.must_change_password
  };
}

async function refresh(refreshToken, context) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (_error) {
    throw new AppError('Jeton de renouvellement invalide', 401, 'INVALID_REFRESH_TOKEN');
  }
  if (payload.type !== 'refresh') throw new AppError('Type de jeton invalide', 401, 'INVALID_REFRESH_TOKEN');
  const stored = await repository.findRefreshToken(hashToken(refreshToken));
  if (!stored || String(stored.user_id) !== String(payload.sub)) throw new AppError('Jeton revoque ou expire', 401, 'INVALID_REFRESH_TOKEN');
  const user = await repository.findUserById(payload.sub);
  if (!user || user.status !== 'active') throw new AppError('Compte inactif', 401, 'ACCOUNT_INACTIVE');
  await repository.revokeRefreshToken(hashToken(refreshToken));
  const securedUser = await withAccess(user);
  if (!securedUser.roles.length) throw new AppError('Aucun role actif attribue. Contactez un administrateur.', 403, 'ROLE_REQUIRED');
  return {
    user: securedUser,
    tokens: await issueTokens(user, context),
    must_change_password: securedUser.must_change_password
  };
}

async function logout(refreshToken) {
  if (refreshToken) await repository.revokeRefreshToken(hashToken(refreshToken));
}

async function updateProfile(user, payload) {
  // The authenticated subject, rather than a client-provided id, is the sole
  // target. This keeps the self-service endpoint unable to alter another user.
  const updated = await repository.updateProfile(user.id, payload);
  if (!updated) throw new AppError('Compte introuvable ou inactif', 404, 'NOT_FOUND');
  return withAccess(await repository.findUserById(user.id));
}

function isManagedAvatar(avatarUrl) {
  return /^(?:\/?uploads\/)?images\/avatars\//.test(String(avatarUrl || ''));
}

async function updateAvatar(user, file) {
  if (!file?.filename) throw new AppError('Une photo de profil est requise', 422, 'AVATAR_REQUIRED');
  const currentUser = await repository.findUserById(user.id);
  if (!currentUser) throw new AppError('Compte introuvable ou inactif', 404, 'NOT_FOUND');

  if (env.NODE_ENV === 'production' && env.FILE_STORAGE === 'local') {
    const content = file.buffer || await fs.readFile(file.path);
    const publicKey = crypto.randomUUID();
    await repository.saveAvatarContent(user.id, publicKey, file.mimetype, content);
    if (file.path) await fs.unlink(file.path).catch(() => undefined);
    if (isManagedAvatar(currentUser.avatar_url)) await fileService.remove(currentUser.avatar_url).catch(() => undefined);
    return withAccess(await repository.findUserById(user.id));
  }

  const avatarUrl = `/uploads/images/avatars/${file.filename}`;
  await fileService.persistUpload(file, fileService.uploadRelativePath('images/avatars', file));
  const updated = await repository.updateAvatar(user.id, avatarUrl);
  if (!updated) throw new AppError('Compte introuvable ou inactif', 404, 'NOT_FOUND');

  // Only application-managed avatar paths are eligible for deletion. A value
  // imported from another system must never influence a filesystem path.
  if (currentUser.avatar_url && currentUser.avatar_url !== avatarUrl && isManagedAvatar(currentUser.avatar_url)) {
    await fileService.remove(currentUser.avatar_url).catch(() => undefined);
  }
  return withAccess(await repository.findUserById(user.id));
}

async function getAvatarImage(publicKey) {
  if (!/^[0-9a-f-]{36}$/i.test(publicKey)) throw new AppError('Photo introuvable', 404, 'NOT_FOUND');
  const image = await repository.getAvatarByKey(publicKey);
  if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(image.mime_type)) throw new AppError('Photo introuvable', 404, 'NOT_FOUND');
  return image;
}

async function forgotPassword(email) {
  if (env.EMAIL_FEATURES_ENABLED === false) throw new AppError('La récupération par e-mail est indisponible sur cette version. Contactez votre administrateur.', 503, 'EMAIL_DISABLED');
  const user = await repository.findUserByEmail(email.toLowerCase());
  if (!user) return;
  const verificationCode = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const opaqueToken = crypto.randomBytes(32).toString('hex');
  await repository.createPasswordResetCode(
    user.id,
    hashToken(opaqueToken),
    hashToken(verificationCode),
    toSqlDateTime(addMinutes(new Date(), 15))
  );
  try {
    // Password recovery is intentionally delivered immediately.  The code is
    // not placed in the general queue or logs, where a later retry could outlive
    // its short validity period.
    const delivery = await emailService.sendMail(operationalEmailQueue.passwordResetCodeEmail(user, verificationCode));
    if (delivery?.preview || !delivery?.accepted?.length) throw new Error('SMTP n’a pas confirmé la remise du message');
  } catch (error) {
    logger.error({ err: error, userId: user.id }, 'Echec d envoi du code de reinitialisation');
    throw new AppError('Le code ne peut pas être envoyé pour le moment. Réessayez plus tard ou contactez votre administrateur.', 503, 'RESET_EMAIL_UNAVAILABLE');
  }
}

async function verifyResetCode(payload) {
  if (env.EMAIL_FEATURES_ENABLED === false) throw new AppError('La récupération par e-mail est indisponible.', 503, 'EMAIL_DISABLED');
  const user = await repository.findUserByEmail(payload.email.toLowerCase());
  const stored = user && await repository.findPasswordResetCode(user.id, hashToken(payload.code));
  if (!stored) {
    if (user) await repository.recordPasswordResetCodeFailure(user.id);
    throw new AppError('Code invalide ou expiré. Vérifiez le code reçu par e-mail.', 422, 'INVALID_RESET_CODE');
  }
  return { verified: true };
}

async function resetPassword(payload) {
  if (env.EMAIL_FEATURES_ENABLED === false) throw new AppError('La récupération par e-mail est indisponible.', 503, 'EMAIL_DISABLED');
  if (payload.token) {
    const stored = await repository.findPasswordResetToken(hashToken(payload.token));
    if (!stored) throw new AppError('Lien de reinitialisation invalide ou expire', 422, 'INVALID_RESET_TOKEN');
    const passwordHash = await bcrypt.hash(payload.password, env.BCRYPT_ROUNDS);
    await repository.consumePasswordResetToken(stored.id, stored.user_id, passwordHash);
    return;
  }

  const user = await repository.findUserByEmail(payload.email.toLowerCase());
  if (!user) throw new AppError('Code de reinitialisation invalide ou expire', 422, 'INVALID_RESET_CODE');
  const stored = await repository.findPasswordResetCode(user.id, hashToken(payload.code));
  if (!stored) {
    await repository.recordPasswordResetCodeFailure(user.id);
    throw new AppError('Code de reinitialisation invalide, expire ou deja utilise', 422, 'INVALID_RESET_CODE');
  }
  const passwordHash = await bcrypt.hash(payload.password, env.BCRYPT_ROUNDS);
  await repository.consumePasswordResetToken(stored.id, stored.user_id, passwordHash);
}

async function changePassword(user, payload, context) {
  const userWithPassword = await repository.findUserByEmail(user.email);
  if (!userWithPassword || userWithPassword.status !== 'active') {
    throw new AppError('Compte introuvable ou inactif', 401, 'ACCOUNT_INACTIVE');
  }

  // During first access, the temporary password is already proven by the
  // login token. Thereafter the current password is mandatory.
  if (!userWithPassword.must_change_password && !payload.current_password) {
    throw new AppError('Le mot de passe actuel est obligatoire', 422, 'CURRENT_PASSWORD_REQUIRED');
  }
  if (payload.current_password && !(await bcrypt.compare(payload.current_password, userWithPassword.password_hash))) {
    throw new AppError('Le mot de passe actuel est incorrect', 401, 'INVALID_CURRENT_PASSWORD');
  }
  if (await bcrypt.compare(payload.new_password, userWithPassword.password_hash)) {
    throw new AppError('Le nouveau mot de passe doit etre different de l ancien', 422, 'PASSWORD_REUSE');
  }

  await repository.changePassword(userWithPassword.id, await bcrypt.hash(payload.new_password, env.BCRYPT_ROUNDS));
  const refreshedUser = await repository.findUserById(userWithPassword.id);
  const securedUser = await withAccess(refreshedUser);
  return {
    user: securedUser,
    tokens: await issueTokens(refreshedUser, context),
    must_change_password: false
  };
}

module.exports = { register, login, refresh, logout, updateProfile, updateAvatar, getAvatarImage, forgotPassword, verifyResetCode, resetPassword, changePassword, getMe: withAccess };
