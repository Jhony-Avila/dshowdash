// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.5.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/event-bus
// PURPOSE: Event Bus interno do Header com circuit breaker e historico
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   VERSION — versao do modulo
//   MODULE_ID — identificacao do modulo
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
//   HeaderEventBus (class) — event bus com circuit breaker
//     .on(eventName, callback, options) — registra listener
//     .once(eventName, callback, options) — listener one-shot
//     .off(eventName, callback) — remove listener
//     .emit(eventName, data) — emite evento
//     .getHistory(eventName) — historico de eventos
//     .clearHistory() — limpa historico
//     .clear() — remove todos os listeners
//     .listenerCount(eventName) — conta listeners
//     .getRegisteredEvents() — lista eventos registrados
//     .getMetrics() — metricas do bus
//     .resetMetrics() — reseta metricas
//     .healthCheck() — health check
//     .info() — informacoes do bus
//     .destroy() — destroi instancia
//   getVersion() — retorna versao
// ═══════════════════════════════════════════════════════════════

// Header - Internal Event Bus Enterprise
// @version 5.5.0-P17WI
// P17WI: PortsFactory/PortsProfiles
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.5.0-P17WI';
export const MODULE_ID = 'header/core/event-bus';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => { const L = _getPort('logger'); if (!L) return; if (level === 'error') { L.error?.(`[${MODULE_ID}]`, ...args); return; } if (level === 'warn') { L.warn?.(`[${MODULE_ID}]`, ...args); return; } if (_debugEnabled()) L.debug?.(`[${MODULE_ID}]`, ...args); };

export class HeaderEventBus {
  [key: string]: any;
  constructor(instanceId = 'default') { this.instanceId = instanceId; this.listeners = new Map(); this.eventHistory = []; this.maxHistorySize = 50; this.isDestroyed = false; this._metrics = { totalEmitted: 0, totalListeners: 0, errors: 0, lastEventTime: null }; this.circuitBreaker = { failures: 0, maxFailures: 5, resetTimeout: 30000, isOpen: false, lastFailureTime: null }; this._initHealthCheck(); _log('info', `HeaderEventBus created: ${instanceId}`); }

  _initHealthCheck() { this.healthCheckInterval = setInterval(() => { if (this.isDestroyed) { clearInterval(this.healthCheckInterval); return; } if (this.circuitBreaker.isOpen && Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.resetTimeout) { this.circuitBreaker.isOpen = false; this.circuitBreaker.failures = 0; _log('info', 'Circuit breaker auto-reset'); } }, 5000); }

  _validateEventName(eventName: string) { if (!eventName || typeof eventName !== 'string') throw new TypeError('Event name must be a non-empty string'); return true; }
  _validateCallback(callback: Function) { if (typeof callback !== 'function') throw new TypeError('Callback must be a function'); return true; }

