import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTES_SCHEMA, DOMAINS, LAYOUTS } from "./constants.js";
import { dashboardRoutes } from "./routes-dashboard.js";
import { businessRoutes } from "./routes-business.js";
import { integrationRoutes } from "./routes-integrations.js";
import { adminRoutes } from "./routes-admin.js";
import { systemRoutes } from "./routes-system.js";
const VERSION = "6.1.0-P17WI";
const MODULE_ID = "router.registry.definitions.index";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const routes = Object.freeze({ ...dashboardRoutes, ...businessRoutes, ...integrationRoutes, ...adminRoutes, ...systemRoutes });
function getRouteById(id) {
  return Object.values(routes).find((r) => r.id === id) || null;
}
function getRouteByPath(path) {
  return routes[path] || null;
}
function getRoutesByDomain(domain) {
  return Object.entries(routes).filter(([_, r]) => r.domain === domain).map(([path, route]) => ({ path, ...route }));
}
function getRoutesByTag(tag) {
  return Object.entries(routes).filter(([_, r]) => r.tags?.includes(tag)).map(([path, route]) => ({ path, ...route }));
}
function getPublicRoutes() {
  return Object.entries(routes).filter(([_, r]) => r.public).map(([path, route]) => ({ path, ...route }));
}
function getProtectedRoutes() {
  return Object.entries(routes).filter(([_, r]) => r.requiresAuth).map(([path, route]) => ({ path, ...route }));
}
function getAllAliases() {
  const aliases = {};
  Object.entries(routes).forEach(([path, route]) => {
    (route.aliases || []).forEach((alias) => {
      aliases[alias] = path;
    });
  });
  return aliases;
}
function resolveAlias(alias) {
  const allAliases = getAllAliases();
  return allAliases[alias] || alias;
}
function getRouteCount() {
  return Object.keys(routes).length;
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, routeCount: getRouteCount(), domains: [...new Set(Object.values(routes).map((r) => r.domain).filter(Boolean))], publicCount: getPublicRoutes().length, protectedCount: getProtectedRoutes().length, aliasCount: Object.keys(getAllAliases()).length, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  const routeCount = getRouteCount();
  const hasRoutes = routeCount > 0;
  const hasHomeRoute = !!routes["/"];
  const hasLoginRoute = !!routes["/login"];
  const has404Route = !!routes["/404"];
  const score = [hasRoutes, hasHomeRoute, hasLoginRoute, has404Route].filter(Boolean).length;
  return { status: score === 4 ? "HEALTHY" : score >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${score}/4`, checks: { hasRoutes, hasHomeRoute, hasLoginRoute, has404Route }, routeCount, version: VERSION, portsInitialized: Ports.isInitialized() };
}
import { dashboardRoutes as dashboardRoutes2 } from "./routes-dashboard.js";
import { businessRoutes as businessRoutes2 } from "./routes-business.js";
import { integrationRoutes as integrationRoutes2 } from "./routes-integrations.js";
import { adminRoutes as adminRoutes2 } from "./routes-admin.js";
import { systemRoutes as systemRoutes2 } from "./routes-system.js";
var definitions_default = routes;
export {
  DOMAINS,
  LAYOUTS,
  MODULE_ID,
  ROUTES_SCHEMA,
  VERSION,
  adminRoutes2 as adminRoutes,
  businessRoutes2 as businessRoutes,
  dashboardRoutes2 as dashboardRoutes,
  definitions_default as default,
  getAllAliases,
  getPorts,
  getProtectedRoutes,
  getPublicRoutes,
  getRouteById,
  getRouteByPath,
  getRouteCount,
  getRoutesByDomain,
  getRoutesByTag,
  healthCheck,
  info,
  injectPorts,
  integrationRoutes2 as integrationRoutes,
  resolveAlias,
  routes,
  systemRoutes2 as systemRoutes
};
