const APILD_TIME_ZONE = 'Africa/Lubumbashi';

function dateOnlyToUtc(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function currentDateOnly(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APILD_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Returns the time elapsed on the project calendar. The percentage is never
 * persisted as a user-controlled value: it is derived at read time from dates.
 */
function calculateProjectProgress(project, now = new Date()) {
  if (project?.status === 'completed') return 100;
  if (project?.status === 'draft' || project?.status === 'cancelled') return 0;

  const start = dateOnlyToUtc(project?.start_date);
  const end = dateOnlyToUtc(project?.end_date);
  if (!start || !end || end < start) return 0;

  const today = dateOnlyToUtc(currentDateOnly(now));
  if (!today) return 0;
  if (today >= end) return 100;
  if (today <= start) return 0;

  const totalDays = (end - start) / 86_400_000;
  const elapsedDays = (today - start) / 86_400_000;
  return Number(((elapsedDays / totalDays) * 100).toFixed(2));
}

function withCalculatedProjectProgress(project, now) {
  if (!project) return project;
  return { ...project, progress_percent: calculateProjectProgress(project, now) };
}

module.exports = { calculateProjectProgress, withCalculatedProjectProgress, currentDateOnly };
