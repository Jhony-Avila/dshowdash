import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.security.schema";
const VERSION = "2.1.1-P17WI";
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
const _state = { initialized: false, schemas: {} };
const _metrics = { validated: 0, passed: 0, failed: 0 };
function registerSchema(routePattern, schema) {
  _state.schemas[routePattern] = schema;
  return { ok: true, pattern: routePattern };
}
function unregisterSchema(routePattern) {
  if (_state.schemas[routePattern]) {
    delete _state.schemas[routePattern];
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function getSchema(routePattern) {
  return _state.schemas[routePattern] || null;
}
function validate(routePattern, params) {
  _metrics.validated++;
  const schema = _state.schemas[routePattern];
  if (!schema) return { valid: true, noSchema: true };
  const errors = [];
  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      const rule = schema[key];
      const value = params[key];
      if (rule.required && (value === void 0 || value === null || value === "")) errors.push({ field: key, error: "required" });
      if (value !== void 0 && value !== null) {
        if (rule.type === "number" && isNaN(Number(value))) errors.push({ field: key, error: "invalid type, expected number" });
        if (rule.type === "integer" && !Number.isInteger(Number(value))) errors.push({ field: key, error: "invalid type, expected integer" });
        if (rule.pattern && !new RegExp(rule.pattern).test(String(value))) errors.push({ field: key, error: "pattern mismatch" });
        if (rule.minLength && String(value).length < rule.minLength) errors.push({ field: key, error: "too short" });
        if (rule.maxLength && String(value).length > rule.maxLength) errors.push({ field: key, error: "too long" });
        if (rule.enum && rule.enum.indexOf(value) < 0) errors.push({ field: key, error: "invalid value" });
      }
    }
  }
  if (errors.length > 0) {
    _metrics.failed++;
    return { valid: false, errors };
  }
  _metrics.passed++;
  return { valid: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.schemas) Object.assign(_state.schemas, ctx.schemas);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.schemas = {};
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, schemasCount: Object.keys(_state.schemas).length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var schema_default = { MODULE_ID, VERSION, init, cleanup, registerSchema, unregisterSchema, getSchema, validate, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  schema_default as default,
  getPorts,
  getSchema,
  healthCheck,
  info,
  init,
  injectPorts,
  registerSchema,
  unregisterSchema,
  validate
};
