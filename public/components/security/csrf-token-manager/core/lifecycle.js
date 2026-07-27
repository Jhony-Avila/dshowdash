import { csrfStore } from "../state/store.js";
import { initTracker, trackSecurityEvent, getTrackerStats, SECURITY_EVENTS } from "../telemetry/tracker.js";
import { getStatus, isFresh } from "./csrf-core.js";
import { getHeadersInfo } from "./auth-core.js";
import { isBrowser, getTimestamp } from "../utils/helpers.js";
import { initLogger, logInfo, logError } from "../utils/logger.js";
import { getBridgeInfo } from "../infra/event-bridge.js";
const MODULE_ID = "csrf-token-manager";
const VERSION = "1.2.0-ENTERPRISE";
const lifecycle = { initialized: false, initCount: 0, lastInit: null, shutdownCount: 0 };
function init(config = {}, deps = {}) {
  try {
    initLogger(config);
    if (lifecycle.initialized) {
      csrfStore.init(config, deps);
      initTracker(config);
      logInfo("Lifecycle", `SecurityCSRF reused (init #${lifecycle.initCount})`);
      return true;
    }
    csrfStore.init(config, deps);
    initTracker(config);
    lifecycle.initialized = true;
    lifecycle.initCount++;
    lifecycle.lastInit = getTimestamp();
    trackSecurityEvent(SECURITY_EVENTS.MODULE_INIT, { version: VERSION, initCount: lifecycle.initCount, hasTokenStore: !!deps.tokenStore, hasEventBus: !!deps.eventBus, authEventsIntegrated: true });
    logInfo("Lifecycle", `SecurityCSRF ${VERSION} initialized (AUTH_EVENTS integrated)`, { initCount: lifecycle.initCount });
    return true;
  } catch (err) {
    logError("Lifecycle", "init failed", err);
    return false;
  }
}
function isInitialized() {
  return lifecycle.initialized && csrfStore.isInitialized();
}
function isReady() {
  return isInitialized() && isBrowser();
}
function shutdown() {
  try {
    if (!lifecycle.initialized) {
      logInfo("Lifecycle", "SecurityCSRF already shutdown");
      return true;
    }
    trackSecurityEvent(SECURITY_EVENTS.MODULE_SHUTDOWN, { version: VERSION, uptime: lifecycle.lastInit ? getTimestamp() - lifecycle.lastInit : 0 });
    csrfStore.reset();
    lifecycle.initialized = false;
    lifecycle.shutdownCount++;
    logInfo("Lifecycle", "SecurityCSRF shutdown complete");
    return true;
  } catch (err) {
    logError("Lifecycle", "shutdown failed", err);
    return false;
  }
}
function reset() {
  try {
    csrfStore.clearToken();
    trackSecurityEvent(SECURITY_EVENTS.MODULE_RESET, { version: VERSION });
    logInfo("Lifecycle", "SecurityCSRF reset complete");
    return true;
  } catch (err) {
    logError("Lifecycle", "reset failed", err);
    return false;
  }
}
function getLifecycleStatus() {
  return { initialized: lifecycle.initialized, initCount: lifecycle.initCount, lastInit: lifecycle.lastInit, shutdownCount: lifecycle.shutdownCount, uptime: lifecycle.lastInit ? getTimestamp() - lifecycle.lastInit : 0 };
}
function info() {
  try {
    const csrfStatus = getStatus();
    const headersInfo = getHeadersInfo();
    const storeStats = csrfStore.getStats();
    const trackerStats = getTrackerStats();
    const config = csrfStore.getConfig();
    const bridgeInfo = getBridgeInfo();
    const deps = csrfStore.getDeps();
    return { moduleId: MODULE_ID, version: VERSION, lifecycle: getLifecycleStatus(), csrf: csrfStatus, headers: headersInfo, config: { namespace: config.namespace, context: config.context, maxAge: config.maxAge, debug: config.debug, autoRenew: config.autoRenew }, stats: storeStats, telemetry: trackerStats, integrations: { eventBus: !!deps.eventBus, globalState: bridgeInfo.hasGlobalState, tokenStore: !!deps.tokenStore, authEventsIntegrated: true }, bridge: bridgeInfo, isBrowser: isBrowser() };
  } catch (err) {
    logError("Lifecycle", "info failed", err);
    return { moduleId: MODULE_ID, version: VERSION, error: err.message };
  }
}
function getDiagnostics() {
  return { moduleId: MODULE_ID, version: VERSION, isReady: isReady(), isInitialized: isInitialized(), hasCsrfToken: getStatus().hasToken, isFresh: isFresh(), authEventsIntegrated: true };
}
function healthCheck() {
  const checks = { moduleInitialized: false, storeReady: false, hasToken: false, tokenFresh: false, configValid: false, browserEnv: false, authEventsAvailable: false };
  try {
    checks.moduleInitialized = lifecycle.initialized;
    checks.storeReady = csrfStore.isInitialized();
    checks.browserEnv = isBrowser();
    const status = getStatus();
    checks.hasToken = status.hasToken;
    checks.tokenFresh = status.hasToken && !status.isStale;
    const config = csrfStore.getConfig();
    checks.configValid = !!(config.namespace && Number(config.maxAge) > 0);
    checks.authEventsAvailable = typeof window !== "undefined";
  } catch (err) {
    logError("Lifecycle", "healthCheck failed", err);
  }
  const passed = Object.values(checks).filter((v) => v === true).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 5 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, version: VERSION, timestamp: Date.now() };
}
var lifecycle_default = { init, isInitialized, isReady, shutdown, reset, getLifecycleStatus, info, getDiagnostics, healthCheck, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getDiagnostics,
  getLifecycleStatus,
  healthCheck,
  info,
  init,
  isInitialized,
  isReady,
  reset,
  shutdown
};
