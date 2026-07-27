// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Router Global - Routes Registry v5.4.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION from ./definitions.js
//
// PROVIDES:
//   getVersion() — exported function
//   routes — exported value
//   ROUTES_SCHEMA — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   aliasMap — exported value
//   resolveAlias — exported value
//   routeExists — exported value
//   getRouteByIdOrPath — exported value
//   getRouteByPath — exported value
//   getRouteByPage — exported value
//   getRouteById — exported value
//   getRouteByPanel — exported value
//   getRouteByView — exported value
//   getRoutesByTag — exported value
//   getRoutesByDomain — exported value
//   getAllRoutes — exported value
//   getPublicRoutes — exported value
//   getProtectedRoutes — exported value
//   getEnterpriseRoutes — exported value
//   getRoutesByMinLevel — exported value
//   getDefaultRoute — exported value
//   getLoginRoute — exported value
//   getNotFoundRoute — exported value
//   getForbiddenRoute — exported value
//   shouldMountMain — exported value
//   getNoMountMainRoutes — exported value
//   getUniqueDomains — exported value
//   validateRoutes — exported value
//   getRoutesInfo — exported value
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
export { routes, ROUTES_SCHEMA, VERSION, MODULE_ID } from './definitions.js';
export { routes as default } from './definitions.js';
export { aliasMap, resolveAlias, routeExists } from './aliases.js';
export { getRouteByIdOrPath, getRouteByPath, getRouteByPage, getRouteById, getRouteByPanel, getRouteByView, getRoutesByTag, getRoutesByDomain, getAllRoutes, getPublicRoutes, getProtectedRoutes, getEnterpriseRoutes, getRoutesByMinLevel, getDefaultRoute, getLoginRoute, getNotFoundRoute, getForbiddenRoute, shouldMountMain, getNoMountMainRoutes, getUniqueDomains } from './helpers.js';
export { validateRoutes, getRoutesInfo } from './validation.js';
import { VERSION } from './definitions.js';
export function getVersion() { return VERSION; }
