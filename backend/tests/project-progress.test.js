const { calculateProjectProgress, withCalculatedProjectProgress } = require('../src/utils/projectProgress');

describe('progression automatique des projets', () => {
  const project = { status: 'active', start_date: '2026-09-10', end_date: '2026-09-20', progress_percent: 3 };

  test('calcule la progression à partir des dates et ignore une valeur stockée', () => {
    const atHalfway = new Date('2026-09-15T10:00:00+02:00');
    expect(calculateProjectProgress(project, atHalfway)).toBe(50);
    expect(withCalculatedProjectProgress(project, atHalfway).progress_percent).toBe(50);
  });

  test('borne le calendrier avant le début, à l échéance et pour un projet terminé', () => {
    expect(calculateProjectProgress(project, new Date('2026-09-09T10:00:00+02:00'))).toBe(0);
    expect(calculateProjectProgress(project, new Date('2026-09-20T10:00:00+02:00'))).toBe(100);
    expect(calculateProjectProgress({ ...project, status: 'completed' }, new Date('2026-09-11T10:00:00+02:00'))).toBe(100);
  });
});
