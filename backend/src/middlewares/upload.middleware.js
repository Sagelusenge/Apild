const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const appConfig = require('../config/app.config');
const AppError = require('../utils/AppError');

const allowedMimeTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);
const avatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const avatarExtensions = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
});
const maxAvatarBytes = Math.min(appConfig.maxUploadBytes, 5 * 1024 * 1024);

function createUploader(folder, { mimeTypes = allowedMimeTypes, maxBytes = appConfig.maxUploadBytes, filename } = {}) {
  const destination = path.join(appConfig.uploadsDirectory, folder);
  fs.mkdirSync(destination, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: (_request, _file, callback) => callback(null, destination),
      filename: filename || ((_request, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeBase = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
        callback(null, `${Date.now()}-${safeBase}${extension}`);
      })
    }),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_request, file, callback) => {
      if (!mimeTypes.has(file.mimetype)) return callback(new AppError('Type de fichier non autorise', 415, 'INVALID_FILE_TYPE'));
      return callback(null, true);
    }
  });
}

const profileAvatarUpload = createUploader('images/avatars', {
  mimeTypes: avatarMimeTypes,
  maxBytes: maxAvatarBytes,
  filename: (_request, file, callback) => callback(null, `${crypto.randomUUID()}${avatarExtensions[file.mimetype]}`)
}).single('avatar');

function uploadProfileAvatar(request, response, next) {
  profileAvatarUpload(request, response, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('La photo de profil ne peut pas depasser 5 Mo', 413, 'AVATAR_TOO_LARGE'));
    }
    if (error instanceof multer.MulterError) {
      return next(new AppError('Le televersement de la photo est invalide', 422, 'INVALID_AVATAR_UPLOAD'));
    }
    return next(error);
  });
}

function hasValidSignature(mimeType, buffer) {
  const hex = buffer.toString('hex').toUpperCase();
  const ascii = buffer.toString('ascii');
  if (mimeType === 'image/jpeg') return hex.startsWith('FFD8FF');
  if (mimeType === 'image/png') return hex.startsWith('89504E470D0A1A0A');
  if (mimeType === 'image/gif') return ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a');
  if (mimeType === 'image/webp') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
  if (mimeType === 'application/pdf') return ascii.startsWith('%PDF-');
  if (mimeType === 'application/msword' || mimeType === 'application/vnd.ms-excel') return hex.startsWith('D0CF11E0A1B11AE1');
  if (mimeType.includes('openxmlformats-officedocument')) return hex.startsWith('504B0304') || hex.startsWith('504B0506') || hex.startsWith('504B0708');
  return false;
}

async function validateUploadedFile(request, _response, next) {
  if (!request.file) return next();
  try {
    const handle = await fsPromises.open(request.file.path, 'r');
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, buffer.length, 0);
    await handle.close();
    if (!hasValidSignature(request.file.mimetype, buffer)) {
      await fsPromises.unlink(request.file.path).catch(() => undefined);
      return next(new AppError('Le contenu du fichier ne correspond pas a son type declare', 415, 'INVALID_FILE_SIGNATURE'));
    }
    return next();
  } catch (error) {
    await fsPromises.unlink(request.file.path).catch(() => undefined);
    return next(error);
  }
}

module.exports = {
  uploadImage: createUploader('images').single('file'),
  uploadDocument: createUploader('documents').single('file'),
  uploadProfileAvatar,
  validateUploadedFile
};
