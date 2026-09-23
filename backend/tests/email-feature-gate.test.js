jest.mock('../src/config/env', () => ({
  EMAIL_FEATURES_ENABLED: false,
  LOG_LEVEL: 'silent',
  FRONTEND_URL: 'http://localhost:5173',
  MAIL_FROM: 'APILD <test@example.test>'
}));
jest.mock('../src/config/mail', () => ({ getTransporter: jest.fn() }));
jest.mock('../src/services/operationalEmailQueue.repository', () => ({ enqueue: jest.fn() }));
jest.mock('../src/modules/articles/article.repository', () => ({ ensurePublicationNotification: jest.fn(), preparePublicationRecipients: jest.fn() }));

const { getTransporter } = require('../src/config/mail');
const mail = require('../src/services/email.service');
const queue = require('../src/services/operationalEmailQueue.service');
const queueRepository = require('../src/services/operationalEmailQueue.repository');
const publication = require('../src/modules/articles/article-publication.service');
const articleRepository = require('../src/modules/articles/article.repository');

test('un hébergement sans e-mail ne crée ni transport SMTP ni message en attente', async () => {
  expect(await mail.sendMail({ to: 'test@example.test', subject: 'Essai' })).toEqual(expect.objectContaining({ suppressed: true }));
  expect(getTransporter).not.toHaveBeenCalled();
  expect(await queue.queueAccountInvitation({ id: 1, email: 'test@example.test', first_name: 'Test' })).toEqual({ skipped: true });
  expect(queueRepository.enqueue).not.toHaveBeenCalled();
  await publication.queue({ id: 1 });
  expect(articleRepository.ensurePublicationNotification).not.toHaveBeenCalled();
});
