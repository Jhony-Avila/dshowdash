import { routes as definedRoutes } from "./definitions/index.js";
const VERSION = "2.4.0-AUTO-INIT";
const MODULE_ID = "router:registry:helpers";
let _routesRegistry = definedRoutes || null;
function setRoutesRegistry(registry) {
  _routesRegistry = registry;
}
function getAllRoutes() {
  if (!_routesRegistry) return [];
  if (typeof _routesRegistry.getAll === "function") return _routesRegistry.getAll();
  if (Array.isArray(_routesRegistry)) return _routesRegistry;
  if (typeof _routesRegistry === "object") return Object.entries(_routesRegistry).map(([path, config]) => ({ path, ...config }));
  return [];
}
function getRouteByPath(path) {
  const routes = getAllRoutes();
  return routes.find((route) => route.path === path) || null;
}
function getRouteById(id) {
  const routes = getAllRoutes();
  return routes.find((route) => route.id === id) || null;
}
function getRouteByIdOrPath(idOrPath) {
  return getRouteById(idOrPath) || getRouteByPath(idOrPath) || null;
}
function getRouteByPage(page) {
  const routes = getAllRoutes();
  return routes.find((route) => route.page === page) || null;
}
function getRouteByPanel(panel) {
  const routes = getAllRoutes();
  return routes.find((route) => route.panel === panel) || null;
}
function getRouteByView(view) {
  const routes = getAllRoutes();
  return routes.find((route) => route.view === view || route.defaultView === view) || null;
}
function getRoutesByTag(tag) {
  const routes = getAllRoutes();
  return routes.filter((route) => route.tags?.includes(tag));
}
function getRoutesByDomain(domain) {
  const routes = getAllRoutes();
  return routes.filter((route) => route.domain === domain);
}
const getRoutesByMinLevel = (userLevel, userTriggers = []) => {
  const routes = getAllRoutes();
  return routes.filter((route) => {
    if (route.public) return true;
    if (route.uarps_trigger && userTriggers.length > 0) {
      return userTriggers.includes(route.uarps_trigger);
    }
    const minLevel = route.minLevel || 0;
    return userLevel >= minLevel;
  });
};
const getRoutesByUARPS = (userTriggers = []) => {
  const routes = getAllRoutes();
  return routes.filter((route) => {
    if (route.public) return true;
    if (!route.uarps_trigger) return true;
    return userTriggers.includes(route.uarps_trigger);
  });
};
function getPublicRoutes() {
  const routes = getAllRoutes();
  return routes.filter((route) => route.public === true);
}
function getProtectedRoutes() {
  const routes = getAllRoutes();
  return routes.filter((route) => !route.public);
}
function getEnterpriseRoutes() {
  const routes = getAllRoutes();
  return routes.filter((route) => route.panel || route.enterprise || route.minLevel >= 50);
}
function getDefaultRoute() {
  const routes = getAllRoutes();
  return routes.find((route) => route.path === "/" || route.isDefault) || routes[0] || null;
}
function getLoginRoute() {
  const routes = getAllRoutes();
  return routes.find((route) => route.path === "/login" || route.id === "login") || null;
}
function getNotFoundRoute() {
  const routes = getAllRoutes();
  return routes.find((route) => route.path === "/404" || route.id === "404" || route.id === "not-found") || null;
}
function getForbiddenRoute() {
  const routes = getAllRoutes();
  return routes.find((route) => route.path === "/forbidden" || route.path === "/403" || route.id === "forbidden") || null;
}
function shouldMountMain(path) {
  const route = getRouteByPath(path);
  if (!route) return true;
  return route.mountMain !== false;
}
function getNoMountMainRoutes() {
  const routes = getAllRoutes();
  return routes.filter((route) => route.mountMain === false).map((route) => route.path || route.id);
}
function getUniqueDomains() {
  const routes = getAllRoutes();
  const domains = /* @__PURE__ */ new Set();
  routes.forEach((route) => {
    if (route.domain) domains.add(route.domain);
  });
  return [...domains];
}
function matchRoute(path) {
  const routes = getAllRoutes();
  const exact = routes.find((route) => route.path === path);
  if (exact) return { route: exact, params: {} };
  for (const route of routes) {
    const params = matchPathParams(route.path, path);
    if (params) return { route, params };
  }
  return null;
}
function matchPathParams(routePath, actualPath) {
  if (!routePath || !actualPath) return null;
  const routeParts = routePath.split("/").filter(Boolean);
  const actualParts = actualPath.split("/").filter(Boolean);
  if (routeParts.length !== actualParts.length) return null;
  const params = {};
  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    const actualPart = actualParts[i];
    if (routePart.startsWith(":")) {
      params[routePart.slice(1)] = actualPart;
    } else if (routePart !== actualPart) {
      return null;
    }
  }
  return params;
}
function buildRoutePath(routeId, params = {}) {
  const route = getRouteById(routeId);
  if (!route) return null;
  let path = route.path;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, value);
  }
  return path;
}
function getRoutesBySection(section) {
  const routes = getAllRoutes();
  return routes.filter((route) => route.section === section);
}
function healthCheck() {
  return {
    status: _routesRegistry !== null ? "HEALTHY" : "UNHEALTHY",
    registrySet: _routesRegistry !== null,
    autoInitialized: _routesRegistry === definedRoutes,
    totalRoutes: getAllRoutes().length,
    publicRoutes: getPublicRoutes().length,
    protectedRoutes: getProtectedRoutes().length,
    enterpriseRoutes: getEnterpriseRoutes().length,
    version: VERSION,
    moduleId: MODULE_ID
  };
}
function getVersion() {
  return VERSION;
}
var helpers_default = {
  VERSION,
  MODULE_ID,
  setRoutesRegistry,
  getAllRoutes,
  getRouteByPath,
  getRouteById,
  getRouteByIdOrPath,
  getRouteByPage,
  getRouteByPanel,
  getRouteByView,
  getRoutesByTag,
  getRoutesByDomain,
  getRoutesByMinLevel,
  getRoutesByUARPS,
  getPublicRoutes,
  getProtectedRoutes,
  getEnterpriseRoutes,
  getDefaultRoute,
  getLoginRoute,
  getNotFoundRoute,
  getForbiddenRoute,
  shouldMountMain,
  getNoMountMainRoutes,
  getUniqueDomains,
  matchRoute,
  buildRoutePath,
  getRoutesBySection,
  healthCheck,
  getVersion
};
export {
  MODULE_ID,
  VERSION,
  buildRoutePath,
  helpers_default as default,
  getAllRoutes,
  getDefaultRoute,
  getEnterpriseRoutes,
  getForbiddenRoute,
  getLoginRoute,
  getNoMountMainRoutes,
  getNotFoundRoute,
  getProtectedRoutes,
  getPublicRoutes,
  getRouteById,
  getRouteByIdOrPath,
  getRouteByPage,
  getRouteByPanel,
  getRouteByPath,
  getRouteByView,
  getRoutesByDomain,
  getRoutesByMinLevel,
  getRoutesBySection,
  getRoutesByTag,
  getRoutesByUARPS,
  getUniqueDomains,
  getVersion,
  healthCheck,
  matchRoute,
  setRoutesRegistry,
  shouldMountMain
};
