// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-global
// PURPOSE: Router Global - Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   routerStore from /components/router/state/store.js
//   routerTelemetry from /components/router/telemetry/tracker.js
//   RouteResolver from /components/router/core/resolver.js
//   HistoryManager from /components/router/core/history.js
//   RouteGuard from /components/router/core/guard.js
//   RouteTransitions from /components/router/core/transitions.js
//   AUTH_EVENTS, ROUTER_EVENTS from /core/runtime/events/index.js
//   getRoutesInfo from /components/router/registry/validation.js
//   getGlobalStateStatus, getAuthEventsStatus, retryGlobalStateIntegration, retryAuthEventIntegration from ./integrations.js
//   getConfig, contractsValid from ./lifecycle.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   createDebugObject() — exported function
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
import { routerStore as _routerStore } from '/components/router/state/store.js';
const routerStore = _routerStore as any;
import { routerTelemetry } from '/components/router/telemetry/tracker.js';
import { RouteResolver } from '/components/router/core/resolver.js';
import { HistoryManager as _HistoryManager } from '/components/router/core/history.js';
const HistoryManager = _HistoryManager as any;
import { RouteGuard } from '/components/router/core/guard.js';
import { RouteTransitions } from '/components/router/core/transitions.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { getRoutesInfo } from '/components/router/registry/validation.js';
import { getGlobalStateStatus, getAuthEventsStatus, retryGlobalStateIntegration, retryAuthEventIntegration } from './integrations.js';
import { getConfig, contractsValid } from './lifecycle.js';

export const VERSION = '3.3.0-P18EC';
export const MODULE_ID = 'router-global';

declare function getContractsInfo(): Record<string, unknown>;

interface RouterGlobalRef {
  isInitialized: boolean;
  isDestroyed: boolean;
  isReady: () => boolean;
  [key: string]: unknown;
}

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function getStatus(routerGlobal: RouterGlobalRef) {
  const gsStatus = getGlobalStateStatus();
  const aeStatus = getAuthEventsStatus();
  return { version: VERSION, moduleId: MODULE_ID, initialized: routerGlobal.isInitialized, destroyed: routerGlobal.isDestroyed, ready: routerGlobal.isReady(), contractsValid, config: getConfig(), currentRoute: routerStore.getCurrentRoute() ? routerStore.getCurrentRoute().path : null, currentVirtualRoute: routerStore.getVirtualRoute(), previousRoute: routerStore.getPreviousRoute() ? routerStore.getPreviousRoute().path : null, attemptedRoute: routerStore.getAttemptedRoute() ? routerStore.getAttemptedRoute().path : null, isNavigating: routerStore.isNavigating(), error: routerStore.getError(), globalStateConnected: gsStatus.connected, globalStateRetryCount: gsStatus.retryCount, authEventsConnected: aeStatus.connected, authEventRetryCount: aeStatus.retryCount, portsStatus: { initialized: Ports.isInitialized() } };
}

