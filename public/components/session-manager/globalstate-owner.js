import { getPort, log } from "./ports.js";
import { sessionStore, MUTATION_SOURCES } from "./state/store.js";
import { SessionLifecycle } from "./core/lifecycle.js";
import * as Tracker from "./telemetry/tracker.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "session-manager:globalstate-owner";
const OWNER_ID = "session-manager";
let _isOwner = false;
let _ownerLockAcquired = false;
let globalStateCleanups = [];
const _metrics = { globalStateSyncs: 0, ownerLockAttempts: 0, ownerLockSuccess: 0, errors: 0 };
const _integrationsStatus = { globalStateConnected: false, eventBusAvailable: false, telemetryCoreAvailable: false, ownerLockAcquired: false };
function updateIntegrationsStatus() {
  if (typeof window === "undefined") return;
  _integrationsStatus.globalStateConnected = globalStateCleanups.length > 0;
  _integrationsStatus.eventBusAvailable = !!getPort("eventBus");
  _integrationsStatus.telemetryCoreAvailable = !!getPort("telemetryCore");
  _integrationsStatus.ownerLockAcquired = _ownerLockAcquired;
}
function acquireOwnerLock() {
  const globalState = getPort("globalState");
  if (!globalState) return false;
  _metrics.ownerLockAttempts++;
  try {
    const currentOwner = globalState._sessionOwner;
    if (currentOwner && currentOwner !== OWNER_ID) {
      log.debug("GlobalState session already has owner", { currentOwner });
      return false;
    }
    globalState._sessionOwner = OWNER_ID;
    _isOwner = true;
    _ownerLockAcquired = true;
    _metrics.ownerLockSuccess++;
    log.info("GlobalState owner lock acquired", { owner: OWNER_ID });
    Tracker.trackSessionEvent("session:globalstate:owner-lock-acquired", {});
    return true;
  } catch (e) {
    _metrics.errors++;
    log.error("Failed to acquire owner lock", { error: e.message });
    return false;
  }
}
function releaseOwnerLock() {
  const globalState = getPort("globalState");
  if (!globalState) return false;
  try {
    if (globalState._sessionOwner === OWNER_ID) {
      delete globalState._sessionOwner;
      _isOwner = false;
      _ownerLockAcquired = false;
      log.info("GlobalState owner lock released");
      Tracker.trackSessionEvent("session:globalstate:owner-lock-released");
      return true;
    }
    return false;
  } catch (e) {
    log.error("Failed to release owner lock", { error: e.message });
    return false;
  }
}
function canWriteToGlobalState() {
  const globalState = getPort("globalState");
  if (!globalState) return false;
  const currentOwner = globalState._sessionOwner;
  return !currentOwner || currentOwner === OWNER_ID;
}
function writeToGlobalState(action, payload) {
  if (!canWriteToGlobalState()) {
    const globalState = getPort("globalState");
    log.debug("Cannot write to GlobalState - not owner", { currentOwner: globalState ? globalState._sessionOwner : null, expectedOwner: OWNER_ID });
    SessionLifecycle.markDegraded("globalstate-not-owner");
    return false;
  }
  try {
    _metrics.globalStateSyncs++;
    const globalState = getPort("globalState");
    globalState.dispatch(action(payload));
    return true;
  } catch (e) {
    _metrics.errors++;
    log.error("GlobalState write error", { error: e.message });
    return false;
  }
}
function setupGlobalStateIntegration() {
  const globalState = getPort("globalState");
  if (!globalState) {
    log.info("GlobalState nao disponivel - funcionando standalone");
    SessionLifecycle.markDegraded("globalstate-unavailable");
    return;
  }
  if (!acquireOwnerLock()) {
    log.debug("Failed to acquire GlobalState owner lock - another owner exists");
    SessionLifecycle.markDegraded("globalstate-owner-conflict");
  }
  const syncFromGlobalState = (session) => {
    if (!session) return;
    if (session._source === "session-manager") return;
    if (!_isOwner) return;
    const user = session.user;
    if (session.isAuthenticated && user) {
      const currentUser = sessionStore.getUser();
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        sessionStore.update({ authenticated: true, user, userId: user ? user.id : null, roles: user && user.roles ? user.roles : [], lastActivity: session.lastActivity || Date.now() }, MUTATION_SOURCES.SYNC);
        Tracker.trackSessionEvent("session:global-state:synced-from", { userId: user ? user.id : null });
      }
    }
  };
  try {
    const unsubscribe = globalState.subscribe(syncFromGlobalState, "session");
    globalStateCleanups.push(unsubscribe);
    const initialState = globalState.getState();
    if (initialState && initialState.session) syncFromGlobalState(initialState.session);
    Tracker.trackSessionEvent("session:global-state:connected", { isOwner: _isOwner });
    log.info("GlobalState integration configurada", { isOwner: _isOwner });
    updateIntegrationsStatus();
  } catch (e) {
    _metrics.errors++;
    log.error("GlobalState integration error", { error: e.message });
    SessionLifecycle.markDegraded("globalstate-integration-error");
  }
}
function cleanupGlobalStateIntegration() {
  globalStateCleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  });
  globalStateCleanups = [];
  releaseOwnerLock();
  updateIntegrationsStatus();
}
function isOwner() {
  return _isOwner;
}
function getIntegrationsStatus() {
  return Object.assign({}, _integrationsStatus);
}
function getOwnerMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, isOwner: _isOwner, ownerLockAcquired: _ownerLockAcquired, integrations: Object.assign({}, _integrationsStatus) };
}
var globalstate_owner_default = { acquireOwnerLock, releaseOwnerLock, canWriteToGlobalState, writeToGlobalState, setupGlobalStateIntegration, cleanupGlobalStateIntegration, isOwner, getIntegrationsStatus, updateIntegrationsStatus };
export {
  MODULE_ID,
  VERSION,
  acquireOwnerLock,
  canWriteToGlobalState,
  cleanupGlobalStateIntegration,
  globalstate_owner_default as default,
  getIntegrationsStatus,
  getOwnerMetrics,
  info,
  isOwner,
  releaseOwnerLock,
  setupGlobalStateIntegration,
  updateIntegrationsStatus,
  writeToGlobalState
};
