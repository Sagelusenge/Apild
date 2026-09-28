function hasUnrestrictedTaskAccess(user) {
  const roles = user?.roles || [];
  return roles.includes('admin');
}

function isStaffTaskScope(user) {
  return !hasUnrestrictedTaskAccess(user);
}

module.exports = { hasUnrestrictedTaskAccess, isStaffTaskScope };
