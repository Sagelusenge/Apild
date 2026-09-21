const crypto = require('crypto');

module.exports = function generateReference(prefix) {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${year}-${suffix}`;
};

function slugify(value, fallback = 'element') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function uniqueTextCode(value, { prefix = '', maxLength = 50, fallback = 'element' } = {}) {
  const suffix = crypto.randomBytes(4).toString('hex');
  const namespace = prefix ? `${slugify(prefix)}-` : '';
  const available = Math.max(1, maxLength - namespace.length - suffix.length - 1);
  return `${namespace}${slugify(value, fallback).slice(0, available)}-${suffix}`;
}

function automaticSlug(value, reference, maxLength = 280) {
  const fallback = crypto.randomBytes(4).toString('hex');
  const suffix = String(reference || fallback).split('-').pop().toLowerCase();
  const available = Math.max(1, maxLength - suffix.length - 1);
  return `${slugify(value, 'publication').slice(0, available)}-${suffix}`;
}

module.exports.slugify = slugify;
module.exports.uniqueTextCode = uniqueTextCode;
module.exports.automaticSlug = automaticSlug;
