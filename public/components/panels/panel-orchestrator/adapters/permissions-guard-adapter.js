const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator:permissions-guard-adapter";
const UARPS_TRIGGERS = {
  VIEW: "trigger:panel:orchestrator:view",
  EXECUTE: "trigger:panel:orchestrator:execute",
  ADMIN: "trigger:panel:orchestrator:admin"
};
const REQUIRED_LEVEL = 80;
const _state = {
  initialized: false,
  lastCheck: null
};
let _ports = {};
function _getPort(name) {
  return _ports[name] || null;
}
function injectPorts(ports) {
  _ports = ports || {};
  _state.initialized = true;
}
function isReady() {
  return _state.initialized && Object.keys(_ports).length > 0;
}
function isAuthenticated() {
  const auth = _getPort("auth");
  if (auth?.isAuthenticated) return auth.isAuthenticated();
  if (auth?.getUser) return !!auth.getUser();
  return false;
}
function getLevel() {
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
function getUser() {
  const auth = _getPort("auth");
  return auth?.getUser?.() || null;
}
function canAccessPanel() {
  if (!isAuthenticated()) {
    return { allowed: false, reason: "NOT_AUTHENTICATED" };
  }
  const auth = _getPort("auth");
  if (auth?.can?.("orchestrator:view")) {
    return { allowed: true, method: "uarps" };
  }
  const roles = getRoles();
  if (roles.includes("super_admin") || roles.includes("admin")) {
    return { allowed: true, method: "role" };
  }
  const level = getLevel();
  if (level >= REQUIRED_LEVEL) {
    return { allowed: true, method: "level_fallback" };
  }
  return { allowed: false, reason: "INSUFFICIENT_PERMISSIONS" };
}
function can(action) {
  if (!isAuthenticated()) return false;
  const auth = _getPort("auth");
  if (auth?.can?.(action)) return true;
  const roles = getRoles();
  if (roles.includes("super_admin") || roles.includes("admin")) return true;
  const level = getLevel();
  return level >= REQUIRED_LEVEL;
}
function guard(action) {
  const result = can(action);
  _state.lastCheck = { action, result, timestamp: Date.now() };
  return result;
}
function getPermissions() {
  return {
    canView: can("orchestrator:view"),
    canExecute: can("orchestrator:execute"),
    canAdmin: can("orchestrator:admin"),
    canSync: can("orchestrator:sync"),
    canBroadcast: can("orchestrator:broadcast")
  };
}
function healthCheck() {
  return {
    status: "healthy",
    initialized: _state.initialized,
    authenticated: isAuthenticated(),
    canAccess: canAccessPanel().allowed,
    portsInjected: Object.keys(_ports).length > 0,
    lastCheck: _state.lastCheck,
    version: VERSION
  };
}
function getVersion() {
  return VERSION;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    state: { ..._state },
    ports: Object.keys(_ports),
    permissions: getPermissions(),
    uarps_triggers: UARPS_TRIGGERS
  };
}
var permissions_guard_adapter_default = {
  VERSION,
  MODULE_ID,
  UARPS_TRIGGERS,
  REQUIRED_LEVEL,
  injectPorts,
  isReady,
  isAuthenticated,
  getLevel,
  getRoles,
  getUser,
  canAccessPanel,
  can,
  guard,
  getPermissions,
  healthCheck,
  getVersion,
  info
};
export {
  MODULE_ID,
  VERSION,
  can,
  canAccessPanel,
  permissions_guard_adapter_default as default,
  getLevel,
  getPermissions,
  getRoles,
  getUser,
  getVersion,
  guard,
  healthCheck,
  info,
  injectPorts,
  isAuthenticated,
  isReady
};
