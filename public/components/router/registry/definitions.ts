// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Router Definitions - Compatibility Wrapper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ROUTES_SCHEMA — exported value
//   DOMAINS — exported value
//   LAYOUTS — exported value
//   routes — exported value
//   getRouteById — exported value
//   getRouteByPath — exported value
//   getRoutesByDomain — exported value
//   getRoutesByTag — exported value
//   getPublicRoutes — exported value
//   getProtectedRoutes — exported value
//   getAllAliases — exported value
//   resolveAlias — exported value
//   getRouteCount — exported value
//   info — exported value
//   healthCheck — exported value
//   dashboardRoutes — exported value
//   businessRoutes — exported value
//   integrationRoutes — exported value
//   adminRoutes — exported value
//   systemRoutes — exported value
//   default — exported value
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
export { VERSION, MODULE_ID, ROUTES_SCHEMA, DOMAINS, LAYOUTS, routes, getRouteById, getRouteByPath, getRoutesByDomain, getRoutesByTag, getPublicRoutes, getProtectedRoutes, getAllAliases, resolveAlias, getRouteCount, info, healthCheck, dashboardRoutes, businessRoutes, integrationRoutes, adminRoutes, systemRoutes } from './definitions/index.js';
export { default } from './definitions/index.js';
