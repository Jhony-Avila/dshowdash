import { _transitions, getConfig, updateConfig } from "../state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.transitions.registry.query";
function get(name) {
  const transition = _transitions[name];
  if (!transition) return null;
  const { _builtin, _custom, ...rest } = transition;
  return { ...rest };
}
function has(name) {
  return !!_transitions[name];
}
function list() {
  return Object.keys(_transitions).map((name) => ({
    name,
    duration: _transitions[name].duration,
    builtin: !!_transitions[name]._builtin,
    custom: !!_transitions[name]._custom
  }));
}
function setDefault(name) {
  if (!_transitions[name]) {
    return { ok: false, error: "transition-not-found" };
  }
  updateConfig({ defaultTransition: name });
  return { ok: true, default: name };
}
function getDefault() {
  return getConfig().defaultTransition;
}
export {
  MODULE_ID,
  VERSION,
  get,
  getDefault,
  has,
  list,
  setDefault
};
