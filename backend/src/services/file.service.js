const fs = require('fs/promises');
const path = require('path');
const appConfig = require('../config/app.config');
const AppError = require('../utils/AppError');
const objectStorage = require('./objectStorage.service');

function resolveUploadPath(relativePath) {
  const normalized = normalizeRelativePath(relativePath).replace(/^uploads\//, '');
  const resolved = path.resolve(appConfig.uploadsDirectory, normalized);
  const root = `${path.resolve(appConfig.uploadsDirectory)}${path.sep}`;
  if (!resolved.startsWith(root)) throw new AppError('Chemin de fichier invalide', 400, 'INVALID_FILE_PATH');
  return resolved;
}

function normalizeRelativePath(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.split('/').some((part) => part === '..')) {
    throw new AppError('Chemin de fichier invalide', 400, 'INVALID_FILE_PATH');
  }
  return normalized;
}

function uploadRelativePath(folder, file) {
  const filename = path.basename(String(file?.filename || ''));
  if (!filename) throw new AppError('Nom de fichier invalide', 422, 'INVALID_FILE_NAME');
  return normalizeRelativePath(`uploads/${folder}/${filename}`);
}

async function persistUpload(file, relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  if (objectStorage.enabled()) await objectStorage.putFile(normalized, file);
  return normalized;
}

async function remove(relativePath) {
  if (objectStorage.enabled()) {
    await objectStorage.removeFile(normalizeRelativePath(relativePath));
    return true;
  }
  const filePath = resolveUploadPath(relativePath);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function getFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  if (objectStorage.enabled()) return objectStorage.getFile(normalized);
  const filePath = resolveUploadPath(normalized);
  return { path: filePath, contentType: null, contentLength: null, cacheControl: null };
}

module.exports = { resolveUploadPath, normalizeRelativePath, uploadRelativePath, persistUpload, getFile, remove };
