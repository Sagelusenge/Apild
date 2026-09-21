const express = require('express');
const db = require('../config/database');
const AppError = require('./AppError');
const asyncHandler = require('./asyncHandler');
const generateReference = require('./generateReference');
const { uniqueTextCode, automaticSlug } = require('./generateReference');
const { getPagination, getPaginationMeta } = require('./pagination');
const { success, created } = require('./response');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { validate, validateCrudBody } = require('../middlewares/validation.middleware');

function identifier(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Identifiant SQL invalide: ${value}`);
  return `\`${value}\``;
}

function createRepository(config) {
  const table = identifier(config.table);
  const allowedFields = new Set([...(config.fields || []), ...(config.actorField ? [config.actorField] : [])]);
  const sortableFields = new Set(['id', 'created_at', 'updated_at', ...(config.fields || [])]);
  const select = config.selectFields?.length
    ? config.selectFields.map(identifier).join(', ')
    : '*';

  return {
    async findAll(options = {}) {
      const { page, limit, offset } = getPagination(options);
      const conditions = [];
      const values = [];
      if (config.softDelete) conditions.push('deleted_at IS NULL');
      if (options.search && config.search?.length) {
        conditions.push(`(${config.search.map((field) => `${identifier(field)} LIKE ?`).join(' OR ')})`);
        config.search.forEach(() => values.push(`%${options.search}%`));
      }
      for (const field of config.filters || []) {
        if (options[field] !== undefined && options[field] !== '') {
          conditions.push(`${identifier(field)} = ?`);
          values.push(options[field]);
        }
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const requestedSort = sortableFields.has(options.sortBy) ? options.sortBy : (config.defaultSort || 'created_at');
      const direction = String(options.sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      const countRows = await db.query(`SELECT COUNT(*) AS total FROM ${table} ${where}`, values);
      const rows = await db.query(
        `SELECT ${select} FROM ${table} ${where} ORDER BY ${identifier(requestedSort)} ${direction} LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      );
      return { rows, meta: getPaginationMeta(countRows[0].total, page, limit) };
    },

    async findById(id) {
      const whereDeleted = config.softDelete ? 'AND deleted_at IS NULL' : '';
      const rows = await db.query(`SELECT ${select} FROM ${table} WHERE id = ? ${whereDeleted} LIMIT 1`, [id]);
      return rows[0] || null;
    },

    async create(payload) {
      const entries = Object.entries(payload).filter(([key, value]) => allowedFields.has(key) && value !== undefined);
      if (!entries.length) throw new AppError('Aucune donnee a enregistrer', 422, 'EMPTY_BODY');
      const columns = entries.map(([key]) => identifier(key)).join(', ');
      const placeholders = entries.map(() => '?').join(', ');
      const result = await db.query(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, entries.map(([, value]) => value));
      return this.findById(result.insertId);
    },

    async update(id, payload) {
      const entries = Object.entries(payload).filter(([key, value]) => allowedFields.has(key) && value !== undefined);
      if (!entries.length) throw new AppError('Aucune donnee a modifier', 422, 'EMPTY_BODY');
      const updates = entries.map(([key]) => `${identifier(key)} = ?`).join(', ');
      const whereDeleted = config.softDelete ? 'AND deleted_at IS NULL' : '';
      const result = await db.query(`UPDATE ${table} SET ${updates} WHERE id = ? ${whereDeleted}`, [...entries.map(([, value]) => value), id]);
      if (!result.affectedRows) return null;
      return this.findById(id);
    },

    async remove(id) {
      const sql = config.softDelete
        ? `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`
        : `DELETE FROM ${table} WHERE id = ?`;
      const result = await db.query(sql, [id]);
      return result.affectedRows > 0;
    }
  };
}

function createService(repository, config) {
  return {
    list: (query) => repository.findAll(query),
    async get(id) {
      const item = await repository.findById(id);
      if (!item) throw new AppError(`${config.entityName} introuvable`, 404, 'NOT_FOUND');
      return item;
    },
    async create(payload, user) {
      const data = { ...payload };
      // Identifiers are issued by the platform. Values received from a form are
      // deliberately ignored so users never have to invent a reference/code and
      // cannot accidentally change an immutable business identifier.
      if (config.referencePrefix) {
        delete data.reference;
        data.reference = generateReference(config.referencePrefix);
      }
      if (config.autoCodeField) {
        delete data[config.autoCodeField];
        data[config.autoCodeField] = uniqueTextCode(data[config.autoCodeSource] || config.entityName, {
          prefix: config.autoCodePrefix,
          maxLength: config.autoCodeMaxLength || 50,
          fallback: config.entityName || 'element'
        });
      }
      if (config.autoSlugField) {
        delete data[config.autoSlugField];
        data[config.autoSlugField] = automaticSlug(
          data[config.autoSlugSource] || config.entityName,
          data.reference,
          config.autoSlugMaxLength || 280
        );
      }
      if (config.actorField && user && data[config.actorField] === undefined) data[config.actorField] = user.id;
      return repository.create(data);
    },
    async update(id, payload, user) {
      const data = { ...payload };
      if (config.referencePrefix) delete data.reference;
      if (config.autoCodeField) delete data[config.autoCodeField];
      if (config.autoSlugField) delete data[config.autoSlugField];
      if (config.actorField === 'updated_by' && user) data.updated_by = user.id;
      const item = await repository.update(id, data);
      if (!item) throw new AppError(`${config.entityName} introuvable`, 404, 'NOT_FOUND');
      return item;
    },
    async remove(id) {
      if (!(await repository.remove(id))) throw new AppError(`${config.entityName} introuvable`, 404, 'NOT_FOUND');
    }
  };
}

function createController(service, config) {
  const canBypassPublicFilter = (request) => request.user && (
    request.user.roles?.includes('admin') ||
    request.user.permissions?.includes(config.updatePermission) ||
    request.user.permissions?.includes(config.createPermission)
  );
  return {
    list: asyncHandler(async (request, response) => {
      const query = config.publicRead && !canBypassPublicFilter(request) && config.publicFilter
        ? { ...request.query, ...config.publicFilter }
        : request.query;
      const result = await service.list(query);
      return success(response, result.rows, 'Liste chargee', 200, result.meta);
    }),
    get: asyncHandler(async (request, response) => {
      const item = await service.get(request.params.id);
      if (config.publicRead && !canBypassPublicFilter(request) && config.publicFilter) {
        const visible = Object.entries(config.publicFilter).every(([key, value]) => String(item[key]) === String(value));
        if (!visible) throw new AppError(`${config.entityName} introuvable`, 404, 'NOT_FOUND');
      }
      return success(response, item);
    }),
    create: asyncHandler(async (request, response) => created(response, await service.create(request.body, request.user))),
    update: asyncHandler(async (request, response) => success(response, await service.update(request.params.id, request.body, request.user), `${config.entityName} modifie`)),
    remove: asyncHandler(async (request, response) => {
      await service.remove(request.params.id);
      return response.status(204).send();
    })
  };
}

function createCrudRouter(controller, config, schemas = null) {
  const router = express.Router();
  const readAuth = config.publicRead ? optionalAuthenticate : authenticate;
  const readPermission = config.publicRead ? (_request, _response, next) => next() : requirePermission(config.readPermission);
  const createAuth = config.publicCreate ? optionalAuthenticate : authenticate;
  const createPermission = config.publicCreate ? (_request, _response, next) => next() : requirePermission(config.createPermission);
  const createValidationConfig = config.publicCreate && config.publicCreateFields
    ? { ...config, fields: config.publicCreateFields }
    : config;

  router.get('/', readAuth, readPermission, controller.list);
  router.get('/:id', readAuth, readPermission, controller.get);
  const validateCreate = schemas?.create ? validate(schemas.create) : validateCrudBody(createValidationConfig);
  const validateUpdate = schemas?.update ? validate(schemas.update) : validateCrudBody(config, true);
  router.post('/', createAuth, createPermission, validateCreate, controller.create);
  router.put('/:id', authenticate, requirePermission(config.updatePermission), validateUpdate, controller.update);
  router.patch('/:id', authenticate, requirePermission(config.updatePermission), validateUpdate, controller.update);
  router.delete('/:id', authenticate, requirePermission(config.deletePermission), controller.remove);
  return router;
}

module.exports = { createRepository, createService, createController, createCrudRouter };
