const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const appConfig = require('../config/app.config');
const AppError = require('../utils/AppError');

let client;

function normalizeKey(value) {
  const key = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!key || key.split('/').some((part) => part === '..')) {
    throw new AppError('Chemin de fichier invalide', 400, 'INVALID_FILE_PATH');
  }
  return key;
}

function enabled() {
  return appConfig.fileStorage === 's3';
}

function getClient() {
  if (!enabled()) throw new AppError('Le stockage objet n est pas actif', 503, 'OBJECT_STORAGE_DISABLED');
  if (!client) client = new S3Client({ region: appConfig.s3Region });
  return client;
}

async function putFile(relativePath, file) {
  if (!file?.buffer) throw new AppError('Fichier temporaire indisponible', 422, 'FILE_BUFFER_MISSING');
  const key = normalizeKey(relativePath);
  await getClient().send(new PutObjectCommand({
    Bucket: appConfig.s3Bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: key.startsWith('uploads/images/') ? 'public, max-age=86400' : 'private, no-store'
  }));
  return key;
}

async function getFile(relativePath) {
  let response;
  try {
    response = await getClient().send(new GetObjectCommand({
      Bucket: appConfig.s3Bucket,
      Key: normalizeKey(relativePath)
    }));
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NoSuchKey') {
      throw new AppError('Fichier introuvable', 404, 'FILE_NOT_FOUND');
    }
    throw error;
  }
  if (!response.Body) throw new AppError('Fichier introuvable', 404, 'FILE_NOT_FOUND');
  return {
    stream: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    cacheControl: response.CacheControl
  };
}

async function removeFile(relativePath) {
  await getClient().send(new DeleteObjectCommand({
    Bucket: appConfig.s3Bucket,
    Key: normalizeKey(relativePath)
  }));
  return true;
}

module.exports = { enabled, putFile, getFile, removeFile, normalizeKey };
