// Migrado para TypeScript: 2026-02-25
// Router Contracts - Fonte Canonica v2.0.2-ENTERPRISE
// RESPONSAVEL: Expor contratos de rota para toda aplicacao
// NAO FAZ: Logica de navegacao (isso e /app/router/index.ts)
// FIX v2.0.2: Usa path absoluto web (/components/...) nao relativo filesystem

export const VERSION = '2.0.2-ENTERPRISE' as const;
export const MODULE_ID = 'router-contracts' as const;

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

export interface ContractsInfoResult {
  version: typeof VERSION;
  moduleId: typeof MODULE_ID;
  source: string;
  routesSource: string;
  eventsSource: string;
}

// ═══════════════════════════════════════════════════════════════
// Events - Fonte unica
// ═══════════════════════════════════════════════════════════════

export { AUTH_EVENTS, ROUTER_EVENTS } from '../events/events-contracts.ts';

// ═══════════════════════════════════════════════════════════════
// Routes Registry - Reexporta tudo (path absoluto web)
// ═══════════════════════════════════════════════════════════════

export {
  // Definitions
  routes,
  ROUTES_SCHEMA,
  VERSION as ROUTES_VERSION,
  MODULE_ID as ROUTES_MODULE_ID,
  // Aliases
  aliasMap,
  resolveAlias,
  routeExists,
  // Helpers - Getters
  getRouteByIdOrPath,
  getRouteByPath,
  getRouteByPage,
  getRouteById,
  getRouteByPanel,
  getRouteByView,
  getRoutesByTag,
  getRoutesByDomain,
  getAllRoutes,
  getPublicRoutes,
  getProtectedRoutes,
  getEnterpriseRoutes,
  getRoutesByMinLevel,
  getDefaultRoute,
  getLoginRoute,
  getNotFoundRoute,
  getForbiddenRoute,
  // Helpers - Mount logic
  shouldMountMain,
  getNoMountMainRoutes,
  getUniqueDomains,
  // Validation
  validateRoutes,
  getRoutesInfo,
  getVersion
} from '/components/router/registry/routes.js';

// Default export e o objeto routes
export { routes as default } from '/components/router/registry/routes.js';

// ═══════════════════════════════════════════════════════════════
// Info helper
// ═══════════════════════════════════════════════════════════════

export function info(): ContractsInfoResult {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    source: '/app/router/contracts.ts',
    routesSource: '/components/router/registry/routes.js',
    eventsSource: '/app/events/events-contracts.ts'
  };
}
