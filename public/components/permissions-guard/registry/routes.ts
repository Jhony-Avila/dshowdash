// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-guard-registry-routes
// PURPOSE: Permissions Guard - Routes Registry v3.2.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   routePolicies — exported value
//   getRoutePolicy() — exported function
//   isPublicRoute() — exported function
//   getProtectedRoutes() — exported function
//   getPublicRoutes() — exported function
//   getEnterpriseRoutes() — exported function
//   getAllRoutes() — exported function
//   registerRoute() — exported function
//   validateRoutePolicies() — exported function
//   getVersion() — exported function
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

export const VERSION = '3.2.0-ENTERPRISE';

const routePolicies: Record<string, { public: boolean; roles: string[]; minLevel: number }> = {
  'login': { public: true, roles: [], minLevel: 0 },
  'forgot-password': { public: true, roles: [], minLevel: 0 },
  'reset-password': { public: true, roles: [], minLevel: 0 },
  'dashboard': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
  'geral': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
  'monitor': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
  'clientes': { public: false, roles: ['editor', 'manager', 'admin', 'super_admin'], minLevel: 40 },
  'financeiro': { public: false, roles: ['manager', 'admin', 'super_admin'], minLevel: 60 },
  'servidores': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'relatorios': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
  'configuracoes': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'sistema': { public: false, roles: ['super_admin'], minLevel: 100 },
  'admin/usuarios': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'admin/users': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'usuarios': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'user-management': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'admin/permissoes': { public: false, roles: ['super_admin'], minLevel: 100 },
  'admin/permissions': { public: false, roles: ['super_admin'], minLevel: 100 },
  'admin/roles': { public: false, roles: ['super_admin'], minLevel: 100 },
  'permissions-admin': { public: false, roles: ['super_admin'], minLevel: 100 },
  'admin/sessoes': { public: false, roles: ['manager', 'admin', 'super_admin'], minLevel: 60 },
  'admin/sessions': { public: false, roles: ['manager', 'admin', 'super_admin'], minLevel: 60 },
  'session-admin': { public: false, roles: ['manager', 'admin', 'super_admin'], minLevel: 60 },
  'admin/auditoria': { public: false, roles: ['manager', 'admin', 'super_admin'], minLevel: 60 },
  'admin/audit': { public: false, roles: ['manager', 'admin', 'super_admin'], minLevel: 60 },
  'auditoria': { public: false, roles: ['manager', 'admin', 'super_admin'], minLevel: 60 },
  'audit-trail': { public: false, roles: ['manager', 'admin', 'super_admin'], minLevel: 60 },
  'admin/seguranca': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'admin/security': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'seguranca': { public: false, roles: ['admin', 'super_admin'], minLevel: 80 },
  'preferencias': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
  'preferences': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
  'user-preferences': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
  'minha-conta': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
  'perfil': { public: false, roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 }
};

function getRoutePolicy(routePath: string) {
  if (!routePath) return null;
  const normalized = routePath.replace(/^[#\/]+/, '').toLowerCase();
  if (routePolicies[normalized]) { return routePolicies[normalized]; }
  const keys = Object.keys(routePolicies).sort((a, b) => b.length - a.length);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (normalized.indexOf(`${key}/`) === 0 || normalized === key) { return routePolicies[key]; }
  }
  return null;
}

function isPublicRoute(routePath: string) { const policy = getRoutePolicy(routePath); return policy && policy.public === true; }

function getProtectedRoutes() {
  return Object.entries(routePolicies).filter(entry => !entry[1].public).map(entry => Object.assign({ route: entry[0] }, entry[1]));
}

function getPublicRoutes() {
  return Object.entries(routePolicies).filter(entry => entry[1].public === true).map(entry => Object.assign({ route: entry[0] }, entry[1]));
}

function getEnterpriseRoutes() {
  return Object.entries(routePolicies).filter(entry => entry[0].indexOf('admin/') === 0 || ['usuarios', 'auditoria', 'seguranca', 'preferencias'].indexOf(entry[0]) !== -1).map(entry => Object.assign({ route: entry[0] }, entry[1]));
}

function getAllRoutes() { return Object.entries(routePolicies).map(entry => Object.assign({ route: entry[0] }, entry[1])); }

function registerRoute(routePath: string, policy: { public: boolean; roles: string[]; minLevel: number }) {
  if (!routePath || !policy) return false;
  const normalized = routePath.replace(/^[#\/]+/, '').toLowerCase();
  routePolicies[normalized] = policy;
  return true;
}

function validateRoutePolicies(routerRoutes: string[] = []) {
  const missing = routerRoutes.map(route => route.replace(/^[#\/]+/, '').toLowerCase()).filter(route => !routePolicies[route]);
  return { valid: missing.length === 0, missing };
}

function getVersion() { return VERSION; }

export { routePolicies, getRoutePolicy, isPublicRoute, getProtectedRoutes, getPublicRoutes, getEnterpriseRoutes, getAllRoutes, registerRoute, validateRoutePolicies, getVersion };

export default { routePolicies, getRoutePolicy, isPublicRoute, getProtectedRoutes, getPublicRoutes, getEnterpriseRoutes, getAllRoutes, registerRoute, validateRoutePolicies, getVersion };

export const MODULE_ID = 'permissions-guard-registry-routes';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
