import { _state } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.sync.manager";
function registerSync(tag) {
  if (!_state.registration || !_state.registration.sync) {
    return Promise.resolve({ ok: false, error: "Background Sync not supported" });
  }
  return _state.registration.sync.register(tag).then(() => ({
    ok: true,
    tag
  })).catch((error) => ({
    ok: false,
    error: error.message
  }));
}
function getSyncTags() {
  if (!_state.registration || !_state.registration.sync) {
    return Promise.resolve([]);
  }
  return _state.registration.sync.getTags();
}
export {
  MODULE_ID,
  VERSION,
  getSyncTags,
  registerSync
};
