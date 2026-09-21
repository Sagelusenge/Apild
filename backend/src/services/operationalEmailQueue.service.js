const env = require('../config/env');
const emailService = require('./email.service');
const repository = require('./operationalEmailQueue.repository');
const logger = require('../utils/logger');

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function personName(person) {
  return [person?.first_name, person?.last_name].filter(Boolean).join(' ').trim() || 'collaborateur APILD';
}

function displayDateTime(value) {
  const parts = String(value || '').replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})/);
  if (!parts) return String(value || 'à confirmer');
  const [, year, month, day, hour, minute] = parts;
  return `${day}/${month}/${year} à ${hour}:${minute}`;
}

function emailLayout({ eyebrow, title, body, actionLabel, actionUrl, footer = 'Action pour la Promotion des Initiatives Locales de Développement' }) {
  const cta = actionLabel && actionUrl
    ? `<p style="margin:28px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;border-radius:10px;padding:13px 19px;background:#087657;color:#ffffff;font-weight:700;text-decoration:none">${escapeHtml(actionLabel)}</a></p>`
    : '';
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#eef5f2;color:#173047;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(10,57,48,.12)"><tr><td style="padding:22px 30px;background:linear-gradient(120deg,#075842,#087657)"><p style="margin:0;color:#bff3dd;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">APILD · ${escapeHtml(eyebrow)}</p><h1 style="margin:9px 0 0;color:#ffffff;font-size:26px;line-height:1.25">${escapeHtml(title)}</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.65">${body}${cta}</td></tr><tr><td style="padding:18px 30px;border-top:1px solid #dce9e3;color:#6b7c82;font-size:12px;line-height:1.5">${escapeHtml(footer)}</td></tr></table></td></tr></table></body></html>`;
}

function eventDetails(event) {
  const rows = [
    ['Date et heure', displayDateTime(event.starts_at)],
    ['Fin prévue', displayDateTime(event.ends_at)],
    ['Lieu', event.location || (event.meeting_url ? 'Réunion en ligne' : 'À confirmer')]
  ];
  if (event.meeting_url) rows.push(['Lien de réunion', event.meeting_url]);
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:22px 0;border:1px solid #dce9e3;border-radius:12px;border-spacing:0;overflow:hidden">${rows.map(([label, value], index) => `<tr><td style="padding:12px 14px;color:#58706d;font-size:13px;${index ? 'border-top:1px solid #edf3ef;' : ''}">${escapeHtml(label)}</td><td style="padding:12px 14px;color:#173047;font-weight:700;${index ? 'border-top:1px solid #edf3ef;' : ''}">${label === 'Lien de réunion' ? `<a href="${escapeHtml(value)}" style="color:#087657">Accéder à la réunion</a>` : escapeHtml(value)}</td></tr>`).join('')}</table>`;
}

async function queueMessage(message) {
  return repository.enqueue({ ...message, scheduledAt: message.scheduledAt || new Date() });
}

async function queueMeetingInvitation(event, participant) {
  const name = personName(participant);
  const body = `<p>Bonjour ${escapeHtml(name)},</p><p>Vous êtes invité(e) à la réunion <strong>${escapeHtml(event.title)}</strong>.</p>${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}${eventDetails(event)}<p>Merci de noter ce rendez-vous à votre agenda.</p>`;
  return queueMessage({
    kind: 'meeting_invitation', to: participant.email, recipientName: name,
    subject: `Invitation APILD · ${event.title}`,
    text: `Bonjour ${name},\n\nVous êtes invité(e) à la réunion « ${event.title} ».\nDébut : ${displayDateTime(event.starts_at)}\nFin : ${displayDateTime(event.ends_at)}\nLieu : ${event.location || 'À confirmer'}${event.meeting_url ? `\nLien : ${event.meeting_url}` : ''}`,
    html: emailLayout({ eyebrow: 'Invitation', title: 'Vous êtes invité(e)', body, actionLabel: event.meeting_url ? 'Ouvrir la réunion' : null, actionUrl: event.meeting_url || null }),
    eventId: event.id || event.event_id, userId: participant.id || participant.user_id,
    dedupeKey: `event:${event.id || event.event_id}:participant:${participant.id || participant.user_id}:invitation`
  });
}

async function queueMeetingReminder(event, participant) {
  const name = personName(participant);
  const reminder = Number(event.reminder_minutes) || 0;
  const body = `<p>Bonjour ${escapeHtml(name)},</p><p>Rappel : la réunion <strong>${escapeHtml(event.title)}</strong> débute dans environ ${escapeHtml(reminder)} minute${reminder > 1 ? 's' : ''}.</p>${eventDetails(event)}`;
  return queueMessage({
    kind: 'meeting_reminder', to: participant.email, recipientName: name,
    subject: `Rappel APILD · ${event.title}`,
    text: `Bonjour ${name},\n\nRappel : « ${event.title} » débute dans environ ${reminder} minute(s).\nDébut : ${displayDateTime(event.starts_at)}${event.meeting_url ? `\nLien : ${event.meeting_url}` : ''}`,
    html: emailLayout({ eyebrow: 'Rappel de réunion', title: 'Votre réunion approche', body, actionLabel: event.meeting_url ? 'Rejoindre la réunion' : null, actionUrl: event.meeting_url || null }),
    eventId: event.id || event.event_id, userId: participant.id || participant.user_id,
    dedupeKey: `event:${event.id || event.event_id}:participant:${participant.id || participant.user_id}:reminder`
  });
}

