// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.7.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/api/fetch
// PURPOSE: Resilient fetch with circuit breaker and retry logic
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   API_EVENTS from /core/runtime/events/catalog/api.events.js
// PROVIDES:
//   ResilientFetch (class) — fetch with circuit breaker/retry
//   fetchWithTimeout(resource, opts) — single fetch with timeout
//   createFetchClient(config) — factory for ResilientFetch
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   getVersion() — return module version
// ═══════════════════════════════════════════════════════════════
// Header - Fetch with Circuit Breaker & Retry (Enterprise Autocontained)
// @version 5.7.0-P18EC
// @changelog v5.7.0-P18EC - Direct import from central catalog
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { API_EVENTS } from '/core/runtime/events/catalog/api.events.js';

export const VERSION = '5.7.0-P18EC';
export const MODULE_ID = 'header/api/fetch';

const CIRCUIT_STATES = Object.freeze({ CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' });

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; } if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; } if (_debugEnabled()) logger.debug?.(`[${MODULE_ID}]`, ...args); };

class CircuitBreaker {
  [key: string]: any;
  constructor(options: { failureThreshold?: number; successThreshold?: number; timeout?: number; halfOpenMaxAttempts?: number; instanceId?: string; onStateChange?: Function } = {}) { this.config = { failureThreshold: options.failureThreshold || 5, successThreshold: options.successThreshold || 2, timeout: options.timeout || 60000, halfOpenMaxAttempts: options.halfOpenMaxAttempts || 3, instanceId: options.instanceId || 'circuit-default' }; this.state = CIRCUIT_STATES.CLOSED; this.failureCount = 0; this.successCount = 0; this.halfOpenAttempts = 0; this.nextAttempt = Date.now(); this.lastStateChange = Date.now(); this.onStateChange = options.onStateChange || (() => {}); this._metrics = { totalRequests: 0, totalFailures: 0, totalSuccesses: 0, stateChanges: 0, timeInOpen: 0, lastFailureAt: null, lastSuccessAt: null }; this.stateHistory = []; this.maxHistorySize = 20; this._initAutoRecovery(); }
  // @ts-expect-error TS migration - TS2345
  _initAutoRecovery() { this.recoveryInterval = setInterval(() => { if (this.state === CIRCUIT_STATES.OPEN) { this._metrics.timeInOpen += 5000; if (Date.now() >= this.nextAttempt) this._setState(CIRCUIT_STATES.HALF_OPEN); } }, 5000); }
  // @ts-expect-error TS migration - TS2345
  async execute(fn: Function) { this._metrics.totalRequests++; if (this.state === CIRCUIT_STATES.OPEN) { if (Date.now() < this.nextAttempt) { const waitTime = Math.ceil((this.nextAttempt - Date.now()) / 1000); throw new Error(`Circuit breaker is OPEN. Retry in ${waitTime}s`); } this._setState(CIRCUIT_STATES.HALF_OPEN); } if (this.state === CIRCUIT_STATES.HALF_OPEN) { this.halfOpenAttempts++; if (this.halfOpenAttempts > this.config.halfOpenMaxAttempts) { this._setState(CIRCUIT_STATES.OPEN); this.nextAttempt = Date.now() + this.config.timeout; throw new Error('Circuit breaker HALF_OPEN max attempts exceeded'); } } try { const result = await fn(); this._onSuccess(); return result; } catch (error: any) { this._onFailure(error); throw error; } }
  // @ts-expect-error TS migration - TS2345
  _onSuccess() { this.failureCount = 0; this._metrics.totalSuccesses++; this._metrics.lastSuccessAt = Date.now(); if (this.state === CIRCUIT_STATES.HALF_OPEN) { this.successCount++; if (this.successCount >= this.config.successThreshold) { this._setState(CIRCUIT_STATES.CLOSED); this.successCount = 0; this.halfOpenAttempts = 0; } } }
  // @ts-expect-error TS migration - TS2345
  _onFailure(error: unknown) { this.failureCount++; this.successCount = 0; this._metrics.totalFailures++; this._metrics.lastFailureAt = Date.now(); if (this.state === CIRCUIT_STATES.HALF_OPEN) { this._setState(CIRCUIT_STATES.OPEN); this.nextAttempt = Date.now() + this.config.timeout; this.halfOpenAttempts = 0; return; } if (this.failureCount >= this.config.failureThreshold) { this._setState(CIRCUIT_STATES.OPEN); this.nextAttempt = Date.now() + this.config.timeout; } }
  _setState(newState: Record<string,unknown>) { if (this.state === newState) return; const oldState = this.state; this.state = newState; this.lastStateChange = Date.now(); this._metrics.stateChanges++; this.stateHistory.push({ from: oldState, to: newState, timestamp: this.lastStateChange, failureCount: this.failureCount, successCount: this.successCount }); if (this.stateHistory.length > this.maxHistorySize) this.stateHistory.shift(); this.onStateChange({ from: oldState, to: newState, timestamp: this.lastStateChange }); }
  getState() { return this.state; } isOpen() { return this.state === CIRCUIT_STATES.OPEN; } isClosed() { return this.state === CIRCUIT_STATES.CLOSED; } isHalfOpen() { return this.state === CIRCUIT_STATES.HALF_OPEN; }
  getMetrics() { return { state: this.state, failureCount: this.failureCount, successCount: this.successCount, halfOpenAttempts: this.halfOpenAttempts, nextAttempt: this.nextAttempt, isOpen: this.state === CIRCUIT_STATES.OPEN, timeUntilRetry: this.state === CIRCUIT_STATES.OPEN ? Math.max(0, this.nextAttempt - Date.now()) : 0, ...this._metrics, stateHistory: [...this.stateHistory] }; }
  healthCheck() { return { instanceId: this.config.instanceId, healthy: this.state !== CIRCUIT_STATES.OPEN, state: this.state, failureRate: this._metrics.totalRequests > 0 ? this._metrics.totalFailures / this._metrics.totalRequests : 0, totalRequests: this._metrics.totalRequests, totalFailures: this._metrics.totalFailures, isOperational: this.state === CIRCUIT_STATES.CLOSED }; }
  reset() { this.state = CIRCUIT_STATES.CLOSED; this.failureCount = 0; this.successCount = 0; this.halfOpenAttempts = 0; this.nextAttempt = Date.now(); this.lastStateChange = Date.now(); }
  destroy() { if (this.recoveryInterval) { clearInterval(this.recoveryInterval); this.recoveryInterval = null; } }
}

