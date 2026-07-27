// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.registry.definitions.index
// PURPOSE: Router Definitions - Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   VERSION as CONST_VERSION, ROUTES_SCHEMA, DOMAINS, LAYOUTS from ./constants.js
//   dashboardRoutes from ./routes-dashboard.js
//   businessRoutes from ./routes-business.js
//   integrationRoutes from ./routes-integrations.js
//   adminRoutes from ./routes-admin.js
//   systemRoutes from ./routes-system.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   routes — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getRouteById() — exported function
//   getRouteByPath() — exported function
//   getRoutesByDomain() — exported function
//   getRoutesByTag() — exported function
//   getPublicRoutes() — exported function
//   getProtectedRoutes() — exported function
//   getAllAliases() — exported function
//   resolveAlias() — exported function
//   getRouteCount() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   ROUTES_SCHEMA — exported value
//   DOMAINS — exported value
//   LAYOUTS — exported value
//   dashboardRoutes — exported value
//   businessRoutes — exported value
//   integrationRoutes — exported value
//   adminRoutes — exported value
//   systemRoutes — exported value
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { VERSION as CONST_VERSION, ROUTES_SCHEMA, DOMAINS, LAYOUTS } from './constants.js';
import { dashboardRoutes } from './routes-dashboard.js';
import { businessRoutes } from './routes-business.js';
import { integrationRoutes } from './routes-integrations.js';
import { adminRoutes } from './routes-admin.js';
import { systemRoutes } from './routes-system.js';
export const VERSION = '6.1.0-P17WI';
export const MODULE_ID = 'router.registry.definitions.index';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export const routes = Object.freeze({ ...dashboardRoutes, ...businessRoutes, ...integrationRoutes, ...adminRoutes, ...systemRoutes });
export function getRouteById(id: string) { return Object.values(routes).find(r => r.id === id) || null; }
export function getRouteByPath(path: string) { return (routes as Record<string, Record<string, unknown>>)[path] || null; }
export function getRoutesByDomain(domain: string) { return Object.entries(routes).filter(([_, r]) => r.domain === domain).map(([path, route]) => ({ path, ...route })); }
export function getRoutesByTag(tag: string) { return Object.entries(routes).filter(([_, r]) => r.tags?.includes(tag)).map(([path, route]) => ({ path, ...route })); }
export function getPublicRoutes() { return Object.entries(routes).filter(([_, r]) => r.public).map(([path, route]) => ({ path, ...route })); }
export function getProtectedRoutes() { return Object.entries(routes).filter(([_, r]) => r.requiresAuth).map(([path, route]) => ({ path, ...route })); }
export function getAllAliases() { const aliases: Record<string, string> = {}; Object.entries(routes).forEach(([path, route]) => { (route.aliases || []).forEach((alias: string) => { aliases[alias] = path; }); }); return aliases; }
export function resolveAlias(alias: string) { const allAliases = getAllAliases(); return allAliases[alias] || alias; }
export function getRouteCount() { return Object.keys(routes).length; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, routeCount: getRouteCount(), domains: [...new Set(Object.values(routes).map(r => r.domain).filter(Boolean))], publicCount: getPublicRoutes().length, protectedCount: getProtectedRoutes().length, aliasCount: Object.keys(getAllAliases()).length, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { const routeCount = getRouteCount(); const hasRoutes = routeCount > 0; const hasHomeRoute = !!routes['/']; const hasLoginRoute = !!routes['/login']; const has404Route = !!routes['/404']; const score = [hasRoutes, hasHomeRoute, hasLoginRoute, has404Route].filter(Boolean).length; return { status: score === 4 ? 'HEALTHY' : score >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${score}/4`, checks: { hasRoutes, hasHomeRoute, hasLoginRoute, has404Route }, routeCount, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export { ROUTES_SCHEMA, DOMAINS, LAYOUTS };
export { dashboardRoutes } from './routes-dashboard.js';
export { businessRoutes } from './routes-business.js';
export { integrationRoutes } from './routes-integrations.js';
export { adminRoutes } from './routes-admin.js';
export { systemRoutes } from './routes-system.js';
export default routes;
