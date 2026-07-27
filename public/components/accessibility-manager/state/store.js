const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accessibility-manager.state.store";
let _state = {
  enabled: true,
  settings: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    fontSize: "normal"
  }
};
let _subscribers = [];
const _metadata = {
  createdAt: Date.now(),
  lastUpdated: null,
  updateCount: 0
};
function _notify() {
  for (const fn of _subscribers) {
    try {
      fn(_state);
    } catch (e) {
    }
  }
}
function getState() {
  return { ..._state };
}
function getSettings() {
  return { ..._state.settings };
}
function updateSettings(settings) {
  _state.settings = { ..._state.settings, ...settings };
  _metadata.lastUpdated = Date.now();
  _metadata.updateCount++;
  _notify();
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
function getMetadata() {
  return { ..._metadata };
}
function toJSON() {
  return {
    state: getState(),
    metadata: getMetadata()
  };
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = {
    hasState: !!_state,
    enabled: _state.enabled,
    hasSettings: !!_state.settings
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    settings: _state.settings,
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
    enabled: _state.enabled,
    settings: _state.settings,
    metadata: getMetadata(),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}
var store_default = {
  getState,
  getSettings,
  updateSettings,
  subscribe,
  getMetadata,
  toJSON,
  healthCheck,
  info,
  getVersion,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  getMetadata,
  getSettings,
  getState,
  getVersion,
  healthCheck,
  info,
  subscribe,
  toJSON,
  updateSettings
};
