import { _state, incrementMetric } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.updates.manager";
function checkForUpdates() {
  if (!_state.registration) {
    return Promise.resolve({ ok: false, error: "No registration" });
  }
  return _state.registration.update().then(() => ({
    ok: true,
    updateAvailable: _state.updateAvailable
  })).catch((error) => ({
    ok: false,
    error: error.message
  }));
}
function applyUpdate() {
  if (!_state.waitingWorker) {
    return { ok: false, error: "No waiting worker" };
  }
  skipWaiting();
  return { ok: true };
}
function skipWaiting() {
  if (_state.waitingWorker) {
    _state.waitingWorker.postMessage({ type: "SKIP_WAITING" });
    incrementMetric("messagesSent");
  }
}
function hasUpdate() {
  return _state.updateAvailable;
}
export {
  MODULE_ID,
  VERSION,
  applyUpdate,
  checkForUpdates,
  hasUpdate,
  skipWaiting
};
