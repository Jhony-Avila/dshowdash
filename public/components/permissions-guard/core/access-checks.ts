// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-guard-core-access-checks
// PURPOSE: Permissions Guard - Access Checks v5.1.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERMISSIONS_EVENTS from /core/runtime/events/index.js
//   _metrics from ./logger.js
//   permissionsStore from ../state/store.js
//   * as Tracker from ../telemetry/tracker.js
//   * as Helpers from ../utils/helpers.js
//   getRoutePolicy from ../registry/routes.js
//   getModuleActionPolicy from ../registry/modules.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   canAccessRoute() — exported function
//   canAccessModuleAction() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { _metrics as _metricsImport } from './logger.js';
const _metrics = _metricsImport as any;
import { permissionsStore } from '../state/store.js';
import * as Tracker from '../telemetry/tracker.js';
import * as Helpers from '../utils/helpers.js';
import { getRoutePolicy } from '../registry/routes.js';
import { getModuleActionPolicy } from '../registry/modules.js';

export function canAccessRoute(routePath: string) {
  _metrics.routeChecks++;
  const policy = getRoutePolicy(routePath);
  Tracker.track(PERMISSIONS_EVENTS.ROUTE_CHECK, { route: routePath, hasPolicy: !!policy });
  if (!policy || policy.public === true) { _metrics.allowed++; Tracker.track(PERMISSIONS_EVENTS.ROUTE_ALLOWED, { route: routePath, reason: 'public' }); return true; }
  const userRoles = Helpers.expandRolesWithInheritance(permissionsStore.getRoles());
  const userLevel = permissionsStore.getUserLevel();
  const hasRole = policy.roles.some((role: string) => userRoles.includes(role));
  const hasLevel = userLevel >= (policy.minLevel || 0);
  const allowed = hasRole && hasLevel;
  if (allowed) { _metrics.allowed++; Tracker.track(PERMISSIONS_EVENTS.ROUTE_ALLOWED, { route: routePath }); }
  else { _metrics.denied++; Tracker.track(PERMISSIONS_EVENTS.ROUTE_DENIED, { route: routePath, hasRole, hasLevel }); }
  return allowed;
}

export function canAccessModuleAction(moduleId: string, action = 'view') {
  _metrics.moduleChecks++;
  const policy = getModuleActionPolicy(moduleId, action);
  Tracker.track(PERMISSIONS_EVENTS.MODULE_CHECK, { moduleId, action, hasPolicy: !!policy });

  // @ts-expect-error TS migration - TS2339
  if (!policy || policy.public === true) { _metrics.allowed++; Tracker.track(PERMISSIONS_EVENTS.MODULE_ALLOWED, { moduleId, action, reason: 'public' }); return true; }
  const userRoles = Helpers.expandRolesWithInheritance(permissionsStore.getRoles());
  const userLevel = permissionsStore.getUserLevel();
  const hasRole = (policy.roles as string[])?.some((role: string) => userRoles.includes(role)) ?? true;
  const hasLevel = userLevel >= ((policy.minLevel as number) || 0);
  const allowed = hasRole && hasLevel;
  if (allowed) { _metrics.allowed++; Tracker.track(PERMISSIONS_EVENTS.MODULE_ALLOWED, { moduleId, action }); }
  else { _metrics.denied++; Tracker.track(PERMISSIONS_EVENTS.MODULE_DENIED, { moduleId, action, hasRole, hasLevel }); }
  return allowed;
}

export const MODULE_ID = 'permissions-guard-core-access-checks';
export const VERSION = '5.1.0-P18EC';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
