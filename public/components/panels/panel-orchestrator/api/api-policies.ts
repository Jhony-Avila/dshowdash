// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-api-policies
// PURPOSE: API Policies
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   logger from ../utils/logger.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   ApiPolicies() — exported function
//   apiPolicies — exported value
//   DEFAULT_POLICY — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import logger from '../utils/logger.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-api-policies';

const DEFAULT_POLICY = {
  timeout: 10000, maxRetries: 3, backoffBase: 1000, backoffMultiplier: 2, maxBackoff: 30000,
  circuitBreakerThreshold: 5, circuitBreakerWindowMs: 60000, circuitBreakerResetMs: 30000, cacheTTL: 60000
};

function ApiPolicies(this: any) {
  this.policies = new Map();
  this.failures = new Map();
  this.circuitState = new Map();
  this.initialized = false;
  this.destroyed = false;
}

ApiPolicies.prototype.getVersion = () => VERSION;
ApiPolicies.prototype.isInitialized = function() { return this.policies.size > 0 || this.initialized; };
ApiPolicies.prototype.init = function() { this.initialized = true; this.destroyed = false; return this; };

ApiPolicies.prototype.setPolicy = function(endpoint: string, policy: Record<string, unknown>) {
  this.policies.set(endpoint, Object.assign({}, DEFAULT_POLICY, policy));
};

ApiPolicies.prototype.getPolicy = function(endpoint: string) { return this.policies.get(endpoint) || DEFAULT_POLICY; };

ApiPolicies.prototype.calculateBackoff = (attempt: number, policy: typeof DEFAULT_POLICY = DEFAULT_POLICY) => {
  const delay = policy.backoffBase * Math.pow(policy.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, policy.maxBackoff);
};

ApiPolicies.prototype.recordFailure = function(endpoint: string) {
  if (!this.failures.has(endpoint)) this.failures.set(endpoint, []);
  this.failures.get(endpoint).push({ timestamp: Date.now() });
  this._checkCircuitBreaker(endpoint);
};

ApiPolicies.prototype.recordSuccess = function(endpoint: string) {
  if (this.failures.has(endpoint)) this.failures.get(endpoint).length = 0;
  if (this.circuitState.has(endpoint)) {
    const circuit = this.circuitState.get(endpoint);
    if (circuit.state === 'half-open') this._closeCircuit(endpoint);
  }
};

ApiPolicies.prototype._checkCircuitBreaker = function(endpoint: string) {
  const policy = this.getPolicy(endpoint);
  const failures: Array<{ timestamp: number }> = this.failures.get(endpoint) || [];
  const now = Date.now();
  const recentFailures = failures.filter((f: { timestamp: number }) => now - f.timestamp < policy.circuitBreakerWindowMs);
  if (recentFailures.length >= policy.circuitBreakerThreshold) this._openCircuit(endpoint);
};

ApiPolicies.prototype._openCircuit = function(endpoint: string) {
  const policy = this.getPolicy(endpoint);
  this.circuitState.set(endpoint, { state: 'open', openedAt: Date.now(), resetAt: Date.now() + policy.circuitBreakerResetMs });
  logger.warn(`Circuit breaker ABERTO: ${endpoint}`);
};

ApiPolicies.prototype._closeCircuit = function(endpoint: string) {
  this.circuitState.delete(endpoint);
  this.failures.delete(endpoint);
  logger.info(`Circuit breaker FECHADO: ${endpoint}`);
};

ApiPolicies.prototype.isCircuitOpen = function(endpoint: string) {
  const circuit = this.circuitState.get(endpoint);
  if (!circuit) return false;
  const now = Date.now();
  if (circuit.state === 'open' && now >= circuit.resetAt) { circuit.state = 'half-open'; logger.info(`Circuit breaker HALF-OPEN: ${endpoint}`); return false; }
  return circuit.state === 'open';
};

ApiPolicies.prototype.getOpenCircuits = function() {
  const open: string[] = [];
  this.circuitState.forEach((circuit: { state: string }, endpoint: string) => { if (circuit.state === 'open') open.push(endpoint); });
  return open;
};

ApiPolicies.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, policiesCount: this.policies.size, failuresTracked: this.failures.size, openCircuits: this.getOpenCircuits() };
};

ApiPolicies.prototype.reset = function() { this.failures.clear(); this.circuitState.clear(); this.destroyed = false; logger.info('API Policies resetado'); };

ApiPolicies.prototype.destroy = function() {
  this.policies.clear();
  this.failures.clear();
  this.circuitState.clear();
  this.initialized = false;
  this.destroyed = true;
};

// @ts-expect-error strict migration — TS7009
const apiPolicies = new ApiPolicies();

export default apiPolicies;
export { ApiPolicies, apiPolicies, DEFAULT_POLICY, VERSION, MODULE_ID };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { apiPoliciesReady: true } }; }
