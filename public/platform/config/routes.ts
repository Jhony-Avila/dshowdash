// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform.config.routes
// PURPOSE: Platform Routes Config
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   ROUTES
//   PUBLIC_ROUTES
//   PROTECTED_ROUTES
//   isPublicRoute
//   isProtectedRoute
//   VERSION
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'platform.config.routes';

const VERSION = '3.1.0-P2-ENTERPRISE';

const ROUTES = Object.freeze({
  HOME: '/', LOGIN: '/login', LOGOUT: '/logout', FORBIDDEN: '/forbidden', NOT_FOUND: '/404', MAINTENANCE: '/maintenance',
  DASHBOARD: '/geral', RH: '/rh-pessoas', FINANCEIRO: '/financeiro', CLIENTES: '/clientes', OPERACIONAL: '/operacional',
  COMERCIAL: '/comercial', COMPRAS: '/compras', PRODUTOS: '/produtos', INTEGRACOES: '/google-drive', MARKETING: '/instagram',
  AUTOMACOES: '/automacoes', JURIDICO: '/contratos'
});

const PUBLIC_ROUTES = ['/login', '/logout', '/forbidden', '/404', '/maintenance'];
const PROTECTED_ROUTES = Object.keys(ROUTES).map(k => ROUTES[k as keyof typeof ROUTES]).filter(r => PUBLIC_ROUTES.indexOf(r) === -1);

function isPublicRoute(route: string) { return PUBLIC_ROUTES.some(r => route.indexOf(r) === 0); }
function isProtectedRoute(route: string) { return !isPublicRoute(route); }

export { ROUTES, PUBLIC_ROUTES, PROTECTED_ROUTES, isPublicRoute, isProtectedRoute, VERSION };
export default { ROUTES, PUBLIC_ROUTES, PROTECTED_ROUTES, isPublicRoute, isProtectedRoute, VERSION };
