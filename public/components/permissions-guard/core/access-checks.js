import { PERMISSIONS_EVENTS } from "/core/runtime/events/catalog/permissions.events.js";
import { _metrics as _metricsImport } from "./logger.js";
const _metrics = _metricsImport;
import { permissionsStore } from "../state/store.js";
import * as Tracker from "../telemetry/tracker.js";
import * as Helpers from "../utils/helpers.js";
import { getRoutePolicy } from "../registry/routes.js";
import { getModuleActionPolicy } from "../registry/modules.js";
function canAccessRoute(routePath) {
  _metrics.routeChecks++;
  const policy = getRoutePolicy(routePath);
  Tracker.track(PERMISSIONS_EVENTS.ROUTE_CHECK, { route: routePath, hasPolicy: !!policy });
  if (!policy || policy.public === true) {
    _metrics.allowed++;
    Tracker.track(PERMISSIONS_EVENTS.ROUTE_ALLOWED, { route: routePath, reason: "public" });
    return true;
  }
  const userRoles = Helpers.expandRolesWithInheritance(permissionsStore.getRoles());
  const userLevel = permissionsStore.getUserLevel();
  const hasRole = policy.roles.some((role) => userRoles.includes(role));
  const hasLevel = userLevel >= (policy.minLevel || 0);
  const allowed = hasRole && hasLevel;
  if (allowed) {
    _metrics.allowed++;
    Tracker.track(PERMISSIONS_EVENTS.ROUTE_ALLOWED, { route: routePath });
  } else {
    _metrics.denied++;
    Tracker.track(PERMISSIONS_EVENTS.ROUTE_DENIED, { route: routePath, hasRole, hasLevel });
  }
  return allowed;
}
function canAccessModuleAction(moduleId, action = "view") {
  _metrics.moduleChecks++;
  const policy = getModuleActionPolicy(moduleId, action);
  Tracker.track(PERMISSIONS_EVENTS.MODULE_CHECK, { moduleId, action, hasPolicy: !!policy });
  if (!policy || policy.public === true) {
    _metrics.allowed++;
    Tracker.track(PERMISSIONS_EVENTS.MODULE_ALLOWED, { moduleId, action, reason: "public" });
    return true;
  }
  const userRoles = Helpers.expandRolesWithInheritance(permissionsStore.getRoles());
  const userLevel = permissionsStore.getUserLevel();
  const hasRole = policy.roles?.some((role) => userRoles.includes(role)) ?? true;
  const hasLevel = userLevel >= (policy.minLevel || 0);
  const allowed = hasRole && hasLevel;
  if (allowed) {
    _metrics.allowed++;
    Tracker.track(PERMISSIONS_EVENTS.MODULE_ALLOWED, { moduleId, action });
  } else {
    _metrics.denied++;
    Tracker.track(PERMISSIONS_EVENTS.MODULE_DENIED, { moduleId, action, hasRole, hasLevel });
  }
  return allowed;
}
const MODULE_ID = "permissions-guard-core-access-checks";
const VERSION = "5.1.0-P18EC";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  canAccessModuleAction,
  canAccessRoute,
  healthCheck,
  info
};
