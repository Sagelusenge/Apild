const service = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const fileService = require('../../services/file.service');

const context = (request) => ({ ipAddress: request.ip, userAgent: request.get('user-agent') });

module.exports = {
  register: asyncHandler(async (request, response) => created(response, await service.register(request.body, context(request)), 'Compte cree')),
  login: asyncHandler(async (request, response) => success(response, await service.login(request.body, context(request)), 'Connexion reussie')),
  refresh: asyncHandler(async (request, response) => success(response, await service.refresh(request.body.refreshToken, context(request)), 'Jetons renouveles')),
  logout: asyncHandler(async (request, response) => {
    await service.logout(request.body.refreshToken);
    return response.status(204).send();
  }),
  me: asyncHandler(async (request, response) => success(response, await service.getMe(request.user))),
  updateProfile: asyncHandler(async (request, response) => (
    success(response, await service.updateProfile(request.user, request.body), 'Profil mis a jour')
  )),
  updateAvatar: asyncHandler(async (request, response) => {
    try {
      return success(response, await service.updateAvatar(request.user, request.file), 'Photo de profil mise a jour');
    } catch (error) {
      if (request.file?.filename) await fileService.remove(`images/avatars/${request.file.filename}`).catch(() => undefined);
      throw error;
    }
  }),
  forgotPassword: asyncHandler(async (request, response) => {
    await service.forgotPassword(request.body.email);
    return success(response, null, 'Si ce compte existe, un email de reinitialisation a ete envoye');
  }),
  resetPassword: asyncHandler(async (request, response) => {
    await service.resetPassword(request.body);
    return success(response, null, 'Mot de passe reinitialise');
  }),
  changePassword: asyncHandler(async (request, response) => (
    success(response, await service.changePassword(request.user, request.body, context(request)), 'Mot de passe modifie')
  ))
};
