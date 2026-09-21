function hasUnrestrictedTaskAccess(user) {
  const roles = user?.roles || [];
  return roles.includes('admin');
}

function isStaffTaskScope(user) {
  const roles = user?.roles || [];
  return roles.includes('staff') && !hasUnrestrictedTaskAccess(user);
}

module.exports = { hasUnrestrictedTaskAccess, isStaffTaskScope };