  // @ts-expect-error TS migration - TS2339
  on(eventName: string, callback: Function, options: { once?: boolean; priority?: number } = {}) { if (this.isDestroyed) { _log('warn', 'Bus destroyed - on() ignored'); return () => {}; } this._validateEventName(eventName); this._validateCallback(callback); if (!this.listeners.has(eventName)) this.listeners.set(eventName, []); const existing = this.listeners.get(eventName).find((l: unknown) => l.callback === callback); if (existing) { _log('debug', `Duplicate listener ignored: ${eventName}`); return () => this.off(eventName, callback); } const listener = { callback, once: options.once || false, priority: options.priority || 0, id: `${eventName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, registeredAt: Date.now() }; this.listeners.get(eventName).push(listener); this.listeners.get(eventName).sort((a: unknown, b: unknown) => b.priority - a.priority); this._metrics.totalListeners++; _log('debug', `Listener registered: ${eventName}`); return () => this.off(eventName, callback); }

  once(eventName: string, callback: Function, options: { once?: boolean; priority?: number } = {}) { return this.on(eventName, callback, { ...options, once: true }); }
  // @ts-expect-error TS migration - TS2339
  off(eventName: string, callback: Function) { if (this.isDestroyed) return false; if (!this.listeners.has(eventName)) return false; const callbacks = this.listeners.get(eventName); const index = callbacks.findIndex((l: unknown) => l.callback === callback); if (index > -1) { callbacks.splice(index, 1); if (callbacks.length === 0) this.listeners.delete(eventName); _log('debug', `Listener removed: ${eventName}`); return true; } return false; }

  // @ts-expect-error TS migration - TS2345
  emit(eventName: string, data: Record<string, unknown> = {}) { if (this.isDestroyed) { _log('warn', 'Bus destroyed - emit() ignored'); return 0; } this._validateEventName(eventName); if (this.circuitBreaker.isOpen) { _log('warn', `Circuit breaker open - emit blocked: ${eventName}`); return 0; } const timestamp = Date.now(); this._metrics.lastEventTime = timestamp; this._metrics.totalEmitted++; this._addToHistory({ eventName, data, timestamp }); if (!this.listeners.has(eventName)) { _log('debug', `Event without listeners: ${eventName}`); return 0; } const listeners = [...this.listeners.get(eventName)]; let executedCount = 0; for (const listener of listeners) { try { Promise.resolve().then(() => { listener.callback({ ...data, _meta: { eventName, timestamp, instanceId: this.instanceId, listenerId: listener.id } }); }).catch(error => { this._handleListenerError(error); }); executedCount++; if (listener.once) this.off(eventName, listener.callback); } catch (error) { this._metrics.errors++; this._handleListenerError(error); } } _log('debug', `Event emitted: ${eventName} (${executedCount} listeners)`); return executedCount; }

  _handleListenerError(error: unknown) { this.circuitBreaker.failures++; this.circuitBreaker.lastFailureTime = Date.now(); if (this.circuitBreaker.failures >= this.circuitBreaker.maxFailures) { this.circuitBreaker.isOpen = true; _log('error', `Circuit breaker OPENED after ${this.circuitBreaker.failures} failures`); } }

  _addToHistory(event: string) { this.eventHistory.push(event); if (this.eventHistory.length > this.maxHistorySize) this.eventHistory.shift(); }
  // @ts-expect-error TS migration - TS2339
  getHistory(eventName: string = null) { if (eventName) return this.eventHistory.filter((e: Event) => e.eventName === eventName); return [...this.eventHistory]; }
  clearHistory() { this.eventHistory = []; }
  clear() { this.listeners.clear(); this._metrics.totalListeners = 0; _log('info', 'All listeners removed'); }
  listenerCount(eventName: string) { return this.listeners.get(eventName)?.length || 0; }
  getRegisteredEvents() { return Array.from(this.listeners.keys()); }
  getMetrics() { return { ...this._metrics, activeListeners: this.listeners.size, historySize: this.eventHistory.length, circuitBreakerStatus: this.circuitBreaker.isOpen ? 'OPEN' : 'CLOSED', circuitBreakerFailures: this.circuitBreaker.failures, isHealthy: !this.circuitBreaker.isOpen && !this.isDestroyed }; }
  resetMetrics() { Object.keys(this._metrics).forEach(k => { this._metrics[k] = typeof this._metrics[k] === 'number' ? 0 : null; }); }
  setDebugMode(enabled: boolean) { }
  setDebug(enabled: boolean) { }

  healthCheck() { const checks = { notDestroyed: !this.isDestroyed, circuitBreakerClosed: !this.circuitBreaker.isOpen, listenersMapReady: this.listeners instanceof Map, historyReady: Array.isArray(this.eventHistory), noExcessiveErrors: this._metrics.errors < 100 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= total - 1 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([,v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, instanceId: this.instanceId, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }

  info() { return { version: VERSION, moduleId: MODULE_ID, instanceId: this.instanceId, registeredEvents: this.getRegisteredEvents().length, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() }; }
  getVersion() { return VERSION; }
  destroy() { if (this.isDestroyed) return; this.isDestroyed = true; this.clear(); this.clearHistory(); if (this.healthCheckInterval) clearInterval(this.healthCheckInterval); _log('info', 'HeaderEventBus destroyed'); }
}

export function getVersion() { return VERSION; }
export default HeaderEventBus;