const repository = require('./event.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').events;
const AppError=require('../../utils/AppError');
const notificationService = require('../notifications/notification.service');
const emailQueueService = require('../../services/operationalEmailQueue.service');

const base=createService(repository,config);
const LUBUMBASHI_OFFSET_MS = 2 * 60 * 60 * 1000;

function parseLocalDateTime(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '0'] = match;
  const instant = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)) - LUBUMBASHI_OFFSET_MS);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

function assertSchedule(payload, existing = null, { enforceFuture = true } = {}) {
  const startsAt = payload.starts_at ?? existing?.starts_at;
  const endsAt = payload.ends_at ?? existing?.ends_at;
  const start = parseLocalDateTime(startsAt);
  const end = parseLocalDateTime(endsAt);
  if (!start || !end) throw new AppError('Les dates et heures de la réunion sont invalides', 422, 'INVALID_EVENT_TIME');
  if (end <= start) throw new AppError('La fin doit être postérieure au début de la réunion', 422, 'INVALID_EVENT_RANGE');
  // A past record may still be cancelled or annotated.  Only a new planning
  // attempt, or a changed start date, is refused once it is in the past.
  if (enforceFuture && start <= new Date()) {
    throw new AppError('Une réunion ne peut pas être planifiée à une date ou heure passée', 422, 'PAST_EVENT_DATE');
  }
}

function uniqueIds(values = []) {
  return [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value > 0))];
}

function isStaffEventScope(user) {
  const roles = user?.roles || [];
  return roles.includes('staff') && !roles.includes('admin');
}

async function assertActiveStaff(ids) {
  const staff = await repository.findActiveStaffByIds(ids);
  if (staff.length !== ids.length) {
    throw new AppError('Chaque participant doit être un membre du personnel actif', 422, 'INVALID_EVENT_PARTICIPANT');
  }
  return staff;
}

async function notifyNewParticipants(event, newParticipants) {
  await Promise.all(newParticipants.map(async (participant) => {
    await notificationService.create({
      user_id: participant.id,
      notification_type: 'meeting_invitation',
      title: 'Invitation à une réunion',
      message: `Vous êtes invité(e) à « ${event.title} » le ${String(event.starts_at).slice(0, 16)}.`,
      link_url: '/staff/calendrier'
    });
    await emailQueueService.queueMeetingInvitation(event, participant);
  }));
}

module.exports={...base,
 async listForUser(query, user) {
   if (isStaffEventScope(user)) return repository.findAllForParticipant(user.id, query);
   return base.list(query);
 },
 async getForUser(id, user) {
   if (!isStaffEventScope(user)) return base.get(id);
   const event = await repository.findByIdForParticipant(id, user.id);
   if (!event) throw new AppError('Événement introuvable', 404, 'NOT_FOUND');
   return event;
 },
 async availableStaff() { return repository.activeStaff(); },
 async create(payload, user) {
   assertSchedule(payload);
   return base.create(payload, user);
 },
 async update(id, payload, user) {
   const existing = await base.get(id);
   const scheduleChanged = payload.starts_at !== undefined || payload.ends_at !== undefined;
   if (scheduleChanged) assertSchedule(payload, existing);
   return base.update(id, payload, user);
 },
 async participants(id, user){await this.getForUser(id, user);return repository.participants(id);},
 async upsertParticipant(id,payload){
   const event = await base.get(id);
   if (event.status === 'cancelled') throw new AppError('Impossible d’ajouter un participant à une réunion annulée', 409, 'EVENT_CANCELLED');
   assertSchedule({}, event);
   const [participant] = await assertActiveStaff([Number(payload.user_id)]);
   const prior = await repository.participants(id);
   const wasAlreadyInvited = prior.some((entry) => Number(entry.user_id) === Number(payload.user_id));
   await repository.upsertParticipant(id,payload);
   if (!wasAlreadyInvited) await notifyNewParticipants(event, [participant]);
   return repository.participants(id);
 },
 async replaceParticipants(id, payload) {
   const event = await base.get(id);
   if (event.status === 'cancelled') throw new AppError('Impossible de modifier les participants d’une réunion annulée', 409, 'EVENT_CANCELLED');
   assertSchedule({}, event);
   const userIds = uniqueIds(payload.user_ids);
   const staff = await assertActiveStaff(userIds);
   const prior = await repository.replaceParticipants(id, userIds);
   const previousIds = new Set(prior.map((participant) => Number(participant.user_id)));
   const removedIds = prior.map((participant) => Number(participant.user_id)).filter((userId) => !userIds.includes(userId));
   if (removedIds.length) await emailQueueService.cancelPendingEventParticipants(id, removedIds);
   await notifyNewParticipants(event, staff.filter((participant) => !previousIds.has(Number(participant.id))));
   return repository.participants(id);
 },
 async removeParticipant(id,userId){await base.get(id);const r=await repository.removeParticipant(id,userId);if(!r.affectedRows)throw new AppError('Participant introuvable',404,'NOT_FOUND');}
};
