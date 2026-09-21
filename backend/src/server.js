const app = require('./app');
const appConfig = require('./config/app.config');
const env = require('./config/env');
const db = require('./config/database');
const logger = require('./utils/logger');
const { startJobs, stopJobs } = require('./jobs');
const { resumePending } = require('./modules/articles/article-publication.service');

const server = app.listen(appConfig.port, () => {
  logger.info({ port: appConfig.port, env: appConfig.env }, `${appConfig.name} demarree`);
  resumePending().catch((error) => logger.error({ err: error }, 'Échec de reprise des diffusions de publications'));
  if (env.ENABLE_JOBS) startJobs();
});

async function shutdown(signal) {
  logger.info({ signal }, 'Arret propre du serveur');
  stopJobs();
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => logger.error({ err: error }, 'Promesse non geree'));
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Exception non geree');
  process.exit(1);
});

module.exports = server;
