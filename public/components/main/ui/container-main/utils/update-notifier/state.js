import { createUpdateNotifier } from "./manager.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.update-notifier.state";
let _instance = null;
function getUpdateNotifier(options = {}) {
  if (!_instance) {
    _instance = createUpdateNotifier(options);
  }
  return _instance;
}
function resetUpdateNotifier() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function checkForUpdates() {
  return getUpdateNotifier().check();
}
function hasUpdate() {
  return getUpdateNotifier().hasUpdate();
}
export {
  MODULE_ID,
  VERSION,
  checkForUpdates,
  getUpdateNotifier,
  hasUpdate,
  resetUpdateNotifier
};
