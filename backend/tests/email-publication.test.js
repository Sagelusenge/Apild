jest.mock('../src/config/env', () => ({
  FRONTEND_URL: 'http://localhost:5173',
  MAIL_FROM: 'APILD <no-reply@apild.local>'
}));
jest.mock('../src/config/mail', () => ({ getTransporter: jest.fn() }));
jest.mock('../src/utils/logger', () => ({ warn: jest.fn() }));

const { getTransporter } = require('../src/config/mail');
const emailService = require('../src/services/email.service');

const subscriber = {
  email: 'subscriber@example.test',
  first_name: 'Amina',
  unsubscribe_token: 'a'.repeat(64)
};
const article = { id: 12, title: 'Nouvelle APILD', excerpt: 'Un résumé de publication.' };

describe('email de publication', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ne présente jamais une prévisualisation SMTP comme un envoi', async () => {
    getTransporter.mockReturnValue(null);
    await expect(emailService.sendArticlePublication(subscriber, article)).rejects.toThrow('SMTP non configuré');
  });

  test('refuse un destinataire rejeté par SMTP', async () => {
    getTransporter.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ accepted: [], rejected: [subscriber.email] })
    });
    await expect(emailService.sendArticlePublication(subscriber, article)).rejects.toThrow('SMTP a refusé le destinataire');
  });

  test('retourne la confirmation SMTP pour le destinataire accepté', async () => {
    const transporter = { sendMail: jest.fn().mockResolvedValue({ accepted: [subscriber.email], rejected: [] }) };
    getTransporter.mockReturnValue(transporter);
    await expect(emailService.sendArticlePublication(subscriber, article)).resolves.toEqual({ accepted: [subscriber.email], rejected: [] });
    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: subscriber.email,
      html: expect.stringContaining('/desabonnement?token=')
    }));
  });
});

describe('emails de la newsletter APILD', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ne marque pas une newsletter comme envoyée si SMTP est absent', async () => {
    getTransporter.mockReturnValue(null);
    await expect(emailService.sendNewsletter(subscriber, {
      subject: 'Nouvelles APILD', content: '<p>Actualités des projets.</p>'
    })).rejects.toThrow('SMTP non configuré');
  });

  test('utilise la même présentation pour la newsletter et le message de bienvenue', async () => {
    const transporter = { sendMail: jest.fn().mockResolvedValue({ accepted: [subscriber.email], rejected: [] }) };
    getTransporter.mockReturnValue(transporter);

    await emailService.sendNewsletter(subscriber, {
      subject: 'Nouvelles APILD', preview_text: 'Des nouvelles du terrain', content: '<p>Actualités des projets.</p>'
    });
    await emailService.sendSubscriptionWelcome(subscriber);

    expect(transporter.sendMail).toHaveBeenCalledTimes(2);
    for (const [message] of transporter.sendMail.mock.calls) {
      expect(message.html).toContain('APILD');
      expect(message.html).toContain('/desabonnement?token=');
      expect(message.html).toContain('bgcolor="#123262"');
    }
  });
});
