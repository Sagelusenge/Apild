const reminderJob = require('./reminder.job');
const newsletterJob = require('./newsletter.job');
const weeklyReportJob = require('./weeklyReport.job');
const articlePublicationJob = require('./articlePublication.job');
const operationalEmailJob = require('./operationalEmail.job');
const projectEndReminderJob = require('./projectEndReminder.job');

const jobs = [reminderJob, newsletterJob, weeklyReportJob, articlePublicationJob, operationalEmailJob, projectEndReminderJob];

function startJobs() { jobs.forEach((job) => job.start()); }
function stopJobs() { jobs.forEach((job) => job.stop()); }

module.exports = { startJobs, stopJobs };
