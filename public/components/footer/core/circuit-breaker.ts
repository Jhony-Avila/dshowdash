// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.core.circuit-breaker
// PURPOSE: Footer Circuit Breaker - Fault tolerance pattern implementation
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract FOOTER_CIRCUIT_BREAKER - FooterCircuitBreaker() constructor
// @contract EXECUTE - execute() executes function with circuit breaker
// @contract RESET - reset() resets circuit breaker state
// @contract GET_VERSION - getVersion() returns module version
// @contract STATES - STATES object with circuit states
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   FooterCircuitBreaker() — exported constructor
//   setDebug() — exported function
//   getVersion() — exported function
//   circuitBreaker — exported singleton instance
//   STATES — exported object
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v6.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v6.7.0-ENTERPRISE: Added export const VERSION
// @changelog v6.6.1-ENTERPRISE: ES5 conversion (Object.values → for loop in healthCheck)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '6.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'footer.core.circuit-breaker';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };
const STATES = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' };
const _metrics = { successCount: 0, failureCount: 0, tripCount: 0, resetCount: 0 };
export function FooterCircuitBreaker(this: any, options: Record<string,unknown>) { options = options || {}; this._failureThreshold = options.failureThreshold || 3; this._resetTimeout = options.resetTimeout || 30000; this._state = STATES.CLOSED; this._failureCount = 0; this._lastFailureTime = null; this._resetTimer = null; }

// @ts-expect-error TS migration - TS2554
FooterCircuitBreaker.prototype.execute = function(fn, fallback) { const self = this; if (this._state === STATES.OPEN) { const elapsed = Date.now() - this._lastFailureTime; if (elapsed >= this._resetTimeout) { this._state = STATES.HALF_OPEN; _log('info', 'Transição para HALF_OPEN'); } else { _log('warn', 'Circuit OPEN - rejeitando chamada'); if (fallback) return Promise.resolve().then(() => fallback()); return Promise.reject(new Error('Circuit breaker is OPEN')); } } return Promise.resolve().then(() => fn()).then(result => { self._onSuccess(); return result; }).catch(error => { self._onFailure(error); if (fallback) return fallback(); throw error; }); };

// @ts-expect-error TS migration - TS2554
FooterCircuitBreaker.prototype._onSuccess = function() { _metrics.successCount++; if (this._state === STATES.HALF_OPEN) { this._state = STATES.CLOSED; this._failureCount = 0; _metrics.resetCount++; _log('info', 'Circuit CLOSED após sucesso'); } };

// @ts-expect-error TS migration - TS2554
FooterCircuitBreaker.prototype._onFailure = function(error) { _metrics.failureCount++; this._failureCount++; this._lastFailureTime = Date.now(); _log('warn', `Falha ${this._failureCount}/${this._failureThreshold}:`, error.message); if (this._failureCount >= this._failureThreshold && this._state !== STATES.OPEN) { this._state = STATES.OPEN; _metrics.tripCount++; _log('error', 'Circuit OPEN - threshold atingido'); } };

// @ts-expect-error TS migration - TS2554
FooterCircuitBreaker.prototype.reset = function() { this._state = STATES.CLOSED; this._failureCount = 0; this._lastFailureTime = null; _metrics.resetCount++; _log('info', 'Circuit resetado manualmente'); };
FooterCircuitBreaker.prototype.destroy = function() { this.reset(); };
FooterCircuitBreaker.prototype.getState = function() { return this._state; };
FooterCircuitBreaker.prototype.isOpen = function() { return this._state === STATES.OPEN; };
FooterCircuitBreaker.prototype.isClosed = function() { return this._state === STATES.CLOSED; };
FooterCircuitBreaker.prototype.getMetrics = function() { return Object.assign({}, _metrics, { state: this._state, failureCount: this._failureCount }); };
FooterCircuitBreaker.prototype.setDebug = (enabled: boolean) => { };
FooterCircuitBreaker.prototype.info = function() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, state: this._state, failureCount: this._failureCount, threshold: this._failureThreshold, metrics: Object.assign({}, _metrics), healthCheck: this.healthCheck(), portsInitialized: ps._initialized, timestamp: Date.now() }; };
FooterCircuitBreaker.prototype.healthCheck = function() { const ps = Ports.snapshot(); const checks = { notOpen: this._state !== STATES.OPEN, lowFailures: this._failureCount < this._failureThreshold, recentSuccess: _metrics.successCount > 0 || _metrics.failureCount === 0, portsInitialized: ps._initialized }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) { if ((checks as Record<string,unknown>)[checkKeys[i]]) passed++; } const total = checkKeys.length; return { status: passed === total ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; };
export function setDebug(enabled: boolean) { }
export function getVersion() { return VERSION; }

// @ts-expect-error TS migration - TS2554
export const circuitBreaker = new FooterCircuitBreaker();
export { STATES };
export default FooterCircuitBreaker;
