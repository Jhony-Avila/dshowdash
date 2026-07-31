import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin:permissions-guard-adapter";
const _CorePorts = createCorePorts({ moduleId: MODULE_ID });
function _getLogger() {
  const logger = _CorePorts.get("logger");
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get("Logger");
    if (wl) return wl;
  }
  return null;
}
const _log = (level, ...args) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) {
    logger[level](prefix, ...args);
  } else if (level === "error" || level === "warn") {
    console.log(prefix, ...args);
  }
};
const PERMISSIONS = {
  VIEW_OWN: "sessions:view:own",
  VIEW_ALL: "sessions:view:all",
  TERMINATE_OWN: "sessions:terminate:own",
  TERMINATE_ALL: "sessions:terminate:all",
  ADMIN: "sessions:admin"
};
const UARPS_TRIGGERS = {
  VIEW_OWN: "trigger:panel:session-admin:view-own",
  VIEW_ALL: "trigger:panel:session-admin:view-all",
  TERMINATE_OWN: "trigger:panel:session-admin:terminate-own",
  TERMINATE_ALL: "trigger:panel:session-admin:terminate-all",
  ADMIN: "trigger:panel:session-admin:admin"
};
const ADMIN_ROLES = ["super_admin", "admin", "system_admin"];
const LEVEL_REQUIREMENTS = {
  [PERMISSIONS.VIEW_OWN]: 20,
  [PERMISSIONS.VIEW_ALL]: 80,
  [PERMISSIONS.TERMINATE_OWN]: 20,
  [PERMISSIONS.TERMINATE_ALL]: 80,
  [PERMISSIONS.ADMIN]: 80
};
let _ports = {};
let _uarpsCache = null;
let _uarpsCacheTime = 0;
const UARPS_CACHE_TTL = 6e4;
function _getPort(name) {
  return _ports[name] || null;
}
function injectPorts(ports) {
  _ports = ports || {};
  if (ports && ports.logger) {
    _CorePorts.inject({ logger: ports.logger });
  }
}
function getPorts() {
  return { ..._ports };
}
function isAuthenticated() {
  const auth = _getPort("auth");
  if (auth?.isAuthenticated) return auth.isAuthenticated();
  if (auth?.getUser) return !!auth.getUser();
  return false;
}
function isReady() {
  return isAuthenticated();
}
function getUser() {
  const auth = _getPort("auth");
  return auth?.getUser?.() || null;
}
function getLevel() {
  const auth = _getPort("auth");
  if (auth?.getLevel) return auth.getLevel();
  const user = getUser();
  return user?.level || 0;
}
function getRoles() {
  const auth = _getPort("auth");
  if (auth?.getRoles) return auth.getRoles();
  const user = getUser();
  return user?.roles || [];
}
async function checkUARPSTrigger(trigger, { signal } = {}) {
  try {
    if (_uarpsCache && Date.now() - _uarpsCacheTime < UARPS_CACHE_TTL) {
      return _uarpsCache[trigger] === true;
    }
    const response = await fetch("/api/permissions/uarps?action=user-permissions", { credentials: "include", signal });
    if (response.ok) {
      const data = await response.json();
      if ((data.ok ?? data.success) && data.data?.triggers) {
        _uarpsCache = {};
        data.data.triggers.forEach((t) => {
          if (_uarpsCache) _uarpsCache[t.trigger_id] = t.state === "allow";
        });
        _uarpsCacheTime = Date.now();
        return _uarpsCache[trigger] === true;
      }
    }
  } catch (e) {
    _log("warn", "UARPS check failed, using fallback:", e.message);
  }
  return null;
}
function isAdmin() {
  const auth = _getPort("auth");
  if (auth?.can?.(PERMISSIONS.ADMIN)) return true;
  const roles = getRoles();
  if (roles.some((r) => ADMIN_ROLES.includes(r))) return true;
  const level = getLevel();
  if (level >= LEVEL_REQUIREMENTS[PERMISSIONS.ADMIN]) return true;
  return false;
}
function can(permission) {
  const auth = _getPort("auth");
  if (auth?.can?.(permission)) return true;
  const level = getLevel();
  const required = LEVEL_REQUIREMENTS[permission];
  if (required !== void 0 && level >= required) return true;
  if (isAdmin()) return true;
  return false;
}
function canViewOwnSessions() {
  return can(PERMISSIONS.VIEW_OWN);
}
function canViewAllSessions() {
  return can(PERMISSIONS.VIEW_ALL);
}
function canTerminateOwnSessions() {
  return can(PERMISSIONS.TERMINATE_OWN);
}
function canTerminateAllSessions() {
  return can(PERMISSIONS.TERMINATE_ALL);
}
function canAccessPanel() {
  if (!isAuthenticated()) return { allowed: false, reason: "NOT_AUTHENTICATED" };
  if (!canViewOwnSessions()) return { allowed: false, reason: "NO_PERMISSION" };
  return { allowed: true, isAdmin: isAdmin() };
}
function getPermissionContext() {
  return {
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    user: getUser(),
    level: getLevel(),
    roles: getRoles(),
    permissions: { viewOwn: canViewOwnSessions(), viewAll: canViewAllSessions(), terminateOwn: canTerminateOwnSessions(), terminateAll: canTerminateAllSessions() },
    uarps_mode: "hybrid"
  };
}
function guard(requiredPermission) {
  return can(requiredPermission);
}
function healthCheck() {
  return { status: "healthy", authenticated: isAuthenticated(), isAdmin: isAdmin(), portsInjected: Object.keys(_ports).length > 0, uarpsCache: _uarpsCache !== null, portsInitialized: _CorePorts.isInitialized(), strictMode: isStrict(), version: VERSION };
}
function getVersion() {
  return VERSION;
}
var permissions_guard_adapter_default = { VERSION, MODULE_ID, PERMISSIONS, UARPS_TRIGGERS, isAuthenticated, isReady, isAdmin, getUser, getLevel, getRoles, can, canViewOwnSessions, canViewAllSessions, canTerminateOwnSessions, canTerminateAllSessions, canAccessPanel, getPermissionContext, guard, healthCheck, getVersion, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  can,
  canAccessPanel,
  canTerminateAllSessions,
  canTerminateOwnSessions,
  canViewAllSessions,
  canViewOwnSessions,
  permissions_guard_adapter_default as default,
  getLevel,
  getPermissionContext,
  getPorts,
  getRoles,
  getUser,
  getVersion,
  guard,
  healthCheck,
  injectPorts,
  isAdmin,
  isAuthenticated,
  isReady
};
