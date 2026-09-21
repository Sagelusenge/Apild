const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

afterAll(async () => db.close());

describe('APILD API', () => {
  test('GET /health expose l etat du service', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.service).toBe('APILD Platform API');
  });

  test('une route inconnue retourne une erreur structuree', async () => {
    const response = await request(app).get('/route-inconnue').expect(404);
    expect(response.body).toMatchObject({ success: false, error: { code: 'ROUTE_NOT_FOUND' } });
  });

  test('les routes protegees exigent une authentification', async () => {
    const response = await request(app).get('/api/projects').expect(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
  });

  test('les documents ne sont jamais exposes comme fichiers statiques', async () => {
    await request(app).get('/uploads/documents/document-prive.pdf').expect(404);
  });
});
