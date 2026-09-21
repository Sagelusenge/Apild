jest.mock('../src/modules/articles/article.repository', () => ({
  ensurePublicationNotification: jest.fn(),
  preparePublicationRecipients: jest.fn(),
  startPublicationNotification: jest.fn(),
  markInactivePublicationRecipients: jest.fn(),
  pendingPublicationRecipients: jest.fn(),
  claimPublicationRecipient: jest.fn(),
  recordPublicationDelivery: jest.fn(),
  ensureSubscriberUnsubscribeToken: jest.fn(),
  requeueStalePublicationRecipients: jest.fn(),
  pendingPublicationArticles: jest.fn(),
  summarizePublicationDelivery: jest.fn(),
  completePublicationNotification: jest.fn()
}));

jest.mock('../src/services/email.service', () => ({ sendArticlePublication: jest.fn() }));
jest.mock('../src/utils/logger', () => ({ error: jest.fn() }));

const repository = require('../src/modules/articles/article.repository');
const emailService = require('../src/services/email.service');
const publicationService = require('../src/modules/articles/article-publication.service');

describe('diffusion des publications', () => {
  const article = { id: 871, title: 'Publication de test', excerpt: 'Résumé de test' };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.ensurePublicationNotification.mockResolvedValue(undefined);
    repository.preparePublicationRecipients.mockResolvedValue(undefined);
    repository.startPublicationNotification.mockResolvedValue(undefined);
    repository.markInactivePublicationRecipients.mockResolvedValue(undefined);
    repository.recordPublicationDelivery.mockResolvedValue(undefined);
    repository.ensureSubscriberUnsubscribeToken.mockResolvedValue('a'.repeat(64));
    repository.completePublicationNotification.mockResolvedValue(undefined);
  });

  test('diffuse seulement les destinataires atomiquement réservés et conserve le bilan', async () => {
    const subscriber = { article_id: article.id, subscriber_id: 11, email: 'subscriber@example.test', first_name: 'Amina' };
    repository.pendingPublicationRecipients.mockResolvedValue([subscriber, { ...subscriber, subscriber_id: 12 }]);
    repository.claimPublicationRecipient.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    emailService.sendArticlePublication.mockResolvedValue({ accepted: [subscriber.email] });
    const summary = { total: 2, sent: 1, failed: 0, pending: 0 };
    repository.summarizePublicationDelivery.mockResolvedValue(summary);

    await expect(publicationService.dispatch(article)).resolves.toEqual(summary);

    expect(repository.ensurePublicationNotification).toHaveBeenCalledWith(article.id);
    expect(repository.preparePublicationRecipients).toHaveBeenCalledWith(article.id);
    expect(emailService.sendArticlePublication).toHaveBeenCalledTimes(1);
    expect(repository.recordPublicationDelivery).toHaveBeenCalledWith(article.id, 11, 'sent');
    expect(repository.completePublicationNotification).toHaveBeenCalledWith(article.id, summary, null);
  });

  test('enregistre un échec par destinataire sans bloquer les autres envois', async () => {
    const subscriber = { article_id: article.id, subscriber_id: 19, email: 'failure@example.test' };
    repository.pendingPublicationRecipients.mockResolvedValue([subscriber]);
    repository.claimPublicationRecipient.mockResolvedValue(true);
    emailService.sendArticlePublication.mockRejectedValue(new Error('SMTP indisponible'));
    const summary = { total: 1, sent: 0, failed: 1, pending: 0 };
    repository.summarizePublicationDelivery.mockResolvedValue(summary);

    await expect(publicationService.dispatch(article)).resolves.toEqual(summary);

    expect(repository.recordPublicationDelivery).toHaveBeenCalledWith(
      article.id,
      19,
      'failed',
      'SMTP indisponible',
      expect.any(String)
    );
    expect(repository.completePublicationNotification).toHaveBeenCalledWith(article.id, summary, '1 destinataire(s) en échec de diffusion');
  });
});
