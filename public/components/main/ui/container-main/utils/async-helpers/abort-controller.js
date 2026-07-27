import { incrementAborted } from "./metrics.js";
const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:async-helpers:abort-controller";
const _activeControllers = /* @__PURE__ */ new Map();
let _controllerId = 0;
function createAbortController(key = null) {
  const id = key || `ctrl-${++_controllerId}`;
  if (_activeControllers.has(id)) {
    const existing = _activeControllers.get(id);
    if (!existing.signal.aborted) {
      existing.abort("Replaced by new controller");
    }
  }
  const controller = new AbortController();
  _activeControllers.set(id, controller);
  return {
    id,
    controller,
    signal: controller.signal,
    abort: (reason = "Manual abort") => {
      if (!controller.signal.aborted) {
        controller.abort(reason);
        incrementAborted();
      }
      _activeControllers.delete(id);
    },
    cleanup: () => {
      _activeControllers.delete(id);
    },
    isAborted: () => controller.signal.aborted
  };
}
function abortByKey(key) {
  const controller = _activeControllers.get(key);
  if (controller && !controller.signal.aborted) {
    controller.abort("Aborted by key");
    _activeControllers.delete(key);
    incrementAborted();
    return true;
  }
  return false;
}
function abortAll(keyPrefix = null) {
  let aborted = 0;
  _activeControllers.forEach((controller, key) => {
    if (!keyPrefix || key.startsWith(keyPrefix)) {
      if (!controller.signal.aborted) {
        controller.abort("Abort all");
        aborted++;
      }
      _activeControllers.delete(key);
    }
  });
  if (aborted > 0) {
    for (let i = 0; i < aborted; i++) incrementAborted();
  }
  return aborted;
}
function isActive(key) {
  const controller = _activeControllers.get(key);
  return controller && !controller.signal.aborted;
}
function getActiveCount() {
  let count = 0;
  _activeControllers.forEach((controller) => {
    if (!controller.signal.aborted) count++;
  });
  return count;
}
function getActiveKeys() {
  const keys = [];
  _activeControllers.forEach((controller, key) => {
    if (!controller.signal.aborted) keys.push(key);
  });
  return keys;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    activeControllers: getActiveCount()
  };
}
var abort_controller_default = {
  VERSION,
  MODULE_ID,
  createAbortController,
  abortByKey,
  abortAll,
  isActive,
  getActiveCount,
  getActiveKeys,
  info
};
export {
  MODULE_ID,
  VERSION,
  abortAll,
  abortByKey,
  createAbortController,
  abort_controller_default as default,
  getActiveCount,
  getActiveKeys,
  info,
  isActive
};
