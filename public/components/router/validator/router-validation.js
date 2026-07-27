import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.validator.router-validation";
const VERSION = "2.2.0-P18EC";
const VALIDATION_TELEMETRY = {
  FAILED: "router:validation:failed"
};
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _state = { initialized: false, validators: {}, globalValidators: [] };
const _metrics = { validated: 0, passed: 0, failed: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function registerValidator(routePattern, validator) {
  if (!routePattern || typeof validator !== "function") return { ok: false, error: "Invalid arguments" };
  if (!_state.validators[routePattern]) _state.validators[routePattern] = [];
  _state.validators[routePattern].push(validator);
  return { ok: true, pattern: routePattern };
}
function registerGlobalValidator(validator) {
  if (typeof validator !== "function") return { ok: false, error: "Validator must be function" };
  _state.globalValidators.push(validator);
  return { ok: true };
}
function unregisterValidator(routePattern) {
  if (_state.validators[routePattern]) {
    delete _state.validators[routePattern];
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function validate(routePattern, context) {
  _metrics.validated++;
  context = context || {};
  const errors = [];
  for (let i = 0; i < _state.globalValidators.length; i++) {
    try {
      const result = _state.globalValidators[i](routePattern, context);
      if (result && !result.valid) errors.push({ validator: `global-${i}`, error: result.error || "Validation failed" });
    } catch (e) {
      errors.push({ validator: `global-${i}`, error: e.message });
    }
  }
  const routeValidators = _state.validators[routePattern] || [];
  for (let j = 0; j < routeValidators.length; j++) {
    try {
      const res = routeValidators[j](context);
      if (res && !res.valid) errors.push({ validator: `route-${j}`, error: res.error || "Validation failed" });
    } catch (e) {
      errors.push({ validator: `route-${j}`, error: e.message });
    }
  }
  if (errors.length > 0) {
    _metrics.failed++;
    _track(VALIDATION_TELEMETRY.FAILED, { pattern: routePattern, errors });
    return { valid: false, errors };
  }
  _metrics.passed++;
  return { valid: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.validators = {};
  _state.globalValidators = [];
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, routeValidatorsCount: Object.keys(_state.validators).length, globalValidatorsCount: _state.globalValidators.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var router_validation_default = { MODULE_ID, VERSION, VALIDATION_TELEMETRY, init, cleanup, registerValidator, registerGlobalValidator, unregisterValidator, validate, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VALIDATION_TELEMETRY,
  VERSION,
  cleanup,
  router_validation_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  registerGlobalValidator,
  registerValidator,
  unregisterValidator,
  validate
};
