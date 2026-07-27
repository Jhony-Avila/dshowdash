import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "8.2.0-P17WI";
const MODULE_ID = "components/permissions-guard/core/policies";
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
const _policies = /* @__PURE__ */ new Map();
function register(name, policy) {
  _policies.set(name, policy);
  _getPort("logger")?.debug(`[${MODULE_ID}] Policy registered: ${name}`);
}
function unregister(name) {
  _policies.delete(name);
}
function get(name) {
  return _policies.get(name);
}
function getAll() {
  return Array.from(_policies.entries());
}
function evaluate(name, context) {
  const policy = _policies.get(name);
  if (!policy) {
    _getPort("logger")?.warn(`[${MODULE_ID}] Policy not found: ${name}`);
    return { allowed: false, reason: "policy_not_found" };
  }
  try {
    return policy(context);
  } catch (e) {
    _getPort("logger")?.error(`[${MODULE_ID}] Policy evaluation error:`, e);
    return { allowed: false, reason: "evaluation_error" };
  }
}
function healthCheck() {
  return { status: "healthy", policyCount: _policies.size, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, policyCount: _policies.size, policies: Array.from(_policies.keys()), portsInitialized: Ports.isInitialized() };
}
const PolicyManager = { register, unregister, get, getAll, evaluate, healthCheck, info };
var policies_default = { register, unregister, get, getAll, evaluate, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  PolicyManager,
  VERSION,
  policies_default as default,
  evaluate,
  get,
  getAll,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  register,
  unregister
};
