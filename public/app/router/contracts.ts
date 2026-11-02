// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-contracts
// PURPOSE: Router Contracts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   shouldMountMain() — exported function
//   isPublicRoute() — exported function
//   getRouteByPath() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   SYSTEM_ROUTES — exported value
//   PUBLIC_ROUTES — exported value
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

const VERSION = '1.2.0-ENTERPRISE';
const MODULE_ID = 'router-contracts';

// Rotas que NÃO devem montar o Main
const SYSTEM_ROUTES = ['/login', '/logout', '/403', '/404', '/maintenance', '/error'];

// Rotas públicas (sem auth)
const PUBLIC_ROUTES = ['/login', '/403', '/404', '/maintenance'];

function shouldMountMain(path: string): boolean {
  if (!path) return true;
  const normalized = path.toLowerCase().replace(/\/+$/, '') || '/';
  return SYSTEM_ROUTES.indexOf(normalized) === -1;
}

function isPublicRoute(path: string): boolean {
  if (!path) return false;
  const normalized = path.toLowerCase().replace(/\/+$/, '') || '/';
  return PUBLIC_ROUTES.indexOf(normalized) !== -1;
}

function getRouteByPath(path: string): { id: string; layout: string; requiresAuth: boolean } {
  const normalized = (path && path.toLowerCase().replace(/\/+$/, '')) || '/';
  const routes: Record<string, { id: string; layout: string; requiresAuth: boolean }> = {
    '/': { id: 'home', layout: 'main', requiresAuth: true },
    '/login': { id: 'login', layout: 'minimal', requiresAuth: false },
    '/logout': { id: 'logout', layout: 'minimal', requiresAuth: false },
    '/403': { id: 'forbidden', layout: 'error', requiresAuth: false },
    '/404': { id: 'not-found', layout: 'error', requiresAuth: false },
    '/maintenance': { id: 'maintenance', layout: 'minimal', requiresAuth: false }
  };
  return routes[normalized] || { id: 'dynamic', layout: 'main', requiresAuth: true };
}

function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { systemRoutes: SYSTEM_ROUTES.length, publicRoutes: PUBLIC_ROUTES.length } };
}

function info() {
  return { moduleId: MODULE_ID, version: VERSION, systemRoutes: SYSTEM_ROUTES.length, publicRoutes: PUBLIC_ROUTES.length };
}

export { VERSION, MODULE_ID, shouldMountMain, isPublicRoute, getRouteByPath, healthCheck, info, SYSTEM_ROUTES, PUBLIC_ROUTES };
export default { VERSION, MODULE_ID, shouldMountMain, isPublicRoute, getRouteByPath, healthCheck, info, SYSTEM_ROUTES, PUBLIC_ROUTES };
