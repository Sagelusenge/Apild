const enabled = process.env.RUN_DB_TESTS === 'true';
const describeDatabase = enabled ? describe : describe.skip;

jest.setTimeout(30000);

describeDatabase('Integration MariaDB', () => {
  let request;
  let app;
  let db;
  let token;
  let projectId;

  beforeAll(async () => {
    request = require('supertest');
    app = require('../src/app');
    db = require('../src/config/database');
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@apild.test', password: 'password' }).expect(200);
    token = login.body.data.tokens.accessToken;
  });

  afterAll(async () => db.close());

  test('la base repond au health check', async () => {
    await request(app).get('/health/database').expect(200);
  });

  test('le compte administrateur accede aux projets', async () => {
    const response = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(3);
  });

  test('un utilisateur met uniquement a jour son propre profil', async () => {
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    const current = me.body.data;
    const temporaryJobTitle = `Profil integration ${Date.now()}`;
    try {
      const updated = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: current.first_name, last_name: current.last_name, job_title: temporaryJobTitle })
        .expect(200);
      expect(updated.body.data).toMatchObject({
        id: current.id,
        first_name: current.first_name,
        last_name: current.last_name,
        job_title: temporaryJobTitle
      });
      expect(updated.body.data.roles).toEqual(expect.arrayContaining(current.roles));

      await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'unauthorized-change@example.test' })
        .expect(422);
    } finally {
      await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: current.first_name, last_name: current.last_name, job_title: current.job_title || null });
    }
  });

  test('un utilisateur sans permission peut televerser sa propre photo securisee', async () => {
    const suffix = Date.now();
    const email = `avatar-${suffix}@example.test`;
    let userId;
    let avatarUrl;
    try {
      const createdUser = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: 'Photo', last_name: 'Profil', email, password: 'ProfileAvatar1!' })
        .expect(201);
      userId = createdUser.body.data.id;

      const login = await request(app).post('/api/auth/login').send({ email, password: 'ProfileAvatar1!' }).expect(200);
      const passwordChanged = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`)
        .send({ new_password: 'ProfileAvatar2!' })
        .expect(200);
      const userToken = passwordChanged.body.data.tokens.accessToken;

      const profile = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ first_name: 'Photo', last_name: 'Mise a jour', job_title: 'Test avatar' })
        .expect(200);
      expect(profile.body.data).toMatchObject({ id: userId, first_name: 'Photo', last_name: 'Mise a jour', job_title: 'Test avatar' });

      const png = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C489', 'hex');
      const uploaded = await request(app)
        .post('/api/auth/profile/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('avatar', png, { filename: 'profil.png', contentType: 'image/png' })
        .expect(200);
      avatarUrl = uploaded.body.data.avatar_url;
      expect(avatarUrl).toMatch(/^\/uploads\/images\/avatars\/[a-f0-9-]+\.png$/);
      await request(app).get(avatarUrl).expect(200).expect('Content-Type', /image\/png/);

      await request(app)
        .post('/api/auth/profile/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('avatar', Buffer.from('not-an-image'), { filename: 'fake.png', contentType: 'image/png' })
        .expect(415);
    } finally {
      if (avatarUrl) await require('../src/services/file.service').remove(avatarUrl).catch(() => undefined);
      if (userId) await request(app).delete(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`);
    }
  });

  test('la reinitialisation par code a six chiffres est hachee, limitee et a usage unique', async () => {
    const suffix = Date.now();
    const email = `reset-code-${suffix}@example.test`;
    let userId;
    let delivered;
    const emailService = require('../src/services/email.service');
    const sendMail = jest.spyOn(emailService, 'sendMail').mockImplementation(async (message) => {
      delivered = message;
      return { preview: true };
    });

    try {
      const created = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: 'Code', last_name: 'Sécurité', email, password: 'InitialReset1!' })
        .expect(201);
      userId = created.body.data.id;

      await request(app).post('/api/auth/forgot-password').send({ email }).expect(200);
      const code = String(delivered?.text || '').match(/\b\d{6}\b/)?.[0];
      expect(code).toMatch(/^\d{6}$/);

      const resetRow = (await db.query(
        'SELECT verification_code_hash, verification_code_attempts FROM password_reset_tokens WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [userId]
      ))[0];
      expect(resetRow.verification_code_hash).not.toBe(code);
      expect(resetRow.verification_code_attempts).toBe(0);

      const wrongCode = code === '000000' ? '000001' : '000000';
      await request(app)
        .post('/api/auth/reset-password')
        .send({ email, code: wrongCode, password: 'NouveauReset1!' })
        .expect(422);
      const afterWrongAttempt = (await db.query(
        'SELECT verification_code_attempts FROM password_reset_tokens WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [userId]
      ))[0];
      expect(afterWrongAttempt.verification_code_attempts).toBe(1);

      await request(app)
        .post('/api/auth/reset-password')
        .send({ email, code, password: 'NouveauReset1!' })
        .expect(200);
      const consumed = (await db.query(
        'SELECT used_at FROM password_reset_tokens WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [userId]
      ))[0];
      expect(consumed.used_at).toBeTruthy();

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'NouveauReset1!' })
        .expect(200);
      expect(login.body.data.must_change_password).toBe(false);
    } finally {
      sendMail.mockRestore();
      if (userId) {
        await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM operational_email_queue WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
      }
    }
  });

  test('le CRUD projet fonctionne de bout en bout', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Projet integration API', description: 'Ressource temporaire creee par le test', status: 'draft', priority: 'low', budget: 1000, currency: 'USD' })
      .expect(201);
    projectId = created.body.data.id;
    expect(created.body.data.reference).toMatch(/^PRJ-/);

    const updated = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'planned', progress_percent: 10 })
      .expect(200);
    expect(updated.body.data.status).toBe('planned');

    await request(app).delete(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token}`).expect(204);
    await request(app).get(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token}`).expect(404);
  });

  test('les donnees publiques et l abonnement newsletter fonctionnent', async () => {
    await request(app).get('/api/public/projects').expect(200);
    const email = `integration-${Date.now()}@example.test`;
    const response = await request(app).post('/api/newsletter/subscribe').send({ email, first_name: 'Test', source: 'integration' }).expect(201);
    expect(response.body.data.email).toBe(email);
  });

  test('une publication peut etre retiree du site public sans etre supprimee', async () => {
    const suffix = Date.now();
    const title = `Publication hors ligne ${suffix}`;
    let articleId;
    try {
      const communicationLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'communication@apild.test', password: 'password' })
        .expect(200);
      const communicationToken = communicationLogin.body.data.tokens.accessToken;
      const staffLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff1@apild.test', password: 'password' })
        .expect(200);
      const staffToken = staffLogin.body.data.tokens.accessToken;

      const created = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${communicationToken}`)
        .send({ title, content: '<p>Contenu de test</p>', status: 'draft' })
        .expect(201);
      articleId = created.body.data.id;

      // Set the test fixture online directly to avoid triggering a newsletter
      // delivery while this integration test verifies only the offline action.
      await db.query(
        "UPDATE articles SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?",
        [articleId]
      );

      const publicBefore = await request(app)
        .get('/api/articles')
        .query({ search: title, limit: 100 })
        .expect(200);
      expect(publicBefore.body.data.some((article) => article.id === articleId)).toBe(true);

      await request(app).patch(`/api/articles/${articleId}/unpublish`).expect(401);
      await request(app)
        .patch(`/api/articles/${articleId}/unpublish`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      const unpublished = await request(app)
        .patch(`/api/articles/${articleId}/unpublish`)
        .set('Authorization', `Bearer ${communicationToken}`)
        .expect(200);
      expect(unpublished.body.data.status).toBe('archived');
      expect(unpublished.body.data.reference).toBe(created.body.data.reference);

      await request(app).get(`/api/articles/${articleId}`).expect(404);
      const publicAfter = await request(app)
        .get('/api/articles')
        .query({ search: title, limit: 100 })
        .expect(200);
      expect(publicAfter.body.data.some((article) => article.id === articleId)).toBe(false);

      const privateArticle = await request(app)
        .get(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${communicationToken}`)
        .expect(200);
      expect(privateArticle.body.data.status).toBe('archived');

      let audit;
      for (let attempt = 0; attempt < 10 && !audit; attempt += 1) {
        const rows = await db.query(
          'SELECT action, entity_type, entity_id, old_values, new_values FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY id DESC LIMIT 1',
          ['articles', articleId]
        );
        audit = rows[0];
        if (!audit) await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(audit).toMatchObject({ action: 'unpublish', entity_type: 'articles', entity_id: articleId });
      expect(JSON.parse(audit.old_values)).toMatchObject({ status: 'published' });
      expect(JSON.parse(audit.new_values)).toMatchObject({ status: 'archived' });

      const secondAttempt = await request(app)
        .patch(`/api/articles/${articleId}/unpublish`)
        .set('Authorization', `Bearer ${communicationToken}`)
        .expect(409);
      expect(secondAttempt.body.error.code).toBe('ARTICLE_NOT_PUBLISHED');

      const edited = await request(app)
        .patch(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${communicationToken}`)
        .send({ excerpt: 'Article conserve et modifiable hors ligne.' })
        .expect(200);
      expect(edited.body.data.status).toBe('archived');
    } finally {
      if (articleId) await db.query('DELETE FROM articles WHERE id = ?', [articleId]);
    }
  });

  test('une actualite publiee accepte commentaires, reactions uniques et partages', async () => {
    const suffix = Date.now();
    const visitorId = '5f742fd4-68e7-4ee5-8a13-52d224401ca1';
    let articleId;
    try {
      const communicationLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'communication@apild.test', password: 'password' })
        .expect(200);
      const created = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${communicationLogin.body.data.tokens.accessToken}`)
        .send({ title: `Interactions publiques ${suffix}`, content: '<p>Une actualité de test assez détaillée pour les interactions publiques.</p>', status: 'draft' })
        .expect(201);
      articleId = created.body.data.id;
      await db.query("UPDATE articles SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?", [articleId]);

      const initial = await request(app).get(`/api/articles/${articleId}/engagement`).query({ visitor_id: visitorId }).expect(200);
      expect(initial.body.data).toMatchObject({ likes_count: 0, shares_count: 0, comments_count: 0, liked: false });

      const liked = await request(app).post(`/api/articles/${articleId}/like`).send({ visitor_id: visitorId }).expect(200);
      expect(liked.body.data).toMatchObject({ likes_count: 1, liked: true });
      const unliked = await request(app).post(`/api/articles/${articleId}/like`).send({ visitor_id: visitorId }).expect(200);
      expect(unliked.body.data).toMatchObject({ likes_count: 0, liked: false });
      const likedAgain = await request(app).post(`/api/articles/${articleId}/like`).send({ visitor_id: visitorId }).expect(200);
      expect(likedAgain.body.data).toMatchObject({ likes_count: 1, liked: true });

      const comment = await request(app)
        .post(`/api/articles/${articleId}/comments`)
        .send({ author_name: 'Visiteur test', author_email: `visitor-${suffix}@example.test`, content: 'Merci pour cette actualité et pour les informations détaillées.' })
        .expect(201);
      expect(comment.body.data.comment).toMatchObject({ author_name: 'Visiteur test' });
      expect(comment.body.data.comment.author_email).toBeUndefined();
      expect(comment.body.data.feedback.comments_count).toBe(1);

      const comments = await request(app).get(`/api/articles/${articleId}/comments`).expect(200);
      expect(comments.body.data).toHaveLength(1);
      expect(comments.body.data[0].content).toContain('Merci pour cette actualité');

      const shared = await request(app).post(`/api/articles/${articleId}/share`).send({}).expect(200);
      expect(shared.body.data).toMatchObject({ shares_count: 1, comments_count: 1 });

      const hashes = await db.query('SELECT visitor_hash FROM article_reactions WHERE article_id = ?', [articleId]);
      expect(hashes).toHaveLength(1);
      expect(hashes[0].visitor_hash).not.toBe(visitorId);
    } finally {
      if (articleId) await db.query('DELETE FROM articles WHERE id = ?', [articleId]);
    }
  });

  test('les CRUD standards de tous les modules fonctionnent', async () => {
    const suffix = Date.now();
    const resources = [
      ['tasks', { project_id: 1, title: `Tache integration ${suffix}`, status: 'todo', priority: 'medium' }, { status: 'in_progress', progress_percent: 20 }],
      ['events', { project_id: 1, title: `Evenement integration ${suffix}`, starts_at: '2026-12-01 09:00:00', ends_at: '2026-12-01 11:00:00', status: 'scheduled' }, { location: 'Lubumbashi' }],
      ['partners', { name: `Partenaire integration ${suffix}`, partner_type: 'organization', status: 'active' }, { contact_person: 'Contact Test' }],
      ['interventions', { project_id: 1, domain_id: 1, title: `Intervention integration ${suffix}`, intervention_date: '2026-12-02', status: 'planned' }, { beneficiaries_women: 10 }],
      ['articles', { category_id: 1, title: `Article integration ${suffix}`, slug: `article-integration-${suffix}`, content: '<p>Test</p><script>alert(1)</script><a href="javascript:alert(1)">Lien</a>', status: 'draft' }, { excerpt: 'Extrait de test' }],
      ['media', { media_type: 'image', original_name: 'test.png', stored_name: `test-${suffix}.png`, file_path: `uploads/images/test-${suffix}.png`, mime_type: 'image/png', file_size: 100 }, { title: 'Image test' }],
      ['newsletter', { subject: `Newsletter integration ${suffix}`, content: '<p>Test</p>', status: 'draft' }, { preview_text: 'Apercu test' }],
      ['documents', { project_id: 1, title: `Document integration ${suffix}`, original_name: 'test.pdf', stored_name: `test-${suffix}.pdf`, file_path: `uploads/documents/test-${suffix}.pdf`, mime_type: 'application/pdf', file_size: 100 }, { description: 'Document test' }],
      ['reports', { project_id: 1, title: `Rapport integration ${suffix}`, report_type: 'progress', status: 'draft' }, { summary: 'Rapport test' }],
      ['contact', { name: 'Contact Integration', email: `contact-${suffix}@example.test`, subject: 'Test API', message: 'Message de test' }, { status: 'in_progress' }],
      ['settings', { setting_key: `integration.${suffix}`, setting_value: 'test', value_type: 'string', setting_group: 'tests' }, { setting_value: 'updated' }],
      ['notifications', { user_id: 1, notification_type: 'integration', title: 'Test', message: 'Notification test' }, { is_read: true }]
    ];

    for (const [resource, payload, changes] of resources) {
      const created = await request(app).post(`/api/${resource}`).set('Authorization', `Bearer ${token}`).send(payload).expect(201);
      const id = created.body.data.id;
      if (resource === 'articles') {
        expect(created.body.data.content).not.toContain('<script');
        expect(created.body.data.content).not.toContain('javascript:');
      }
      const updated = await request(app).patch(`/api/${resource}/${id}`).set('Authorization', `Bearer ${token}`).send(changes).expect(200);
      expect(updated.body.success).toBe(true);
      await request(app).delete(`/api/${resource}/${id}`).set('Authorization', `Bearer ${token}`).expect(204);
    }
  });

  test('les tâches indépendantes et le calendrier sécurisé fonctionnent', async () => {
    const suffix = Date.now();
    let taskId;
    let eventId;
    try {
      const task = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Tâche autonome ${suffix}`, priority: 'medium' })
        .expect(201);
      taskId = task.body.data.id;
      expect(task.body.data.project_id).toBeNull();

      const staff = (await db.query("SELECT id FROM users WHERE email = 'staff1@apild.test' AND deleted_at IS NULL LIMIT 1"))[0];
      expect(staff).toBeDefined();

      const available = await request(app)
        .get('/api/events/staff')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(available.body.data.some((user) => Number(user.id) === Number(staff.id))).toBe(true);

      const future = new Date(Date.now() + (48 * 60 * 60 * 1000));
      const date = future.toISOString().slice(0, 10);
      const created = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `Réunion calendrier ${suffix}`,
          starts_at: `${date} 10:00:00`,
          ends_at: `${date} 11:00:00`,
          reminder_minutes: 30,
          status: 'scheduled'
        })
        .expect(201);
      eventId = created.body.data.id;

      const participants = await request(app)
        .put(`/api/events/${eventId}/participants`)
        .set('Authorization', `Bearer ${token}`)
        .send({ user_ids: [staff.id] })
        .expect(200);
      expect(participants.body.data.map((participant) => Number(participant.user_id))).toContain(Number(staff.id));

      const queued = await db.query(
        `SELECT email_kind, delivery_status
           FROM operational_email_queue
          WHERE event_id = ? AND user_id = ?`,
        [eventId, staff.id]
      );
      expect(queued).toEqual(expect.arrayContaining([expect.objectContaining({ email_kind: 'meeting_invitation', delivery_status: 'pending' })]));

      const yesterday = new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Réunion passée ${suffix}`, starts_at: `${yesterday} 10:00:00`, ends_at: `${yesterday} 11:00:00` })
        .expect(422);
    } finally {
      if (eventId) {
        await db.query('DELETE FROM operational_email_queue WHERE event_id = ?', [eventId]);
        await db.query('DELETE FROM events WHERE id = ?', [eventId]);
      }
      if (taskId) await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    }
  });

  test('les CRUD utilisateurs et roles fonctionnent', async () => {
    const suffix = Date.now();
    const role = await request(app).post('/api/roles').set('Authorization', `Bearer ${token}`).send({ name: `Role test ${suffix}`, description: 'Role temporaire', is_system: false }).expect(201);
    expect(role.body.data.code).toMatch(/^role-role-test-/);
    await request(app).patch(`/api/roles/${role.body.data.id}`).set('Authorization', `Bearer ${token}`).send({ description: 'Role modifie' }).expect(200);

    const permissions = await request(app).get('/api/roles/permissions').set('Authorization', `Bearer ${token}`).expect(200);
    const taskPermissionIds = permissions.body.data
      .filter((permission) => ['tasks.read', 'tasks.create', 'tasks.update', 'tasks.assign', 'tasks.delete'].includes(permission.code))
      .map((permission) => permission.id);
    expect(taskPermissionIds).toHaveLength(5);
    await request(app)
      .put(`/api/roles/${role.body.data.id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permission_ids: taskPermissionIds })
      .expect(200);

    const user = await request(app).post('/api/users').set('Authorization', `Bearer ${token}`).send({ first_name: 'Utilisateur', last_name: 'Integration', email: `user-${suffix}@example.test`, password: 'Password123!', role_ids: [role.body.data.id] }).expect(201);
    await request(app).patch(`/api/users/${user.body.data.id}`).set('Authorization', `Bearer ${token}`).send({ job_title: 'Testeur API' }).expect(200);

    const customLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: `user-${suffix}@example.test`, password: 'Password123!' })
      .expect(200);
    expect(customLogin.body.data.must_change_password).toBe(true);
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${customLogin.body.data.tokens.accessToken}`)
      .send({ project_id: 1, title: `Tache bloquee ${suffix}` })
      .expect(403);
    const passwordChanged = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${customLogin.body.data.tokens.accessToken}`)
      .send({ new_password: 'NewPassword123!' })
      .expect(200);
    expect(passwordChanged.body.data.must_change_password).toBe(false);
    const customToken = passwordChanged.body.data.tokens.accessToken;
    const customTask = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${customToken}`)
      .send({ project_id: 1, title: `Tache role personnalise ${suffix}` })
      .expect(201);
    await request(app).get(`/api/tasks/${customTask.body.data.id}`).set('Authorization', `Bearer ${customToken}`).expect(200);
    await request(app)
      .patch(`/api/tasks/${customTask.body.data.id}`)
      .set('Authorization', `Bearer ${customToken}`)
      .send({ title: `Tache personnalisee modifiee ${suffix}` })
      .expect(200);
    await request(app)
      .post(`/api/tasks/${customTask.body.data.id}/assignees`)
      .set('Authorization', `Bearer ${customToken}`)
      .send({ user_id: user.body.data.id })
      .expect(200);
    await request(app)
      .delete(`/api/tasks/${customTask.body.data.id}/assignees/${user.body.data.id}`)
      .set('Authorization', `Bearer ${customToken}`)
      .expect(204);
    await request(app).delete(`/api/tasks/${customTask.body.data.id}`).set('Authorization', `Bearer ${customToken}`).expect(204);

    await request(app).delete(`/api/users/${user.body.data.id}`).set('Authorization', `Bearer ${token}`).expect(204);
    await request(app).delete(`/api/roles/${role.body.data.id}`).set('Authorization', `Bearer ${token}`).expect(204);
  });

  test('seul un administrateur peut bloquer ou debloquer un utilisateur', async () => {
    const suffix = Date.now();
    let roleId;
    let operatorId;
    let targetId;

    try {
      const permissions = await request(app).get('/api/roles/permissions').set('Authorization', `Bearer ${token}`).expect(200);
      const usersUpdate = permissions.body.data.find((permission) => permission.code === 'users.update');
      expect(usersUpdate).toBeDefined();

      const role = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `User update ${suffix}`, is_system: false })
        .expect(201);
      roleId = role.body.data.id;
      await request(app)
        .put(`/api/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ permission_ids: [usersUpdate.id] })
        .expect(200);

      const operator = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: 'Operateur', last_name: 'Test', email: `operator-${suffix}@example.test`, password: 'Password123!', role_ids: [roleId] })
        .expect(201);
      operatorId = operator.body.data.id;

      const target = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: 'Cible', last_name: 'Test', email: `target-${suffix}@example.test`, password: 'Password123!' })
        .expect(201);
      targetId = target.body.data.id;

      const operatorLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: `operator-${suffix}@example.test`, password: 'Password123!' })
        .expect(200);
      expect(operatorLogin.body.data.must_change_password).toBe(true);
      const operatorPasswordChanged = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${operatorLogin.body.data.tokens.accessToken}`)
        .send({ new_password: 'OperatorPassword123!' })
        .expect(200);
      expect(operatorPasswordChanged.body.data.must_change_password).toBe(false);
      const operatorToken = operatorPasswordChanged.body.data.tokens.accessToken;

      await request(app)
        .patch(`/api/users/${targetId}/block`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);

      const directStatusAttempt = await request(app)
        .patch(`/api/users/${targetId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'suspended' })
        .expect(403);
      expect(directStatusAttempt.body.error.code).toBe('ADMIN_ROLE_REQUIRED');

      const targetLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: `target-${suffix}@example.test`, password: 'Password123!' })
        .expect(200);

      const admin = (await db.query("SELECT id FROM users WHERE email = 'admin@apild.test' LIMIT 1"))[0];
      const selfBlock = await request(app)
        .patch(`/api/users/${admin.id}/block`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
      expect(selfBlock.body.error.code).toBe('SELF_BLOCK');

      const blocked = await request(app)
        .patch(`/api/users/${targetId}/block`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(blocked.body.data.status).toBe('suspended');

      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: targetLogin.body.data.tokens.refreshToken })
        .expect(401);
      await request(app)
        .post('/api/auth/login')
        .send({ email: `target-${suffix}@example.test`, password: 'Password123!' })
        .expect(403);

      const unblocked = await request(app)
        .patch(`/api/users/${targetId}/unblock`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(unblocked.body.data.status).toBe('active');
      await request(app)
        .post('/api/auth/login')
        .send({ email: `target-${suffix}@example.test`, password: 'Password123!' })
        .expect(200);
    } finally {
      if (targetId) await request(app).delete(`/api/users/${targetId}`).set('Authorization', `Bearer ${token}`);
      if (operatorId) await request(app).delete(`/api/users/${operatorId}`).set('Authorization', `Bearer ${token}`);
      if (roleId) await request(app).delete(`/api/roles/${roleId}`).set('Authorization', `Bearer ${token}`);
      // The API deletion above verifies the production soft-delete behaviour.
      // Remove the known, isolated fixtures afterwards so integration runs do not accumulate records.
      if (targetId) await db.query('DELETE FROM users WHERE id = ?', [targetId]);
      if (operatorId) await db.query('DELETE FROM users WHERE id = ?', [operatorId]);
    }
  });

  test('le personnel ne consulte et ne modifie que ses taches assignees', async () => {
    const login = async (email) => {
      const response = await request(app).post('/api/auth/login').send({ email, password: 'password' }).expect(200);
      return response.body.data.tokens.accessToken;
    };
    const staffToken = await login('staff1@apild.test');
    const managerToken = await login('manager@apild.test');
    const staff = (await db.query("SELECT id FROM users WHERE email = 'staff1@apild.test' LIMIT 1"))[0];
    const assignedRows = await db.query(
      `SELECT t.id
         FROM tasks t JOIN task_assignees ta ON ta.task_id = t.id
        WHERE ta.user_id = ? AND t.deleted_at IS NULL`,
      [staff.id]
    );
    const assignedIds = new Set(assignedRows.map((row) => String(row.id)));
    expect(assignedIds.size).toBeGreaterThan(0);

    const staffList = await request(app).get('/api/tasks?limit=100').set('Authorization', `Bearer ${staffToken}`).expect(200);
    expect(staffList.body.data).toHaveLength(assignedIds.size);
    expect(staffList.body.data.every((task) => assignedIds.has(String(task.id)))).toBe(true);

    const allTasks = await request(app).get('/api/tasks?limit=100').set('Authorization', `Bearer ${token}`).expect(200);
    const assignedTask = allTasks.body.data.find((task) => assignedIds.has(String(task.id)));
    const unassignedTask = allTasks.body.data.find((task) => !assignedIds.has(String(task.id)));
    expect(assignedTask).toBeDefined();
    expect(unassignedTask).toBeDefined();

    await request(app).get(`/api/tasks/${assignedTask.id}`).set('Authorization', `Bearer ${staffToken}`).expect(200);
    await request(app).get(`/api/tasks/${unassignedTask.id}`).set('Authorization', `Bearer ${staffToken}`).expect(404);
    await request(app).get(`/api/tasks/${unassignedTask.id}/comments`).set('Authorization', `Bearer ${staffToken}`).expect(404);
    await request(app)
      .patch(`/api/tasks/${unassignedTask.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ actual_hours: 12 })
      .expect(404);
    const forbiddenUpdate = await request(app)
      .patch(`/api/tasks/${assignedTask.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ priority: 'critical' })
      .expect(403);
    expect(forbiddenUpdate.body.error.code).toBe('TASK_FIELD_FORBIDDEN');
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ project_id: assignedTask.project_id, title: 'Creation non autorisee' })
      .expect(403);
    await request(app).delete(`/api/tasks/${assignedTask.id}`).set('Authorization', `Bearer ${staffToken}`).expect(403);
    await request(app).get(`/api/tasks/${unassignedTask.id}`).set('Authorization', `Bearer ${managerToken}`).expect(200);

    const originalPriority = assignedTask.priority;
    const managerPriority = originalPriority === 'critical' ? 'high' : 'critical';
    try {
      const managerUpdate = await request(app)
        .patch(`/api/tasks/${assignedTask.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ priority: managerPriority })
        .expect(200);
      expect(managerUpdate.body.data.priority).toBe(managerPriority);
    } finally {
      await request(app)
        .patch(`/api/tasks/${assignedTask.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ priority: originalPriority })
        .expect(200);
    }

    const originalHours = assignedTask.actual_hours;
    const changedHours = Number(originalHours || 0) + 0.25;
    try {
      const updated = await request(app)
        .patch(`/api/tasks/${assignedTask.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ actual_hours: changedHours })
        .expect(200);
      expect(updated.body.data.actual_hours).toBe(changedHours);
    } finally {
      await request(app)
        .patch(`/api/tasks/${assignedTask.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ actual_hours: originalHours })
        .expect(200);
    }

    const managerComment = await request(app)
      .post(`/api/tasks/${assignedTask.id}/comments`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ comment_text: 'Commentaire de test du gestionnaire' })
      .expect(201);
    const managerCommentId = managerComment.body.data.id;
    try {
      await request(app)
        .patch(`/api/tasks/${assignedTask.id}/comments/${managerCommentId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ comment_text: 'Tentative non autorisee' })
        .expect(404);
      await request(app)
        .delete(`/api/tasks/${assignedTask.id}/comments/${managerCommentId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);

      const ownComment = await request(app)
        .post(`/api/tasks/${assignedTask.id}/comments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ comment_text: 'Commentaire de test du personnel' })
        .expect(201);
      await request(app)
        .patch(`/api/tasks/${assignedTask.id}/comments/${ownComment.body.data.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ comment_text: 'Commentaire personnel modifie' })
        .expect(200);
      await request(app)
        .delete(`/api/tasks/${assignedTask.id}/comments/${ownComment.body.data.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(204);
    } finally {
      await request(app)
        .delete(`/api/tasks/${assignedTask.id}/comments/${managerCommentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    }
  });

  test('les protections des entrees publiques et des uploads sont actives', async () => {
    await request(app).post('/api/contact').send({
      name: 'Visiteur', email: 'visiteur-securite@example.test', subject: 'Test', message: 'Bonjour', status: 'closed'
    }).expect(422);

    const upload = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('contenu qui ne correspond pas a une image'), { filename: 'fausse-image.png', contentType: 'image/png' });
    expect(upload.status).toBe(415);
    expect(upload.body.error.code).toBe('INVALID_FILE_SIGNATURE');
  });
});
