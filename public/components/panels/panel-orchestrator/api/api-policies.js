import logger from "../utils/logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-api-policies";
const DEFAULT_POLICY = {
  timeout: 1e4,
  maxRetries: 3,
  backoffBase: 1e3,
  backoffMultiplier: 2,
  maxBackoff: 3e4,
  circuitBreakerThreshold: 5,
  circuitBreakerWindowMs: 6e4,
  circuitBreakerResetMs: 3e4,
  cacheTTL: 6e4
};
function ApiPolicies() {
  this.policies = /* @__PURE__ */ new Map();
  this.failures = /* @__PURE__ */ new Map();
  this.circuitState = /* @__PURE__ */ new Map();
  this.initialized = false;
  this.destroyed = false;
}
ApiPolicies.prototype.getVersion = () => VERSION;
ApiPolicies.prototype.isInitialized = function() {
  return this.policies.size > 0 || this.initialized;
};
ApiPolicies.prototype.init = function() {
  this.initialized = true;
  this.destroyed = false;
  return this;
};
ApiPolicies.prototype.setPolicy = function(endpoint, policy) {
  this.policies.set(endpoint, Object.assign({}, DEFAULT_POLICY, policy));
};
ApiPolicies.prototype.getPolicy = function(endpoint) {
  return this.policies.get(endpoint) || DEFAULT_POLICY;
};
ApiPolicies.prototype.calculateBackoff = (attempt, policy = DEFAULT_POLICY) => {
  const delay = policy.backoffBase * Math.pow(policy.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 1e3;
  return Math.min(delay + jitter, policy.maxBackoff);
};
ApiPolicies.prototype.recordFailure = function(endpoint) {
  if (!this.failures.has(endpoint)) this.failures.set(endpoint, []);
  this.failures.get(endpoint).push({ timestamp: Date.now() });
  this._checkCircuitBreaker(endpoint);
};
ApiPolicies.prototype.recordSuccess = function(endpoint) {
  if (this.failures.has(endpoint)) this.failures.get(endpoint).length = 0;
  if (this.circuitState.has(endpoint)) {
    const circuit = this.circuitState.get(endpoint);
    if (circuit.state === "half-open") this._closeCircuit(endpoint);
  }
};
ApiPolicies.prototype._checkCircuitBreaker = function(endpoint) {
  const policy = this.getPolicy(endpoint);
  const failures = this.failures.get(endpoint) || [];
  const now = Date.now();
  const recentFailures = failures.filter((f) => now - f.timestamp < policy.circuitBreakerWindowMs);
  if (recentFailures.length >= policy.circuitBreakerThreshold) this._openCircuit(endpoint);
};
ApiPolicies.prototype._openCircuit = function(endpoint) {
  const policy = this.getPolicy(endpoint);
  this.circuitState.set(endpoint, { state: "open", openedAt: Date.now(), resetAt: Date.now() + policy.circuitBreakerResetMs });
  logger.warn(`Circuit breaker ABERTO: ${endpoint}`);
};
ApiPolicies.prototype._closeCircuit = function(endpoint) {
  this.circuitState.delete(endpoint);
  this.failures.delete(endpoint);
  logger.info(`Circuit breaker FECHADO: ${endpoint}`);
};
ApiPolicies.prototype.isCircuitOpen = function(endpoint) {
  const circuit = this.circuitState.get(endpoint);
  if (!circuit) return false;
  const now = Date.now();
  if (circuit.state === "open" && now >= circuit.resetAt) {
    circuit.state = "half-open";
    logger.info(`Circuit breaker HALF-OPEN: ${endpoint}`);
    return false;
  }
  return circuit.state === "open";
};
ApiPolicies.prototype.getOpenCircuits = function() {
  const open = [];
  this.circuitState.forEach((circuit, endpoint) => {
    if (circuit.state === "open") open.push(endpoint);
  });
  return open;
};
ApiPolicies.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, policiesCount: this.policies.size, failuresTracked: this.failures.size, openCircuits: this.getOpenCircuits() };
};
ApiPolicies.prototype.reset = function() {
  this.failures.clear();
  this.circuitState.clear();
  this.destroyed = false;
  logger.info("API Policies resetado");
};
ApiPolicies.prototype.destroy = function() {
  this.policies.clear();
  this.failures.clear();
  this.circuitState.clear();
  this.initialized = false;
  this.destroyed = true;
};
const apiPolicies = new ApiPolicies();
var api_policies_default = apiPolicies;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { apiPoliciesReady: true } };
}
export {
  ApiPolicies,
  DEFAULT_POLICY,
  MODULE_ID,
  VERSION,
  apiPolicies,
  api_policies_default as default,
  healthCheck,
  info
};