async function queueProjectEndReminder(project, recipient) {
  const name = personName(recipient);
  const endDate = String(project.end_date).slice(0, 10);
  const today = new Date();
  const end = new Date(`${endDate}T12:00:00`);
  const remaining = Math.max(0, Math.ceil((end - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000));
  const body = `<p>Bonjour ${escapeHtml(name)},</p><p>Le projet <strong>${escapeHtml(project.name)}</strong>${project.reference ? ` (${escapeHtml(project.reference)})` : ''} arrive à son terme le <strong>${escapeHtml(endDate.split('-').reverse().join('/'))}</strong>.</p><p>Il reste environ <strong>${remaining} jour${remaining > 1 ? 's' : ''}</strong> pour finaliser les activités, les livrables et le suivi.</p>`;
  return queueMessage({
    kind: 'project_end_reminder', to: recipient.email, recipientName: name,
    subject: `Échéance projet APILD · ${project.name}`,
    text: `Bonjour ${name},\n\nLe projet « ${project.name} » arrive à son terme le ${endDate}. Il reste environ ${remaining} jour(s) pour finaliser les activités et livrables.`,
    html: emailLayout({ eyebrow: 'Suivi de projet', title: 'Une échéance approche', body, actionLabel: 'Ouvrir la plateforme', actionUrl: `${env.FRONTEND_URL}/connexion` }),
    projectId: project.id || project.project_id, userId: recipient.id || recipient.user_id,
    dedupeKey: `project:${project.id || project.project_id}:end:${endDate}:recipient:${recipient.id || recipient.user_id}`
  });
}

async function queueAccountInvitation(user) {
  const name = personName(user);
  const loginUrl = `${env.FRONTEND_URL}/connexion`;
  const body = `<p>Bonjour ${escapeHtml(name)},</p><p>Votre accès à la plateforme APILD vient d’être créé.</p><p>Utilisez l’adresse e-mail qui a été enregistrée pour vous connecter. À votre première connexion, vous devrez choisir un mot de passe personnel fort.</p><p style="color:#58706d;font-size:14px">Pour votre sécurité, aucun mot de passe n’est communiqué dans cet e-mail.</p>`;
  return queueMessage({
    kind: 'account_invitation', to: user.email, recipientName: name,
    subject: 'Votre accès à la plateforme APILD',
    text: `Bonjour ${name},\n\nVotre accès à la plateforme APILD vient d’être créé. Connectez-vous avec l’adresse e-mail enregistrée. À votre première connexion, vous devrez choisir un mot de passe personnel fort. Aucun mot de passe n’est communiqué dans cet e-mail.\n\nConnexion : ${loginUrl}`,
    html: emailLayout({ eyebrow: 'Accès collaborateur', title: 'Bienvenue sur APILD', body, actionLabel: 'Se connecter', actionUrl: loginUrl }),
    userId: user.id,
    dedupeKey: `account:${user.id}:invitation`
  });
}

// Auth owns the reset-token workflow.  This helper intentionally contains no
// token persistence; it is ready for the auth module to call with a verified
// six-digit code without exposing it to logs or queue records.
function passwordResetCodeEmail(user, code) {
  const name = personName(user);
  const safeCode = escapeHtml(String(code || '').replace(/\D/g, '').slice(0, 6));
  return {
    to: user.email,
    subject: 'Code de réinitialisation APILD',
    text: `Bonjour ${name}, votre code de réinitialisation APILD est ${safeCode}. Il expire rapidement. Ne le partagez avec personne.`,
    html: emailLayout({
      eyebrow: 'Sécurité du compte',
      title: 'Votre code de confirmation',
      body: `<p>Bonjour ${escapeHtml(name)},</p><p>Utilisez ce code pour confirmer la réinitialisation de votre mot de passe :</p><p style="margin:24px 0;padding:16px;border-radius:12px;background:#edf7f2;color:#075842;font-family:monospace;font-size:28px;font-weight:800;letter-spacing:8px;text-align:center">${safeCode}</p><p>Ne partagez jamais ce code. APILD ne vous le demandera pas par téléphone.</p>`
    })
  };
}

async function queueDueMeetingReminders() {
  const recipients = await repository.meetingReminderRecipients();
  await Promise.all(recipients.map((entry) => queueMeetingReminder(entry, entry)));
  return recipients.length;
}

async function queueProjectsEndingSoon() {
  const recipients = await repository.projectsEndingSoonRecipients();
  await Promise.all(recipients.map((entry) => queueProjectEndReminder(entry, entry)));
  return recipients.length;
}

async function deliverDue(limit = 25) {
  await repository.recoverStaleProcessing();
  const messages = await repository.due(limit);
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const message of messages) {
    if (!(await repository.claim(message.id))) continue;
    try {
      const result = await emailService.sendMail({ to: message.recipient_email, subject: message.subject, text: message.text_body, html: message.html_body });
      if (result?.preview) {
        await repository.markSkipped(message.id);
        skipped += 1;
      } else {
        await repository.markSent(message.id);
        sent += 1;
      }
    } catch (error) {
      await repository.markFailed(message.id, error);
      failed += 1;
      logger.error({ err: error, emailQueueId: message.id, kind: message.email_kind }, 'Échec de délivrance d’un e-mail opérationnel');
    }
  }
  return { scanned: messages.length, sent, skipped, failed };
}

async function cancelPendingEventParticipants(eventId, userIds) {
  return repository.cancelPendingForEventParticipants(eventId, userIds);
}

module.exports = {
  queueMeetingInvitation,
  queueMeetingReminder,
  queueProjectEndReminder,
  queueAccountInvitation,
  passwordResetCodeEmail,
  queueDueMeetingReminders,
  queueProjectsEndingSoon,
  deliverDue,
  cancelPendingEventParticipants
};
