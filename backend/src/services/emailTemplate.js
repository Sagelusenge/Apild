const env = require('../config/env');
const ORGANIZATION = 'Action pour la Promotion des Initiatives Locales de Développement';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function plainText(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function emailLayout({
  eyebrow,
  title,
  body,
  preheader = '',
  calloutTitle,
  calloutBody,
  actionLabel,
  actionUrl,
  unsubscribeUrl,
  footerNote = 'Cet e-mail a été envoyé automatiquement par APILD.'
}) {
  const callout = calloutTitle || calloutBody
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border:1px solid #bfe4dd;border-radius:12px;background:#effaf7"><tr><td style="padding:16px 18px;color:#24475a;font-size:14px;line-height:1.6">${calloutTitle ? `<strong style="display:block;color:#0b6956;font-size:15px">${escapeHtml(calloutTitle)}</strong>` : ''}${calloutBody ? `<span>${escapeHtml(calloutBody)}</span>` : ''}</td></tr></table>`
    : '';
  const action = actionLabel && actionUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 14px"><tr><td bgcolor="#087f6f" style="border-radius:9px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">${escapeHtml(actionLabel)}</a></td></tr></table>`
    : '';
  const unsubscribe = unsubscribeUrl
    ? `<p style="margin:22px 0 0;color:#66788b;font-size:12px;line-height:1.6">Vous ne souhaitez plus recevoir ces informations ? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#087f6f;text-decoration:underline">Se désabonner</a>.</p>`
    : '';
  const logoUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/images/logo-apild.png`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="margin:0;padding:0;background:#f3f8fb;color:#20344d;font-family:Arial,Helvetica,sans-serif"><span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;color:transparent">${escapeHtml(preheader || title)}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f3f8fb"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid #dce7ed;border-radius:16px;overflow:hidden;background:#ffffff"><tr><td bgcolor="#123262" style="padding:20px 24px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-right:12px"><img src="${escapeHtml(logoUrl)}" alt="Logo APILD" width="42" height="42" style="display:block;width:42px;height:42px;border-radius:50%;background:#ffffff;object-fit:contain"></td><td><strong style="display:block;color:#ffffff;font-size:18px;line-height:1.1">APILD</strong><span style="display:block;margin-top:4px;color:#c9dcea;font-size:10px;line-height:1.4">${ORGANIZATION}</span></td></tr></table></td></tr><tr><td style="padding:28px 24px 24px;background:#ffffff"><p style="margin:0 0 8px;color:#087f6f;font-size:11px;font-weight:800;letter-spacing:1.1px;text-transform:uppercase">${escapeHtml(eyebrow)}</p><h1 style="margin:0 0 18px;color:#173354;font-size:24px;line-height:1.3">${escapeHtml(title)}</h1><div style="color:#354c65;font-size:14px;line-height:1.7">${body}</div>${callout}${action}${unsubscribe}<p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e2ebf0;color:#62758b;font-size:12px;line-height:1.6">À très bientôt,<br><strong style="color:#173354">L’équipe APILD</strong></p></td></tr><tr><td style="padding:15px 24px;background:#f7fafd;color:#76899d;font-size:11px;line-height:1.6;text-align:center">${escapeHtml(footerNote)}<br>Ne transmettez jamais votre mot de passe en réponse à cet e-mail.</td></tr></table></td></tr></table></body></html>`;
}

module.exports = { emailLayout, escapeHtml, plainText };
