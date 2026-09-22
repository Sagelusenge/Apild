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

function defaultFilename(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  const safeBase = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  return `${Date.now()}-${safeBase}${extension}`;
}

function createUploader(folder, { mimeTypes = allowedMimeTypes, maxBytes = appConfig.maxUploadBytes, filenameFor, fieldName = 'file' } = {}) {
  const destination = path.join(appConfig.uploadsDirectory, folder);
  const makeFilename = (file) => (filenameFor || defaultFilename)(file);
  const storage = appConfig.fileStorage === 's3'
    ? multer.memoryStorage()
    : (() => {
      fs.mkdirSync(destination, { recursive: true });
      return multer.diskStorage({
        destination: (_request, _file, callback) => callback(null, destination),
        filename: (_request, file, callback) => callback(null, makeFilename(file))
      });
    })();
  const upload = multer({
    storage,
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_request, file, callback) => {
      if (!mimeTypes.has(file.mimetype)) return callback(new AppError('Type de fichier non autorise', 415, 'INVALID_FILE_TYPE'));
      return callback(null, true);
    }
  }).single(fieldName);
  return (request, response, next) => upload(request, response, (error) => {
    if (request.file) {
      request.file.filename = request.file.filename || makeFilename(request.file);
      request.file.apildFolder = folder;
    }
    next(error);
  });
}

const profileAvatarUpload = createUploader('images/avatars', {
  mimeTypes: avatarMimeTypes,
  maxBytes: maxAvatarBytes,
  filenameFor: (file) => `${crypto.randomUUID()}${avatarExtensions[file.mimetype]}`,
  fieldName: 'avatar'
});

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
    const buffer = request.file.buffer
      ? request.file.buffer.subarray(0, 16)
      : await fsPromises.readFile(request.file.path).then((file) => file.subarray(0, 16));
    if (!hasValidSignature(request.file.mimetype, buffer)) {
      if (request.file.path) await fsPromises.unlink(request.file.path).catch(() => undefined);
      return next(new AppError('Le contenu du fichier ne correspond pas a son type declare', 415, 'INVALID_FILE_SIGNATURE'));
    }
    return next();
  } catch (error) {
    if (request.file.path) await fsPromises.unlink(request.file.path).catch(() => undefined);
    return next(error);
  }
}

module.exports = {
  uploadImage: createUploader('images'),
  uploadDocument: createUploader('documents'),
  uploadProfileAvatar,
  validateUploadedFile
};
