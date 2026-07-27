import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.5.0-P17WI";
const MODULE_ID = "security.csrf-token-manager.diagnostics.csrf-diagnostics";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const log = { info(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, warn(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, error(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, debug(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
import { csrfStore } from "../state/store.js";
import { getStatus, getToken } from "../core/csrf-core.js";
import { getHeadersInfo, getHeaders, getAuthHeaders } from "../core/auth-core.js";
import { info, getDiagnostics, getLifecycleStatus, healthCheck, VERSION as LIFECYCLE_VERSION, MODULE_ID as LIFECYCLE_MODULE_ID } from "../core/lifecycle.js";
import { getRecentEvents, getTrackerStats, clearEvents } from "../telemetry/tracker.js";
import { getInterceptorInfo } from "../infra/axios-interceptor.js";
import { getBridgeInfo } from "../infra/event-bridge.js";
import { maskToken } from "../utils/helpers.js";
function dumpStatus() {
  try {
    const data = { module: getDiagnostics(), csrfStatus: getStatus(), headersInfo: getHeadersInfo(), config: csrfStore.getConfig(), stats: csrfStore.getStats(), integrations: { axios: getInterceptorInfo(), bridge: getBridgeInfo() }, telemetry: getTrackerStats(), health: healthCheck() };
    log.debug("dumpStatus executed", { sections: Object.keys(data) });
    return data;
  } catch (err) {
    log.error("dumpStatus failed", { error: err.message });
    return null;
  }
}
function quickStatus() {
  const status = getStatus();
  const lifecycle = getLifecycleStatus();
  const health = healthCheck();
  return { version: LIFECYCLE_VERSION, ready: lifecycle.initialized, health: health.status, hasToken: status.hasToken, isStale: status.isStale, age: status.age ? `${Math.round(status.age / 1e3)}s` : "N/A", preview: status.tokenPreview };
}
function testHeaders() {
  const result = { csrf: getHeaders(), auth: getAuthHeaders(), info: getHeadersInfo() };
  log.debug("testHeaders executed", { hasCSRF: !!result.csrf, hasAuth: !!result.auth });
  return result;
}
function showRecentEvents(limit) {
  if (!limit) limit = 10;
  const events = getRecentEvents(limit);
  log.debug("showRecentEvents", { limit, count: events.length });
  return events;
}
function registerWindowDebugHook() {
  if (!hasWindow) return false;
  try {
    window.CSRF_DEBUG = { dump: dumpStatus, quick: quickStatus, status: getStatus, headers: testHeaders, headersInfo: getHeadersInfo, events: showRecentEvents, health: healthCheck, info, clearEvents, getToken() {
      return maskToken(getToken());
    }, version: LIFECYCLE_VERSION, moduleId: LIFECYCLE_MODULE_ID };
    log.info("Debug hooks registered", { version: LIFECYCLE_VERSION });
    return true;
  } catch (err) {
    log.error("registerWindowDebugHook failed", { error: err.message });
    return false;
  }
}
function unregisterWindowDebugHook() {
  if (!hasWindow) return;
  try {
    delete window.CSRF_DEBUG;
    log.debug("Debug hooks unregistered");
  } catch (e) {
  }
}
var csrf_diagnostics_default = { dumpStatus, quickStatus, testHeaders, showRecentEvents, registerWindowDebugHook, unregisterWindowDebugHook, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  csrf_diagnostics_default as default,
  dumpStatus,
  getPorts,
  injectPorts,
  quickStatus,
  registerWindowDebugHook,
  showRecentEvents,
  testHeaders,
  unregisterWindowDebugHook
};
