// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.core.circuit-breaker
// PURPOSE: Circuit Breaker - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   STATES_ENUM — exported value
//   getVersion() — exported function
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'ticker.core.circuit-breaker';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); };
const STATES = Object.freeze({ CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' });
export class CircuitBreaker {
  [key: string]: any;
  constructor(options: { failureThreshold?: number; resetTimeout?: number; halfOpenMaxAttempts?: number } = {}) { this.failureThreshold = options.failureThreshold || 3; this.resetTimeout = options.resetTimeout || 30000; this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 1; this._state = STATES.CLOSED; this._failureCount = 0; this._successCount = 0; this._lastFailureTime = null; this._halfOpenAttempts = 0; this._metrics = { totalCalls: 0, successCalls: 0, failedCalls: 0, rejectedCalls: 0, stateChanges: 0 }; this._subscribers = new Set(); }
  get state() { return this._state; }
  get isOpen() { return this._state === STATES.OPEN; }
  get isClosed() { return this._state === STATES.CLOSED; }
  get isHalfOpen() { return this._state === STATES.HALF_OPEN; }
  async execute(fn: (...args: unknown[]) => unknown, fallback?: (...args: unknown[]) => unknown) { this._metrics.totalCalls++; if (this._state === STATES.OPEN) { if (this._shouldAttemptReset()) { this._transitionTo(STATES.HALF_OPEN); } else { this._metrics.rejectedCalls++; _log('warn', 'Circuit OPEN - request rejected'); if (fallback) return fallback(); throw new Error('Circuit breaker is OPEN'); } } try { const result = await fn(); this._onSuccess(); return result; } catch (error) { this._onFailure(error); if (fallback) return fallback(); throw error; } }
  _onSuccess() { this._metrics.successCalls++; this._failureCount = 0; this._successCount++; if (this._state === STATES.HALF_OPEN) { this._transitionTo(STATES.CLOSED); _log('info', 'Circuit CLOSED - recovered'); } }
  _onFailure(error: unknown) { this._metrics.failedCalls++; this._failureCount++; this._lastFailureTime = Date.now(); _log('warn', `Failure ${this._failureCount}/${this.failureThreshold}`, { error: (error as Error).message }); if (this._state === STATES.HALF_OPEN) { this._halfOpenAttempts++; if (this._halfOpenAttempts >= this.halfOpenMaxAttempts) { this._transitionTo(STATES.OPEN); } } else if (this._failureCount >= this.failureThreshold) { this._transitionTo(STATES.OPEN); _log('error', 'Circuit OPEN - threshold reached'); } }
  _shouldAttemptReset() { return this._lastFailureTime && (Date.now() - this._lastFailureTime) >= this.resetTimeout; }
  _transitionTo(newState: string) { const oldState = this._state; this._state = newState; this._metrics.stateChanges++; if (newState === STATES.HALF_OPEN) { this._halfOpenAttempts = 0; } if (newState === STATES.CLOSED) { this._failureCount = 0; this._successCount = 0; } this._notifySubscribers({ oldState, newState, timestamp: Date.now() }); _log('info', `State: ${oldState} -> ${newState}`); }
  reset() { this._transitionTo(STATES.CLOSED); this._failureCount = 0; this._lastFailureTime = null; _log('info', 'Circuit manually reset'); }
  subscribe(callback: (...args: unknown[]) => void) { this._subscribers.add(callback); return () => this._subscribers.delete(callback); }
  _notifySubscribers(data: unknown) { this._subscribers.forEach((cb: (...args: unknown[]) => void) => { try { cb(data); } catch (e) {} }); }
  healthCheck() { const logger = _getPort('logger'); const checks = { isClosed: this.isClosed, lowFailureCount: this._failureCount < this.failureThreshold, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/4`, state: this._state, failureCount: this._failureCount, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, state: this._state, failureCount: this._failureCount, threshold: this.failureThreshold, resetTimeout: this.resetTimeout, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
  destroy() { this.reset(); }
}
export const STATES_ENUM = STATES;
export function getVersion() { return VERSION; }
export default CircuitBreaker;
