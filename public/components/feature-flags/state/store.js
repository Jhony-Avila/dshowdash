const VERSION = "2.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.feature-flags.state.store";
let _state = { flags: {}, defaults: {}, overrides: {} };
let _subscribers = [];
function getState() {
  return { ..._state };
}
function getFlags() {
  return {
    ..._state.defaults,
    ..._state.flags,
    ..._state.overrides
  };
}
function getFlag(key) {
  if (_state.overrides[key] !== void 0) return _state.overrides[key];
  if (_state.flags[key] !== void 0) return _state.flags[key];
  return _state.defaults[key] ?? false;
}
function setFlag(key, value) {
  _state.flags[key] = value;
  _notify({ action: "flag-changed", flag: key, value });
  return true;
}
function setFlags(flags) {
  _state.flags = { ..._state.flags, ...flags };
  _notify({ action: "flags-changed", flags: Object.keys(flags) });
  return true;
}
function setOverride(key, value) {
  _state.overrides[key] = value;
  _notify({ action: "override-set", flag: key, value });
  return true;
}
function removeOverride(key) {
  if (_state.overrides[key] !== void 0) {
    delete _state.overrides[key];
    _notify({ action: "override-removed", flag: key });
    return true;
  }
  return false;
}
function clearOverrides() {
  const count = Object.keys(_state.overrides).length;
  _state.overrides = {};
  _notify({ action: "overrides-cleared", count });
  return true;
}
function setDefaults(defaults) {
  _state.defaults = { ..._state.defaults, ...defaults };
  return true;
}
function reset() {
  _state = { flags: {}, defaults: {}, overrides: {} };
  _notify({ action: "reset" });
  return true;
}
function subscribe(fn) {
  if (typeof fn === "function") {
    _subscribers.push(fn);
  }
  return () => {
    _subscribers = _subscribers.filter((s) => s !== fn);
  };
}
function _notify(event) {
  _subscribers.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
    }
  });
}
function toJSON() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    exportedAt: Date.now(),
    state: {
      flags: { ..._state.flags },
      defaults: { ..._state.defaults },
      overrides: { ..._state.overrides }
    },
    computed: {
      allFlags: getFlags(),
      flagCount: Object.keys(_state.flags).length,
      overrideCount: Object.keys(_state.overrides).length,
      defaultCount: Object.keys(_state.defaults).length
    }
  };
}
function healthCheck() {
  const checks = {
    hasState: _state !== null && typeof _state === "object",
    hasFlags: typeof _state.flags === "object",
    hasOverrides: typeof _state.overrides === "object",
    hasDefaults: typeof _state.defaults === "object"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    flagCount: Object.keys(_state.flags).length,
    overrideCount: Object.keys(_state.overrides).length,
    subscriberCount: _subscribers.length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    flagCount: Object.keys(_state.flags).length,
    overrideCount: Object.keys(_state.overrides).length,
    subscriberCount: _subscribers.length,
    flags: Object.keys(_state.flags),
    overrides: Object.keys(_state.overrides),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
const featureFlagsStore = {
  getState,
  getFlags,
  getFlag,
  setFlag,
  setFlags,
  setOverride,
  removeOverride,
  clearOverrides,
  setDefaults,
  reset,
  subscribe,
  toJSON,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
var store_default = featureFlagsStore;
export {
  MODULE_ID,
  VERSION,
  clearOverrides,
  store_default as default,
  featureFlagsStore,
  getFlag,
  getFlags,
  getState,
  healthCheck,
  info,
  removeOverride,
  reset,
  setDefaults,
  setFlag,
  setFlags,
  setOverride,
  subscribe,
  toJSON
};
