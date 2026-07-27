// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-contract
// PURPOSE: Permissions Guard - Contract v4.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RESOURCES — exported value
//   ACTIONS — exported value
//   ROLES — exported value
//   LEVELS — exported value
//   buildResourceAction() — exported function
//   parseResourceAction() — exported function
//   isKnownRole() — exported function
//   getRoleLevel() — exported function
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '4.0.0-ENTERPRISE';
export const MODULE_ID = 'permissions-contract';

export const RESOURCES = Object.freeze({
  ROUTE_DASHBOARD: 'route:dashboard',
  ROUTE_GERAL: 'route:geral',
  ROUTE_CLIENTES: 'route:clientes',
  ROUTE_FINANCEIRO: 'route:financeiro',
  ROUTE_SERVIDORES: 'route:servidores',
  ROUTE_RELATORIOS: 'route:relatorios',
  ROUTE_CONFIGURACOES: 'route:configuracoes',

  PANEL_CARDS: 'panel:painel-cards',
  PANEL_02: 'panel:panel-02',
  PANEL_03: 'panel:panel-03',
  PANEL_04: 'panel:panel-04',
  PANEL_05: 'panel:panel-05',
  PANEL_06: 'panel:panel-06',
  PANEL_07: 'panel:panel-07',
  PANEL_08: 'panel:panel-08',
  PANEL_09: 'panel:panel-09',
  PANEL_10: 'panel:panel-10',
  PANEL_11: 'panel:panel-11',
  PANEL_12: 'panel:panel-12',
  PANEL_13: 'panel:panel-13',
  PANEL_14: 'panel:panel-14',
  PANEL_15: 'panel:panel-15',
  PANEL_16: 'panel:panel-16',
  PANEL_17: 'panel:panel-17',
  PANEL_18: 'panel:panel-18',
  PANEL_19: 'panel:panel-19',

  MODULE_HEADER: 'module:header',
  MODULE_SIDEBAR: 'module:sidebar',
  MODULE_FOOTER: 'module:footer',
  MODULE_LOGIN: 'module:login-modal',
  MODULE_PRELOADER: 'module:preloader',
  MODULE_APP_SHELL: 'module:app-shell',
  MODULE_MAIN: 'module:main',
  MODULE_ROUTER: 'module:router',

  SETTINGS: 'settings',
  USERS: 'users',
  SYSTEM: 'system',
  SECURITY: 'security',
  REPORTS: 'reports',
  AUDIT: 'audit',
  DASHBOARD: 'dashboard',
  CARDS: 'cards',
  PANELS: 'panels'
});

export const ACTIONS = Object.freeze({
  VIEW: 'view',
  EDIT: 'edit',
  CREATE: 'create',
  DELETE: 'delete',
  REFRESH: 'refresh',
  CONFIGURE: 'configure',
  MANAGE: 'manage',
  APPROVE: 'approve',
  EXPORT: 'export',
  IMPORT: 'import',
  TOGGLE: 'toggle',
  EXECUTE: 'execute',
  ACCESS: 'access'
});

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  GUEST: 'guest'
});

export const LEVELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.MANAGER]: 60,
  [ROLES.EDITOR]: 40,
  [ROLES.VIEWER]: 20,
  [ROLES.GUEST]: 10,
  NONE: 0
});

export function buildResourceAction(resource: string, action: string) {
  return `${resource}:${action}`;
}

export function parseResourceAction(resourceAction: string) {
  if (!resourceAction || typeof resourceAction !== 'string') {
    return { resource: null, action: null };
  }
  const parts = resourceAction.split(':');
  if (parts.length < 2) {
    return { resource: resourceAction, action: null };
  }
  return {
    resource: parts.slice(0, -1).join(':'),
    action: parts[parts.length - 1]
  };
}

export function isKnownRole(role: string) {
  return (Object.values(ROLES) as string[]).includes(role?.toLowerCase?.());
}

export function getRoleLevel(role: string) {
  const normalizedRole = (role || '').toLowerCase();
  return (LEVELS as Record<string, number>)[normalizedRole] || LEVELS.NONE;
}

export function getVersion() { return VERSION; }

export function info() {
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

export function healthCheck() {
  const checks = {
    resourcesDefined: Object.keys(RESOURCES).length > 0,
    actionsDefined: Object.keys(ACTIONS).length > 0,
    rolesDefined: Object.keys(ROLES).length > 0,
    levelsDefined: Object.keys(LEVELS).length > 0,
    allRolesHaveLevels: Object.values(ROLES).every(role => LEVELS[role] !== undefined)
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    healthy: passed === total,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export default {
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
