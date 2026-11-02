// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: modules.global-state.core.diagnostics
// PURPOSE: Global State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ./logger.js
//   from ../api/contracts.js
//   from ../state/actions.js
//   from ../state/selectors.js
//   from ../utils/validators.js
//   from ../utils/middleware.js
//   from ../telemetry/tracker.js
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   getStatus
//   healthCheck
//   info
//   createDebugObject
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID, VERSION } from './logger.js';
import GlobalStateContracts from '../api/contracts.js';
import StateActions from '../state/actions.js';
import StateSelectors from '../state/selectors.js';
import StateValidators from '../utils/validators.js';
import StateMiddleware from '../utils/middleware.js';
import GlobalStateTelemetry from '../telemetry/tracker.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { GLOBAL_STATE_EVENTS } from '/core/runtime/events/catalog/state.events.js';

function getStatus(manager: Record<string, unknown>) {
  const m: any = manager;
  const baseStatus = { initialized: m.isInitialized, authEventsConnected: m.authEventsConnected, eventBusRetryCount: m.eventBusRetryCount, version: VERSION };
  const storeHealth = m.store.healthCheck();
  return Object.assign({}, baseStatus, storeHealth);
}

function healthCheck(manager: Record<string, unknown>) {
  const m: any = manager;
  const storeHealth = m.store.healthCheck();
  const subscriberCount = m.store.getSubscriberCount();
  const checks = {
    initialized: m.isInitialized,
    storeHealthy: storeHealth.healthy,
    authEventsConnected: m.authEventsConnected,
    eventBusAvailable: storeHealth.checks && storeHealth.checks.hasEventBus ? storeHealth.checks.hasEventBus : false,
    subscribersHealthy: subscriberCount < 50,
    sessionValid: storeHealth.checks && storeHealth.checks.sessionValid ? storeHealth.checks.sessionValid : false
  };
  let passed = 0;
  let total = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) { total++; if ((checks as Record<string, unknown>)[keys[i]]) passed++; }
  const status = passed === total ? 'HEALTHY' : (passed >= 4 ? 'DEGRADED' : 'UNHEALTHY');
  return { status, score: `${passed}/${total}`, healthy: passed >= 5, checks, storeHealth, version: VERSION, moduleId: MODULE_ID, subscriberCount, p24Instrumented: true, timestamp: Date.now() };
}

function info(manager: Record<string, unknown>) {
  const m: any = manager;
  const state: any = m.getState();
  const session = state.session || {};
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    isInitialized: m.isInitialized,
    authEventsConnected: m.authEventsConnected,
    eventBusRetryCount: m.eventBusRetryCount,
    authEventsSource: '/core/runtime/events/index.js',
    contractsSource: './api/contracts.js',
    subscriberCount: m.store.getSubscriberCount(),
    session: { isAuthenticated: session.isAuthenticated || false, hasUser: !!session.user, hasUserId: !!session.userId },
    eventBusConnected: !!m.store.eventBus,
    storeInfo: m.store.info(),
    telemetryStats: m.telemetry.getTrackerStats(),
    subModules: { contracts: GlobalStateContracts.VERSION, store: 'GlobalStateStore', actions: StateActions.VERSION, selectors: StateSelectors.VERSION, validators: StateValidators.VERSION, middleware: StateMiddleware.VERSION, telemetry: GlobalStateTelemetry.VERSION },
    p24Instrumented: true,
    timestamp: Date.now()
  };
}

function createDebugObject(manager: Record<string, unknown>) {
  const m: any = manager;
  return {
    getAuthEvents() { return AUTH_EVENTS; },
    getGlobalStateEvents() { return GLOBAL_STATE_EVENTS; },
    getState() { return m.getState(); },
    getSession() { return m.select(m.selectors.getSession); },
    getAuthContext() { return m.select(m.selectors.getAuthContext); },
    getEventLog() { return m.telemetry.getEventLog(); },
    getRecentEvents(n: number) { return m.telemetry.getRecentEvents(n); },
    retryAuthIntegration() { return m.retryAuthIntegration(); }
  };
}

export { getStatus, healthCheck, info, createDebugObject };
export default { getStatus, healthCheck, info, createDebugObject };