export class ResilientFetch {
  [key: string]: any;
  constructor(options: { timeout?: number; retries?: number; retryDelay?: number; backoffMultiplier?: number; maxRetryDelay?: number; instanceId?: string; circuitFailureThreshold?: number; circuitSuccessThreshold?: number; circuitTimeout?: number; circuitHalfOpenMaxAttempts?: number; onCircuitStateChange?: Function; logger?: Record<string, unknown>; telemetry?: Record<string, unknown> } = {}) { this.config = { timeout: options.timeout || 6000, retries: options.retries || 3, retryDelay: options.retryDelay || 1000, backoffMultiplier: options.backoffMultiplier || 2, maxRetryDelay: options.maxRetryDelay || 10000, instanceId: options.instanceId || 'fetch-default' }; this.circuitBreaker = new CircuitBreaker({ failureThreshold: options.circuitFailureThreshold || 5, successThreshold: options.circuitSuccessThreshold || 2, timeout: options.circuitTimeout || 60000, halfOpenMaxAttempts: options.circuitHalfOpenMaxAttempts || 3, instanceId: this.config.instanceId, onStateChange: options.onCircuitStateChange || (() => {}) }); this.logger = options.logger || this._createLogger(); this.telemetry = options.telemetry; this._debug = false; this._metrics = { totalRequests: 0, totalRetries: 0, totalTimeouts: 0, totalSuccesses: 0, totalFailures: 0, avgResponseTime: 0, lastRequestAt: null }; this.requestHistory = []; this.maxHistorySize = 50; this.isDestroyed = false; }
  _createLogger() { const prefix = `[ResilientFetch:${this.config.instanceId}]`; return { debug: (...args: unknown[]) => _log('debug', prefix, ...args), info: (...args: unknown[]) => _log('info', prefix, ...args), warn: (...args: unknown[]) => _log('warn', prefix, ...args), error: (...args: unknown[]) => _log('error', prefix, ...args) }; }
  _log(level: string, ...args: unknown[]) { if (!this._debug && level === 'debug') return; _log(level, ...args); }
  async fetch(resource: string | Request, options: { timeout?: number; retries?: number; retryDelay?: number; signal?: AbortSignal; bypassCircuit?: boolean; [key: string]: unknown } = {}) { if (this.isDestroyed) throw new Error('ResilientFetch foi destruído'); const startTime = Date.now(); this._metrics.totalRequests++; this._metrics.lastRequestAt = startTime; const { timeout = this.config.timeout, retries = this.config.retries, retryDelay = this.config.retryDelay, signal, bypassCircuit = false, ...fetchOptions } = options; const executeRequest = async () => await this._fetchWithTimeout(resource, { ...fetchOptions, timeout, signal }); try { let response; if (bypassCircuit) response = await this._retryFetch(executeRequest, retries, retryDelay, resource); else response = await this.circuitBreaker.execute(async () => await this._retryFetch(executeRequest, retries, retryDelay, resource)); const duration = Date.now() - startTime; this._metrics.totalSuccesses++; this._updateAvgResponseTime(duration); this._addToHistory(resource, 'success', duration); return response; } catch (error: any) { const duration = Date.now() - startTime; this._metrics.totalFailures++; this._addToHistory(resource, 'failure', duration, error.message); if (this.telemetry) this.telemetry.track(API_EVENTS.FETCH_ERROR, { resource: String(resource).substring(0, 100), error: error.message, duration, circuitState: this.circuitBreaker.getState() }); throw error; } }
  async _fetchWithTimeout(resource: string | Request, options: { timeout?: number; signal?: AbortSignal; [key: string]: unknown } = {}) { const { timeout = this.config.timeout, signal, ...fetchOptions } = options; const controller = new AbortController(); const timeoutId = setTimeout(() => { controller.abort(); this._metrics.totalTimeouts++; }, timeout); const combinedSignal = this._combineSignals([controller.signal, signal]); try { const response = await fetch(resource, { ...fetchOptions, signal: combinedSignal }); clearTimeout(timeoutId); if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`); return response; } catch (error: any) { clearTimeout(timeoutId); if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms`); throw error; } }
  async _retryFetch(fetchFn: Function, maxRetries: number, initialDelay: number, resource: unknown) { let lastError; let delay = initialDelay; for (let attempt = 0; attempt <= maxRetries; attempt++) { try { const result = await fetchFn(); if (attempt > 0) this.logger.info(`Request succeeded after ${attempt} retries`); return result; } catch (error: any) { lastError = error; if (attempt === maxRetries) break; this._metrics.totalRetries++; this.logger.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`); await this._sleep(delay); delay = Math.min(delay * this.config.backoffMultiplier, this.config.maxRetryDelay); } } this.logger.error(`Request failed after ${maxRetries + 1} attempts:`, lastError.message); throw lastError; }
  // @ts-expect-error TS migration - TS2339
  _combineSignals(signals: unknown) { const validSignals = signals.filter((s: unknown) => s != null); if (validSignals.length === 0) return undefined; if (validSignals.length === 1) return validSignals[0]; const controller = new AbortController(); for (const signal of validSignals) { if (signal.aborted) { controller.abort(); break; } signal.addEventListener('abort', () => controller.abort(), { once: true }); } return controller.signal; }
  // @ts-expect-error TS migration - TS2769
  _sleep(ms: unknown) { return new Promise(resolve => setTimeout(resolve, ms)); }
  _updateAvgResponseTime(duration: number) { const total = this._metrics.totalSuccesses + this._metrics.totalFailures; this._metrics.avgResponseTime = ((this._metrics.avgResponseTime * (total - 1)) + duration) / total; }
  _addToHistory(resource: unknown, status: string, duration: number, error: unknown = null) { this.requestHistory.push({ resource: String(resource).substring(0, 100), status, duration, error, timestamp: Date.now() }); if (this.requestHistory.length > this.maxHistorySize) this.requestHistory.shift(); }
  getMetrics() { return { ...this._metrics, circuit: this.circuitBreaker.getMetrics(), historySize: this.requestHistory.length, isDestroyed: this.isDestroyed }; }
  getCircuitMetrics() { return this.circuitBreaker.getMetrics(); }
  getCircuitHealth() { return this.circuitBreaker.healthCheck(); }
  resetCircuit() { this.circuitBreaker.reset(); this.logger.info('Circuit breaker reset'); }
  async healthCheck(url: string) { if (!url) return this._internalHealthCheck(); try { const start = Date.now(); await this.fetch(url, { retries: 0, timeout: 3000, bypassCircuit: true }); const duration = Date.now() - start; return { healthy: true, duration, url, timestamp: Date.now() }; } catch (error: any) { return { healthy: false, error: error.message, url, timestamp: Date.now() }; } }
  _internalHealthCheck() { const circuitHealth = this.circuitBreaker.healthCheck(); const successRate = this._metrics.totalRequests > 0 ? this._metrics.totalSuccesses / this._metrics.totalRequests : 1; const checks = { notDestroyed: !this.isDestroyed, circuitHealthy: circuitHealth.healthy, goodSuccessRate: successRate > 0.5 || this._metrics.totalRequests === 0 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([,v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), successRate, avgResponseTime: Math.round(this._metrics.avgResponseTime), timestamp: new Date().toISOString() }; }
  // @ts-expect-error strict migration — TS2322
  getHistory(limit: number = null) { const history = [...this.requestHistory]; return limit ? history.slice(-limit) : history; }
  destroy() { if (this.isDestroyed) { this.logger.warn('ResilientFetch já destruído'); return; } this.circuitBreaker.destroy(); this.requestHistory = []; this.isDestroyed = true; this.logger.info('ResilientFetch destruído'); }
  info() { return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), metrics: this._metrics, circuitState: this.circuitBreaker.getState(), healthCheck: this._internalHealthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; }
  resetMetrics() { this._metrics = { totalRequests: 0, totalRetries: 0, totalTimeouts: 0, totalSuccesses: 0, totalFailures: 0, avgResponseTime: 0, lastRequestAt: null }; }
}

export async function fetchWithTimeout(resource: string | Request, options: { timeout?: number; [key: string]: unknown } = {}) { const client = new ResilientFetch({ timeout: options.timeout || 6000, retries: 0, logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} } }); try { return await client.fetch(resource, options); } finally { client.destroy(); } }
export function createFetchClient(config: { timeout?: number; retries?: number; retryDelay?: number; backoffMultiplier?: number; maxRetryDelay?: number; circuitFailureThreshold?: number; circuitSuccessThreshold?: number; circuitTimeout?: number; circuitHalfOpenMaxAttempts?: number; instanceId?: string; logger?: Record<string, unknown>; telemetry?: Record<string, unknown>; onCircuitStateChange?: Function } = {}) { return new ResilientFetch({ timeout: config.timeout || 6000, retries: config.retries || 3, retryDelay: config.retryDelay || 1000, backoffMultiplier: config.backoffMultiplier || 2, maxRetryDelay: config.maxRetryDelay || 10000, circuitFailureThreshold: config.circuitFailureThreshold || 5, circuitSuccessThreshold: config.circuitSuccessThreshold || 2, circuitTimeout: config.circuitTimeout || 60000, circuitHalfOpenMaxAttempts: config.circuitHalfOpenMaxAttempts || 3, instanceId: config.instanceId || 'fetch-default', logger: config.logger, telemetry: config.telemetry, onCircuitStateChange: config.onCircuitStateChange }); }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { }
export default ResilientFetch;
