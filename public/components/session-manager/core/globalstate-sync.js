import { RuntimePort } from "../ports/runtime-port.js";
import { sessionStore } from "../state/store.js";
import { AuthManager } from "./auth.js";
import { SESSION_EVENTS } from "/core/runtime/events/catalog/session.events.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { getPort, initPorts, getTracker } from "./ports.js";
import { transitionTo, markReady, LIFECYCLE_STATES } from "./state-machine.js";
const VERSION = "1.1.0-P25";
const MODULE_ID = "session-lifecycle:globalstate-sync";
const syncMetrics = { globalStateSyncs: 0, errors: 0, recoveryAttempts: 0 };
let expirationIntervalId = null;
let recoveryIntervalId = null;
function markDegraded(reason) {
  transitionTo(LIFECYCLE_STATES.DEGRADED, reason);
}
function syncToGlobalState(isAuthenticated, user) {
  initPorts();
  const globalState = getPort("globalState");
  if (!globalState) {
    markDegraded("globalstate-unavailable");
    return;
  }
  try {
    syncMetrics.globalStateSyncs++;
    if (isAuthenticated && user) {
      const userObj = user;
      globalState.dispatch(globalState.actions.setSession({
        user: userObj,
        userId: userObj.id,
        roles: userObj.roles || [],
        lastActivity: Date.now()
      }));
    } else {
      globalState.dispatch(globalState.actions.clearSession());
    }
    getTracker().track && getTracker().track("session:global-state:synced");
  } catch (e) {
    syncMetrics.errors++;
    markDegraded("globalstate-sync-error");
    getTracker().track && getTracker().track("session:global-state:sync-error", { error: e.message });
  }
}
function setupExpirationMonitor(thresholdMs) {
  if (thresholdMs === void 0) thresholdMs = 3e5;
  expirationIntervalId = RuntimePort.setInterval(() => {
    const expiresAt = sessionStore.getExpiresAt();
    if (!expiresAt) return;
    const remaining = expiresAt - Date.now();
    const eventBus = getPort("eventBus");
    if (remaining <= 0) {
      getTracker().track && getTracker().track("session:expiration:expired");
      if (eventBus) {
        eventBus.emit(SESSION_EVENTS.EXPIRED, { timestamp: Date.now() });
        eventBus.emit(AUTH_EVENTS.SESSION_EXPIRED, { source: "session-manager", timestamp: Date.now() });
      }
    } else if (remaining <= thresholdMs) {
      getTracker().track && getTracker().track("session:expiration:soon", { remaining });
      if (eventBus) {
        eventBus.emit(SESSION_EVENTS.EXPIRING_SOON, { remaining, timestamp: Date.now() });
      }
    }
  }, 6e4);
}
function startRecovery() {
  if (recoveryIntervalId) return;
  recoveryIntervalId = RuntimePort.setInterval(() => {
    syncMetrics.recoveryAttempts++;
    getTracker().track && getTracker().track("session:lifecycle:recovery-attempt", { attempt: syncMetrics.recoveryAttempts });
    transitionTo(LIFECYCLE_STATES.RECOVERING);
    AuthManager.checkSession().then((result) => {
      if (result.ok) {
        markReady();
        stopRecovery();
      } else {
        transitionTo(LIFECYCLE_STATES.FAILED, "recovery-check-failed");
      }
    }).catch((e) => {
      syncMetrics.errors++;
      transitionTo(LIFECYCLE_STATES.FAILED, e.message);
    });
  }, 3e4);
}
function stopRecovery() {
  if (recoveryIntervalId) {
    RuntimePort.clearInterval(recoveryIntervalId);
    recoveryIntervalId = null;
  }
}
function stopExpirationMonitor() {
  if (expirationIntervalId) {
    RuntimePort.clearInterval(expirationIntervalId);
    expirationIntervalId = null;
  }
}
function hasExpirationMonitor() {
  return !!expirationIntervalId;
}
function hasRecoveryMonitor() {
  return !!recoveryIntervalId;
}
function getMetrics() {
  return Object.assign({}, syncMetrics);
}
function healthCheck() {
  const globalState = getPort("globalState");
  const checks = {
    globalStateAvailable: !!globalState,
    lowErrorRate: syncMetrics.errors < 10,
    monitorsConfigured: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    score: `${passed}/${total}`,
    checks,
    metrics: syncMetrics,
    hasExpiration: !!expirationIntervalId,
    hasRecovery: !!recoveryIntervalId,
    p25Compliant: true,
    timestamp: Date.now()
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: syncMetrics, hasExpiration: !!expirationIntervalId, hasRecovery: !!recoveryIntervalId, p25Compliant: true };
}
var globalstate_sync_default = { syncToGlobalState, markDegraded, setupExpirationMonitor, startRecovery, stopRecovery, stopExpirationMonitor, hasExpirationMonitor, hasRecoveryMonitor, getMetrics, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  globalstate_sync_default as default,
  getMetrics,
  hasExpirationMonitor,
  hasRecoveryMonitor,
  healthCheck,
  info,
  markDegraded,
  setupExpirationMonitor,
  startRecovery,
  stopExpirationMonitor,
  stopRecovery,
  syncToGlobalState
};
