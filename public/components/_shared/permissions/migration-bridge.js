import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components._shared.permissions.migration-bridge";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, msg, data || "");
  } else if (level === "warn") {
    if (logger.warn) logger.warn(prefix, msg, data || "");
  } else if (level === "debug") {
    if (logger.debug) logger.debug(prefix, msg, data || "");
  } else {
    if (logger.info) logger.info(prefix, msg, data || "");
  }
};
const _config = { mode: "uarps-first", logDecisions: false, defaultAllow: true };
const ROUTE_TO_TRIGGER = {
  "/admin/usuarios": "trigger:navrail:admin-users",
  "/admin/permissoes": "trigger:navrail:admin-settings",
  "/admin/sessoes": "trigger:navrail:admin-settings",
  "/admin/feature-flags": "trigger:navrail:admin-settings",
  "/admin/auditoria": "trigger:navrail:admin-settings",
  "/admin/navegacao": "trigger:navrail:admin-settings",
  "/admin-users": "trigger:navrail:admin-users",
  "/admin-settings": "trigger:navrail:admin-settings",
  "/preferencias": "trigger:navrail:home",
  "/profile": "trigger:navrail:home",
  "/settings": "trigger:navrail:home"
};
const PANEL_TO_TRIGGER = {
  "panel-user-management": "trigger:navrail:admin-users",
  "panel-permissions-admin": "trigger:navrail:admin-settings",
  "panel-session-admin": "trigger:navrail:admin-settings",
  "panel-feature-flags-admin": "trigger:navrail:admin-settings",
  "panel-audit-trail": "trigger:navrail:admin-settings",
  "panel-nav-admin": "trigger:navrail:admin-settings",
  "panel-enterprise": "trigger:navrail:admin-settings",
  "panel-orchestrator": "trigger:navrail:admin-settings",
  "panel-health-dashboard": "trigger:navrail:admin-settings",
  "panel-15": "trigger:navrail:analytics",
  "panel-16": "trigger:navrail:database",
  "panel-17": "trigger:navrail:analytics",
  "panel-18": "trigger:navrail:analytics",
  "panel-19": "trigger:navrail:admin-settings",
  "panel-cards": "trigger:navrail:dashboard",
  "panel-dashboard": "trigger:navrail:dashboard"
};
const PANEL_TO_REGION = {
  "panel-user-management": "region:panel:user-management",
  "panel-permissions-admin": "region:panel:permissions-admin",
  "panel-session-admin": "region:panel:session-admin",
  "panel-feature-flags-admin": "region:panel:feature-flags-admin",
  "panel-audit-trail": "region:panel:audit-trail",
  "panel-nav-admin": "region:panel:nav-admin",
  "panel-enterprise": "region:panel:enterprise",
  "panel-orchestrator": "region:panel:orchestrator",
  "panel-health-dashboard": "region:panel:health-dashboard",
  "panel-cards": "region:panel:cards",
  "panel-dashboard": "region:panel:dashboard"
};
function _getPermissions() {
  return hasWindow ? window.Permissions : null;
}
function _checkUARPS(triggerId, regionId) {
  const perms = _getPermissions();
  if (!perms) return null;
  if (triggerId) {
    const canTrigger2 = perms.canTrigger(triggerId);
    if (canTrigger2 === false) return false;
    if (canTrigger2 === true) return true;
  }
  if (regionId) {
    const canAccess = perms.canAccessRegion(regionId);
    if (canAccess === false) return false;
    if (canAccess === true) return true;
  }
  return null;
}
function _checkMinLevel(requiredLevel, userLevel) {
  if (!requiredLevel || requiredLevel === 0) return true;
  if (userLevel === void 0 || userLevel === null) return false;
  return userLevel >= requiredLevel;
}
function _getUserLevel() {
  if (hasWindow && window.CoreAuthAdapter && window.CoreAuthAdapter.getLevel) {
    const level = window.CoreAuthAdapter.getLevel();
    return level !== null && level !== void 0 ? level : 0;
  }
  const gs = _getPort("globalState");
  if (gs && gs.getState) {
    const state = gs.getState();
    if (state && state.auth && state.auth.user) return state.auth.user.level || 0;
    if (state && state.user) return state.user.level || 0;
  }
  return 0;
}
function canAccessRoute(routePath, routeConfig) {
  if (!routeConfig) routeConfig = {};
  const triggerId = ROUTE_TO_TRIGGER[routePath] || null;
  const minLevel = routeConfig.minLevel || 0;
  const userLevel = _getUserLevel();
  let decision = { allowed: true, source: "default", details: {} };
  if (_config.mode === "uarps-first" || _config.mode === "uarps-only") {
    const uarpsResult = _checkUARPS(triggerId);
    if (uarpsResult !== null) {
      decision = { allowed: uarpsResult, source: "uarps", details: { triggerId, uarpsResult } };
    } else if (_config.mode === "uarps-first") {
      const minLevelResult = _checkMinLevel(minLevel, userLevel);
      decision = { allowed: minLevelResult, source: "minlevel-fallback", details: { minLevel, userLevel } };
    } else {
      decision = { allowed: _config.defaultAllow, source: "uarps-undefined", details: { triggerId } };
    }
  } else if (_config.mode === "minlevel-first" || _config.mode === "minlevel-only") {
    const minLevelResult2 = _checkMinLevel(minLevel, userLevel);
    if (_config.mode === "minlevel-only") {
      decision = { allowed: minLevelResult2, source: "minlevel", details: { minLevel, userLevel } };
    } else {
      if (minLevelResult2) {
        const uarpsResult2 = _checkUARPS(triggerId);
        if (uarpsResult2 === false) {
          decision = { allowed: false, source: "uarps-override", details: { triggerId, minLevelPassed: true } };
        } else {
          decision = { allowed: true, source: "minlevel+uarps", details: { minLevel, userLevel, triggerId } };
        }
      } else {
        decision = { allowed: false, source: "minlevel", details: { minLevel, userLevel } };
      }
    }
  }
  if (_config.logDecisions) _log("debug", `Route access: ${routePath}`, decision);
  return decision;
}
function canAccessPanel(panelId, panelConfig) {
  if (!panelConfig) panelConfig = {};
  const triggerId = PANEL_TO_TRIGGER[panelId] || null;
  const regionId = PANEL_TO_REGION[panelId] || `region:panel:${panelId}`;
  const minLevel = panelConfig.minLevel || 0;
  const userLevel = _getUserLevel();
  let decision = { allowed: true, source: "default", details: {} };
  if (_config.mode === "uarps-first" || _config.mode === "uarps-only") {
    const uarpsResult = _checkUARPS(triggerId, regionId);
    if (uarpsResult !== null) {
      decision = { allowed: uarpsResult, source: "uarps", details: { triggerId, regionId, uarpsResult } };
    } else if (_config.mode === "uarps-first") {
      const minLevelResult = _checkMinLevel(minLevel, userLevel);
      decision = { allowed: minLevelResult, source: "minlevel-fallback", details: { minLevel, userLevel } };
    } else {
      decision = { allowed: _config.defaultAllow, source: "uarps-undefined", details: { triggerId, regionId } };
    }
  } else {
    const minLevelResult2 = _checkMinLevel(minLevel, userLevel);
    decision = { allowed: minLevelResult2, source: "minlevel", details: { minLevel, userLevel } };
  }
  if (_config.logDecisions) _log("debug", `Panel access: ${panelId}`, decision);
  return decision;
}
function canTrigger(triggerId) {
  const perms = _getPermissions();
  if (!perms) return true;
  return perms.canTrigger(triggerId);
}
function canAccessRegion(regionId) {
  const perms = _getPermissions();
  if (!perms) return true;
  return perms.canAccessRegion(regionId);
}
function setMode(mode) {
  if (["uarps-first", "minlevel-first", "uarps-only", "minlevel-only"].indexOf(mode) >= 0) {
    _config.mode = mode;
    _log("info", `Mode changed to: ${mode}`);
  }
}
function getMode() {
  return _config.mode;
}
function setLogDecisions(enabled) {
  _config.logDecisions = enabled;
}
function healthCheck() {
  const ps = Ports.snapshot();
  const perms = _getPermissions();
  const logger = _getPort("logger");
  return {
    status: perms ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    mode: _config.mode,
    uarpsAvailable: !!perms,
    loggerAvailable: !!logger,
    mappings: {
      routes: Object.keys(ROUTE_TO_TRIGGER).length,
      panels: Object.keys(PANEL_TO_TRIGGER).length,
      regions: Object.keys(PANEL_TO_REGION).length
    },
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    mode: _config.mode,
    logDecisions: _config.logDecisions,
    defaultAllow: _config.defaultAllow,
    mappings: { ROUTE_TO_TRIGGER, PANEL_TO_TRIGGER, PANEL_TO_REGION },
    timestamp: Date.now()
  };
}
var migration_bridge_default = {
  VERSION,
  MODULE_ID,
  canAccessRoute,
  canAccessPanel,
  canTrigger,
  canAccessRegion,
  setMode,
  getMode,
  setLogDecisions,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  canAccessPanel,
  canAccessRegion,
  canAccessRoute,
  canTrigger,
  migration_bridge_default as default,
  getMode,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  setLogDecisions,
  setMode
};
