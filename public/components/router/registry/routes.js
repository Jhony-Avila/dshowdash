import { routes, ROUTES_SCHEMA, VERSION, MODULE_ID } from "./definitions.js";
import { routes as routes2 } from "./definitions.js";
import { aliasMap, resolveAlias, routeExists } from "./aliases.js";
import { getRouteByIdOrPath, getRouteByPath, getRouteByPage, getRouteById, getRouteByPanel, getRouteByView, getRoutesByTag, getRoutesByDomain, getAllRoutes, getPublicRoutes, getProtectedRoutes, getEnterpriseRoutes, getRoutesByMinLevel, getDefaultRoute, getLoginRoute, getNotFoundRoute, getForbiddenRoute, shouldMountMain, getNoMountMainRoutes, getUniqueDomains } from "./helpers.js";
import { validateRoutes, getRoutesInfo } from "./validation.js";
import { VERSION as VERSION2 } from "./definitions.js";
function getVersion() {
  return VERSION2;
}
export {
  MODULE_ID,
  ROUTES_SCHEMA,
  VERSION,
  aliasMap,
  routes2 as default,
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
  getRoutesByTag,
  getRoutesInfo,
  getUniqueDomains,
  getVersion,
  resolveAlias,
  routeExists,
  routes,
  shouldMountMain,
  validateRoutes
};
