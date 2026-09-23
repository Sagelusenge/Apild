const express = require('express');
const controller = require('./auth.controller');
const schemas = require('./auth.validation');
const { validate } = require('../../middlewares/validation.middleware');
const { authenticate, allowPasswordChange } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');
const { uploadProfileAvatar, validateUploadedFile } = require('../../middlewares/upload.middleware');

const router = express.Router();

router.get('/avatars/:key', controller.avatarImage);

router.post('/register', authLimiter, validate(schemas.register), controller.register);
router.post('/login', authLimiter, validate(schemas.login), controller.login);
router.post('/refresh', authLimiter, validate(schemas.refresh), controller.refresh);
router.post('/logout', validate(schemas.logout), controller.logout);
router.get('/me', allowPasswordChange, authenticate, controller.me);
router.patch('/profile', authenticate, validate(schemas.updateProfile), controller.updateProfile);
router.post('/profile/avatar', authenticate, uploadProfileAvatar, validateUploadedFile, controller.updateAvatar);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), controller.forgotPassword);
router.post('/verify-reset-code', authLimiter, validate(schemas.verifyResetCode), controller.verifyResetCode);
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), controller.resetPassword);
router.post('/change-password', allowPasswordChange, authenticate, validate(schemas.changePassword), controller.changePassword);

module.exports = router;
