const service = require('./project.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').projects;
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');

const controller = createController(service, config);
controller.summary = asyncHandler(async (req, res) => success(res, await service.summary(req.params.id)));
controller.members = asyncHandler(async (req, res) => success(res, await service.members(req.params.id)));
controller.upsertMember = asyncHandler(async (req, res) => success(res, await service.upsertMember(req.params.id, req.body), 'Membre enregistre'));
controller.removeMember = asyncHandler(async (req, res) => { await service.removeMember(req.params.id, req.params.userId); res.status(204).send(); });
controller.domains = asyncHandler(async (req, res) => success(res, await service.domains(req.params.id)));
controller.addDomain = asyncHandler(async (req, res) => success(res, await service.addDomain(req.params.id, req.body.domain_id), 'Domaine ajoute'));
controller.removeDomain = asyncHandler(async (req, res) => { await service.removeDomain(req.params.id, req.params.domainId); res.status(204).send(); });

module.exports = controller;
