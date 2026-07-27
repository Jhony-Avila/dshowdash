// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: csrf-token-manager
// PURPOSE: /components/security/csrf-token-manager/core/lifecycle.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   csrfStore from ../state/store.js
//   initTracker, trackSecurityEvent, getTrackerStats, SECURITY_EVENTS from ../telemetry/tracker.js
//   getStatus, isFresh from ./csrf-core.js
//   getHeadersInfo from ./auth-core.js
//   isBrowser, getTimestamp from ../utils/helpers.js
//   initLogger, logInfo, logError from ../utils/logger.js
//   getBridgeInfo from ../infra/event-bridge.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   isInitialized() — exported function
//   isReady() — exported function
//   shutdown() — exported function
//   reset() — exported function
//   getLifecycleStatus() — exported function
//   info() — exported function
//   getDiagnostics() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { csrfStore } from '../state/store.js';
import { initTracker, trackSecurityEvent, getTrackerStats, SECURITY_EVENTS } from '../telemetry/tracker.js';
import { getStatus, isFresh } from './csrf-core.js';
import { getHeadersInfo } from './auth-core.js';
import { isBrowser, getTimestamp } from '../utils/helpers.js';
import { initLogger, logInfo, logError } from '../utils/logger.js';
import { getBridgeInfo } from '../infra/event-bridge.js';

export const MODULE_ID = 'csrf-token-manager';
export const VERSION = '1.2.0-ENTERPRISE';

const lifecycle: { initialized: boolean; initCount: number; lastInit: number | null; shutdownCount: number } = { initialized: false, initCount: 0, lastInit: null, shutdownCount: 0 };

export function init(config = {}, deps : Record<string, unknown> = {}) {
  try {
    initLogger(config);

    if (lifecycle.initialized) { csrfStore.init(config, deps); initTracker(config); logInfo('Lifecycle', `SecurityCSRF reused (init #${lifecycle.initCount})`); return true; }
    csrfStore.init(config, deps); initTracker(config);
    lifecycle.initialized = true; lifecycle.initCount++; lifecycle.lastInit = getTimestamp();
    trackSecurityEvent(SECURITY_EVENTS.MODULE_INIT, { version: VERSION, initCount: lifecycle.initCount, hasTokenStore: !!deps.tokenStore, hasEventBus: !!deps.eventBus, authEventsIntegrated: true });
    logInfo('Lifecycle', `SecurityCSRF ${VERSION} initialized (AUTH_EVENTS integrated)`, { initCount: lifecycle.initCount });
    return true;
  } catch (err: any) { logError('Lifecycle', 'init failed', err); return false; }
}

export function isInitialized() { return lifecycle.initialized && csrfStore.isInitialized(); }
export function isReady() { return isInitialized() && isBrowser(); }

export function shutdown() {
  try {

    if (!lifecycle.initialized) { logInfo('Lifecycle', 'SecurityCSRF already shutdown'); return true; }
    trackSecurityEvent(SECURITY_EVENTS.MODULE_SHUTDOWN, { version: VERSION, uptime: lifecycle.lastInit ? getTimestamp() - lifecycle.lastInit : 0 });
    csrfStore.reset(); lifecycle.initialized = false; lifecycle.shutdownCount++;

    logInfo('Lifecycle', 'SecurityCSRF shutdown complete'); return true;
  } catch (err: any) { logError('Lifecycle', 'shutdown failed', err); return false; }
}

export function reset() {

  try { csrfStore.clearToken(); trackSecurityEvent(SECURITY_EVENTS.MODULE_RESET, { version: VERSION }); logInfo('Lifecycle', 'SecurityCSRF reset complete'); return true; }
  catch (err: any) { logError('Lifecycle', 'reset failed', err); return false; }
}

export function getLifecycleStatus() { return { initialized: lifecycle.initialized, initCount: lifecycle.initCount, lastInit: lifecycle.lastInit, shutdownCount: lifecycle.shutdownCount, uptime: lifecycle.lastInit ? getTimestamp() - lifecycle.lastInit : 0 }; }

export function info() {
  try {
    const csrfStatus = getStatus(); const headersInfo = getHeadersInfo(); const storeStats = csrfStore.getStats(); const trackerStats = getTrackerStats(); const config = csrfStore.getConfig(); const bridgeInfo = getBridgeInfo(); const deps = csrfStore.getDeps();
    return { moduleId: MODULE_ID, version: VERSION, lifecycle: getLifecycleStatus(), csrf: csrfStatus, headers: headersInfo, config: { namespace: config.namespace, context: config.context, maxAge: config.maxAge, debug: config.debug, autoRenew: config.autoRenew }, stats: storeStats, telemetry: trackerStats, integrations: { eventBus: !!deps.eventBus, globalState: bridgeInfo.hasGlobalState, tokenStore: !!deps.tokenStore, authEventsIntegrated: true }, bridge: bridgeInfo, isBrowser: isBrowser() };
  } catch (err: any) { logError('Lifecycle', 'info failed', err); return { moduleId: MODULE_ID, version: VERSION, error: err.message }; }
}

export function getDiagnostics() { return { moduleId: MODULE_ID, version: VERSION, isReady: isReady(), isInitialized: isInitialized(), hasCsrfToken: getStatus().hasToken, isFresh: isFresh(), authEventsIntegrated: true }; }

export function healthCheck() {
  const checks = { moduleInitialized: false, storeReady: false, hasToken: false, tokenFresh: false, configValid: false, browserEnv: false, authEventsAvailable: false };
  try {
    checks.moduleInitialized = lifecycle.initialized; checks.storeReady = csrfStore.isInitialized(); checks.browserEnv = isBrowser();
    const status = getStatus(); checks.hasToken = status.hasToken; checks.tokenFresh = status.hasToken && !status.isStale;
    const config = csrfStore.getConfig(); checks.configValid = !!(config.namespace && Number(config.maxAge) > 0);
    checks.authEventsAvailable = typeof window !== 'undefined';
  } catch (err: any) { logError('Lifecycle', 'healthCheck failed', err); }
  const passed = Object.values(checks).filter(v => v === true).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : (passed >= 5 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, checks, version: VERSION, timestamp: Date.now() };
}

export default { init, isInitialized, isReady, shutdown, reset, getLifecycleStatus, info, getDiagnostics, healthCheck, MODULE_ID, VERSION };
