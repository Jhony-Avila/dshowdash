import { VERSION, MODULE_ID, NOTIFIER_STATES, UPDATE_TYPES } from "./constants.js";
import { createUpdateNotifier } from "./manager.js";
import { getUpdateNotifier, resetUpdateNotifier, checkForUpdates, hasUpdate } from "./state.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, NOTIFIER_STATES as NOTIFIER_STATES2, UPDATE_TYPES as UPDATE_TYPES2 } from "./constants.js";
import { createUpdateNotifier as createUpdateNotifier2 } from "./manager.js";
import { getUpdateNotifier as getUpdateNotifier2, resetUpdateNotifier as resetUpdateNotifier2, checkForUpdates as checkForUpdates2, hasUpdate as hasUpdate2 } from "./state.js";
function info() {
  return { moduleId: MODULE_ID2, version: VERSION2 };
}
function healthCheck() {
  const instance = getUpdateNotifier2();
  if (instance) return instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION2, moduleId: MODULE_ID2 };
}
var update_notifier_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  NOTIFIER_STATES: NOTIFIER_STATES2,
  UPDATE_TYPES: UPDATE_TYPES2,
  createUpdateNotifier: createUpdateNotifier2,
  getUpdateNotifier: getUpdateNotifier2,
  resetUpdateNotifier: resetUpdateNotifier2,
  checkForUpdates: checkForUpdates2,
  hasUpdate: hasUpdate2,
  info,
  healthCheck
};
export {
  MODULE_ID,
  NOTIFIER_STATES,
  UPDATE_TYPES,
  VERSION,
  checkForUpdates,
  createUpdateNotifier,
  update_notifier_default as default,
  getUpdateNotifier,
  hasUpdate,
  healthCheck,
  info,
  resetUpdateNotifier
};
