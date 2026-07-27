import { BUILTIN_TRANSITIONS } from "../constants.js";
import { _transitions, getConfig } from "../state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.transitions.registry.register";
function register(name, config) {
  if (!name || typeof name !== "string") {
    return { ok: false, error: "invalid-name" };
  }
  if (!config || typeof config !== "object") {
    return { ok: false, error: "invalid-config" };
  }
  _transitions[name] = {
    enter: config.enter || null,
    exit: config.exit || null,
    duration: config.duration || getConfig().defaultDuration,
    easing: config.easing || "ease-out",
    _builtin: false,
    _custom: true
  };
  return { ok: true, name };
}
function unregister(name) {
  if (!_transitions[name]) {
    return { ok: false, error: "not-found" };
  }
  if (_transitions[name]._builtin) {
    return { ok: false, error: "cannot-remove-builtin" };
  }
  delete _transitions[name];
  if (BUILTIN_TRANSITIONS[name]) {
    _transitions[name] = { ...BUILTIN_TRANSITIONS[name], _builtin: true };
  }
  return { ok: true, name };
}
export {
  MODULE_ID,
  VERSION,
  register,
  unregister
};
