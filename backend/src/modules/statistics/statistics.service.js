const repository = require('./statistics.repository');
const { withCalculatedProjectProgress } = require('../../utils/projectProgress');

module.exports = {
  ...repository,
  async projects() {
    const projects = await repository.projects();
    return projects.map((project) => withCalculatedProjectProgress(project));
  }
};
