const VERSION = "4.0.0-ENTERPRISE";
const MODULE_ID = "permissions-contract";
const RESOURCES = Object.freeze({
  ROUTE_DASHBOARD: "route:dashboard",
  ROUTE_GERAL: "route:geral",
  ROUTE_CLIENTES: "route:clientes",
  ROUTE_FINANCEIRO: "route:financeiro",
  ROUTE_SERVIDORES: "route:servidores",
  ROUTE_RELATORIOS: "route:relatorios",
  ROUTE_CONFIGURACOES: "route:configuracoes",
  PANEL_CARDS: "panel:painel-cards",
  PANEL_02: "panel:panel-02",
  PANEL_03: "panel:panel-03",
  PANEL_04: "panel:panel-04",
  PANEL_05: "panel:panel-05",
  PANEL_06: "panel:panel-06",
  PANEL_07: "panel:panel-07",
  PANEL_08: "panel:panel-08",
  PANEL_09: "panel:panel-09",
  PANEL_10: "panel:panel-10",
  PANEL_11: "panel:panel-11",
  PANEL_12: "panel:panel-12",
  PANEL_13: "panel:panel-13",
  PANEL_14: "panel:panel-14",
  PANEL_15: "panel:panel-15",
  PANEL_16: "panel:panel-16",
  PANEL_17: "panel:panel-17",
  PANEL_18: "panel:panel-18",
  PANEL_19: "panel:panel-19",
  MODULE_HEADER: "module:header",
  MODULE_SIDEBAR: "module:sidebar",
  MODULE_FOOTER: "module:footer",
  MODULE_LOGIN: "module:login-modal",
  MODULE_PRELOADER: "module:preloader",
  MODULE_APP_SHELL: "module:app-shell",
  MODULE_MAIN: "module:main",
  MODULE_ROUTER: "module:router",
  SETTINGS: "settings",
  USERS: "users",
  SYSTEM: "system",
  SECURITY: "security",
  REPORTS: "reports",
  AUDIT: "audit",
  DASHBOARD: "dashboard",
  CARDS: "cards",
  PANELS: "panels"
});
const ACTIONS = Object.freeze({
  VIEW: "view",
  EDIT: "edit",
  CREATE: "create",
  DELETE: "delete",
  REFRESH: "refresh",
  CONFIGURE: "configure",
  MANAGE: "manage",
  APPROVE: "approve",
  EXPORT: "export",
  IMPORT: "import",
  TOGGLE: "toggle",
  EXECUTE: "execute",
  ACCESS: "access"
});
const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  EDITOR: "editor",
  VIEWER: "viewer",
  GUEST: "guest"
});
const LEVELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.MANAGER]: 60,
  [ROLES.EDITOR]: 40,
  [ROLES.VIEWER]: 20,
  [ROLES.GUEST]: 10,
  NONE: 0
});
function buildResourceAction(resource, action) {
  return `${resource}:${action}`;
}
function parseResourceAction(resourceAction) {
  if (!resourceAction || typeof resourceAction !== "string") {
    return { resource: null, action: null };
  }
  const parts = resourceAction.split(":");
  if (parts.length < 2) {
    return { resource: resourceAction, action: null };
  }
  return {
    resource: parts.slice(0, -1).join(":"),
    action: parts[parts.length - 1]
  };
}
function isKnownRole(role) {
  return Object.values(ROLES).includes(role?.toLowerCase?.());
}
function getRoleLevel(role) {
  const normalizedRole = (role || "").toLowerCase();
  return LEVELS[normalizedRole] || LEVELS.NONE;
}
function getVersion() {
  return VERSION;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    resourcesCount: Object.keys(RESOURCES).length,
    actionsCount: Object.keys(ACTIONS).length,
    rolesCount: Object.keys(ROLES).length,
    levelsCount: Object.keys(LEVELS).length,
    timestamp: Date.now()
  };
}
function healthCheck() {
  const checks = {
    resourcesDefined: Object.keys(RESOURCES).length > 0,
    actionsDefined: Object.keys(ACTIONS).length > 0,
    rolesDefined: Object.keys(ROLES).length > 0,
    levelsDefined: Object.keys(LEVELS).length > 0,
    allRolesHaveLevels: Object.values(ROLES).every((role) => LEVELS[role] !== void 0)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    healthy: passed === total,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
var contract_default = {
  RESOURCES,
  ACTIONS,
  ROLES,
  LEVELS,
  buildResourceAction,
  parseResourceAction,
  isKnownRole,
  getRoleLevel,
  getVersion,
  info,
  healthCheck
};
export {
  ACTIONS,
  LEVELS,
  MODULE_ID,
  RESOURCES,
  ROLES,
  VERSION,
  buildResourceAction,
  contract_default as default,
  getRoleLevel,
  getVersion,
  healthCheck,
  info,
  isKnownRole,
  parseResourceAction
};
