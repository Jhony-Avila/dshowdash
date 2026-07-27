const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail:permissions-guard-adapter";
const UARPS_TRIGGERS = {
  VIEW: "trigger:panel:audit-trail:view",
  ADMIN: "trigger:panel:audit-trail:admin"
};
const MIN_ACCESS_LEVEL = 80;
let _ports = {};
function _getPort(name) {
  return _ports[name] || null;
}
function injectPorts(ports) {
  _ports = ports || {};
}
function isAuthenticated() {
  const auth = _getPort("auth");
  if (auth?.isAuthenticated) return auth.isAuthenticated();
  if (auth?.getUser) return !!auth.getUser();
  return false;
}
function getUserLevel() {
  const auth = _getPort("auth");
  if (auth?.getLevel) return auth.getLevel();
  const user = auth?.getUser?.();
  return user?.level || 0;
}
function getRoles() {
  const auth = _getPort("auth");
  if (auth?.getRoles) return auth.getRoles();
  const user = auth?.getUser?.();
  return user?.roles || [];
}
function checkPermission(permission) {
  const auth = _getPort("auth");
  if (auth?.can) return auth.can(permission);
  return false;
}
const canAccessPanel = () => {
  if (!isAuthenticated()) return false;
  if (checkPermission("audit:view")) return true;
  const roles = getRoles();
  if (roles.includes("super_admin") || roles.includes("admin")) return true;
  const level = getUserLevel();
  return level >= MIN_ACCESS_LEVEL;
};
function canExportAudit() {
  if (!isAuthenticated()) return false;
  if (checkPermission("audit:export")) return true;
  return getUserLevel() >= 90;
}
function canFilterByUser() {
  if (!isAuthenticated()) return false;
  if (checkPermission("audit:filter:user")) return true;
  return getUserLevel() >= MIN_ACCESS_LEVEL;
}
function getPermissionContext() {
  return {
    isAuthenticated: isAuthenticated(),
    level: getUserLevel(),
    roles: getRoles(),
    canAccess: canAccessPanel(),
    canExport: canExportAudit(),
    canFilterByUser: canFilterByUser(),
    uarps_mode: "hybrid"
  };
}
function healthCheck() {
  return {
    status: "healthy",
    authenticated: isAuthenticated(),
    canAccess: canAccessPanel(),
    portsInjected: Object.keys(_ports).length > 0,
    version: VERSION
  };
}
function getVersion() {
  return VERSION;
}
var permissions_guard_adapter_default = {
  VERSION,
  MODULE_ID,
  UARPS_TRIGGERS,
  injectPorts,
  isAuthenticated,
  getUserLevel,
  getRoles,
  checkPermission,
  canAccessPanel,
  canExportAudit,
  canFilterByUser,
  getPermissionContext,
  healthCheck,
  getVersion
};
export {
  MODULE_ID,
  VERSION,
  canAccessPanel,
  canExportAudit,
  canFilterByUser,
  checkPermission,
  permissions_guard_adapter_default as default,
  getPermissionContext,
  getRoles,
  getUserLevel,
  getVersion,
  healthCheck,
  injectPorts,
  isAuthenticated
};