export function healthCheck(routerGlobal: RouterGlobalRef) {
  _initPorts();
  const issues = [];
  let score = 0;
  const maxScore = 8;
  const gsStatus = getGlobalStateStatus();
  const aeStatus = getAuthEventsStatus();
  const globalState = _getPort('globalState');
  const eventBus = _getPort('eventBus');
  const permissionsGuard = _getPort('permissionsGuard');
  if (routerGlobal.isInitialized) score++; else issues.push({ type: 'not-initialized', severity: 'error' });
  if (!routerGlobal.isDestroyed) score++; else issues.push({ type: 'destroyed', severity: 'error' });
  if (HistoryManager.isInitialized) score++; else issues.push({ type: 'history-not-initialized', severity: 'error' });
  if (contractsValid) score++; else issues.push({ type: 'contracts-invalid', severity: 'warning' });
  if (globalState) { if (gsStatus.connected) score++; else issues.push({ type: 'globalstate-not-connected', severity: 'warning' }); } else score++;
  if (eventBus) { if (aeStatus.connected) score++; else issues.push({ type: 'auth-events-not-connected', severity: 'warning' }); } else score++;
  if (routerStore.getCurrentRoute()) score++; else issues.push({ type: 'no-current-route', severity: 'warning' });
  if (!routerStore.getError()) score++; else issues.push({ type: 'has-error', error: routerStore.getError(), severity: 'warning' });
  const result = { status: score === maxScore ? 'HEALTHY' : (score >= 6 ? 'DEGRADED' : 'UNHEALTHY'), score: `${score}/${maxScore}`, healthy: issues.filter(i => i.severity === 'error').length === 0, version: VERSION, moduleId: MODULE_ID, initialized: routerGlobal.isInitialized, destroyed: routerGlobal.isDestroyed, ready: routerGlobal.isReady(), contractsValid, globalStateConnected: gsStatus.connected, authEventsConnected: aeStatus.connected, historyInitialized: HistoryManager.isInitialized, permissionsGuardAvailable: !!(permissionsGuard && permissionsGuard.canAccessRoute), routesValid: getRoutesInfo().validation.valid, issues: issues.length > 0 ? issues : null, portsStatus: { initialized: Ports.isInitialized() }, timestamp: Date.now() };
  if (routerTelemetry.trackHealthCheck) routerTelemetry.trackHealthCheck(result);
  return result;
}

export function info(routerGlobal: RouterGlobalRef) {
  _initPorts();
  const eventBus = _getPort('eventBus');

  // @ts-expect-error TS migration - TS2339
  return { name: MODULE_ID, version: VERSION, moduleId: MODULE_ID, initialized: routerGlobal.isInitialized, ready: routerGlobal.isReady(), config: getConfig(), currentRoute: routerStore.getCurrentRoute() ? routerStore.getCurrentRoute().path : null, currentVirtualRoute: routerStore.getVirtualRoute(), state: routerStore.getStatus(), contracts: getContractsInfo(), routes: getRoutesInfo(), guard: RouteGuard.getStatus(), history: HistoryManager.getStatus(), resolver: RouteResolver.getStatus(), transitions: RouteTransitions.getStatus(), telemetry: routerTelemetry.getStatus(), integrations: { globalStateConnected: getGlobalStateStatus().connected, authEventsConnected: getAuthEventsStatus().connected, eventBusAvailable: !!eventBus }, portsStatus: { initialized: Ports.isInitialized() }, capabilities: ['navigation', 'guards', 'hooks', 'history', 'globalstate', 'auth-events', 'telemetry', 'health-check', 'circuit-breaker', 'retry', 'abort-controller'] };
}

export function createDebugObject(routerGlobal: RouterGlobalRef) {

  // @ts-expect-error TS migration - TS2339
  return { getStore() { return routerStore.getSnapshot(); }, getStoreStatus() { return routerStore.getStatus(); }, getVirtualRoute() { return routerStore.getVirtualRoute(); }, getMetrics() { return routerTelemetry.getMetrics(); }, getGuardStatus() { return RouteGuard.getStatus(); }, getHistoryStatus() { return HistoryManager.getStatus(); }, getResolverStatus() { return RouteResolver.getStatus(); }, getTransitionsStatus() { return RouteTransitions.getStatus(); }, getContractsInfo() { return getContractsInfo(); }, getRoutesInfo() { return getRoutesInfo(); }, getAuthEvents() { return AUTH_EVENTS; }, getRouterEvents() { return ROUTER_EVENTS; }, getEventLog() { return routerTelemetry.getEventLog(); }, getRecentEvents(n) { return routerTelemetry.getRecentEvents(n); }, getConfig() { return getConfig(); }, getPorts() { return getPorts(); }, retryGlobalState: retryGlobalStateIntegration, retryAuthEvents() { return retryAuthEventIntegration(() => routerGlobal); } };
}

export default { getStatus, healthCheck, info, createDebugObject, injectPorts, getPorts, VERSION, MODULE_ID };
