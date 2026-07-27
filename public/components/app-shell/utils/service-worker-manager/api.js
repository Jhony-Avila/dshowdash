import { VERSION, MODULE_ID } from "./constants.js";
import { _state, _subscribers, getConfig, setConfigValue, getMetrics } from "./state.js";
import { isSupported } from "./registration/manager.js";
function isRegistered() {
  return !!_state.registration;
}
function isControlling() {
  return !!navigator.serviceWorker.controller;
}
function getState() {
  return {
    supported: _state.supported,
    state: _state.state,
    updateAvailable: _state.updateAvailable,
    isControlling: isControlling(),
    error: _state.error
  };
}
function getRegistration() {
  return _state.registration;
}
function configure(options) {
  if (options.swPath !== void 0) setConfigValue("swPath", options.swPath);
  if (options.scope !== void 0) setConfigValue("scope", options.scope);
  if (options.updateStrategy !== void 0) setConfigValue("updateStrategy", options.updateStrategy);
  if (options.checkInterval !== void 0) setConfigValue("checkInterval", Math.max(6e4, options.checkInterval));
  if (options.autoRegister !== void 0) setConfigValue("autoRegister", !!options.autoRegister);
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function healthCheck() {
  const checks = {
    supported: isSupported(),
    registered: isRegistered(),
    noErrors: !_state.error,
    controlling: isControlling()
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  let status = "HEALTHY";
  if (!checks.supported) status = "DEGRADED";
  else if (passed < 3) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${keys.length}`,
    checks,
    state: _state.state,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    supported: isSupported(),
    state: getState(),
    config: getConfig(),
    metrics: getMetrics(),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}
export {
  configure,
  getConfig,
  getRegistration,
  getState,
  healthCheck,
  info,
  isControlling,
  isRegistered,
  subscribe
};
