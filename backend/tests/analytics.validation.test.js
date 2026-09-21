const schemas = require('../src/modules/analytics/analytics.validation');

describe('analytics tracking validation', () => {
  const visitorId = 'anonymousvisitoridentifier0001';

  test('accepts a public page-view with an anonymous identifier', () => {
    const result = schemas.track.safeParse({
      event_type: 'page_view',
      page_path: '/actualites/42',
      visitor_id: visitorId
    });
    expect(result.success).toBe(true);
  });

  test('only accepts clicks directed at known public paths', () => {
    const result = schemas.track.safeParse({
      event_type: 'cta_click',
      page_path: '/',
      target_path: '/projets',
      visitor_id: visitorId
    });
    expect(result.success).toBe(true);
  });

  test('rejects portal paths and a click without a destination', () => {
    expect(schemas.track.safeParse({ event_type: 'page_view', page_path: '/admin', visitor_id: visitorId }).success).toBe(false);
    expect(schemas.track.safeParse({ event_type: 'cta_click', page_path: '/', visitor_id: visitorId }).success).toBe(false);
  });
});
