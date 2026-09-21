const fs = require('fs/promises');
const path = require('path');
const appConfig = require('../config/app.config');
const AppError = require('../utils/AppError');

function resolveUploadPath(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/').replace(/^\/?uploads\//, '');
  const resolved = path.resolve(appConfig.uploadsDirectory, normalized);
  const root = `${path.resolve(appConfig.uploadsDirectory)}${path.sep}`;
  if (!resolved.startsWith(root)) throw new AppError('Chemin de fichier invalide', 400, 'INVALID_FILE_PATH');
  return resolved;
}

async function remove(relativePath) {
  const filePath = resolveUploadPath(relativePath);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

module.exports = { resolveUploadPath, remove };
