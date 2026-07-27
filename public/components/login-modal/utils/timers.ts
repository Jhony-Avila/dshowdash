// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-utils-timers
// PURPOSE: Login Modal - Timers Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TIMER_KEYS — exported value
//   TimersManager — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '5.5.0-ENTERPRISE';
export const MODULE_ID = 'login-modal-utils-timers';

const isBrowser = typeof window !== 'undefined';

export const TIMER_KEYS = { ERROR_AUTO_HIDE: 'error:auto-hide', ERROR_COUNTDOWN: 'error:countdown', VIDEO_LOAD: 'video:load-timeout', RATE_LIMIT_RESET: 'rate-limit:reset', SESSION_CHECK: 'session:check' };

export class TimersManager {
  [key: string]: any;
  constructor(config: Record<string, any> = {}) {
    this.config = config; this.namespace = config.namespace || 'login-modal'; this.telemetry = config.telemetry || null; this.ignorePagehide = config.ignorePagehide || false;
    this.timers = new Map(); this.intervals = new Map(); this.abortController = new AbortController(); this.abortSignal = this.abortController.signal;
    this.metrics = { created: 0, expired: 0, cancelled: 0, aborted: 0 };
    if (!this.ignorePagehide) this._bindPagehide();
  }

  set(name: string, callback: () => void, delay: number) { const key = this._namespaceKey(name); this.clear(key, { skipNamespace: true }); const wrappedCallback = () => { callback(); this.timers.delete(key); this.metrics.expired++; this._track('timer:expired', { name: key, delay }); }; const timerId = setTimeout(wrappedCallback, delay); this.timers.set(key, { id: timerId, type: 'timeout', startedAt: Date.now(), delay, callback }); this.metrics.created++; return timerId; }

  interval(name: string, callback: () => void, delay: number, options: Record<string, unknown> = {}) { const key = this._namespaceKey(name); this.clearInterval(key, { skipNamespace: true }); const driftCorrection = options.driftCorrection !== false; const expectedInterval = delay; let expectedTime = Date.now() + expectedInterval; const wrappedCallback = () => { callback(); if (driftCorrection) { const drift = Date.now() - expectedTime; expectedTime += expectedInterval; const nextDelay = Math.max(0, expectedInterval - drift); const intervalId = setTimeout(wrappedCallback, nextDelay); const current = this.intervals.get(key); if (current) current.id = intervalId; } }; const intervalId = driftCorrection ? setTimeout(wrappedCallback, delay) : setInterval(callback, delay); this.intervals.set(key, { id: intervalId, type: 'interval', startedAt: Date.now(), delay, driftCorrection, callback }); this.metrics.created++; return intervalId; }

  wait(name: string, delay: number) { const key = this._namespaceKey(name); return new Promise((resolve, reject) => { const wrappedCallback = () => { resolve({ name: key, elapsed: delay }); }; const timerId = this._setInternal(key, wrappedCallback, delay); this.abortSignal.addEventListener('abort', () => { this.clear(key, { skipNamespace: true }); reject(new Error(`Timer ${key} aborted`)); }, { once: true }); }); }

  _setInternal(key: string, callback: () => void, delay: number) { this.clear(key, { skipNamespace: true }); const wrappedCallback = () => { callback(); this.timers.delete(key); this.metrics.expired++; this._track('timer:expired', { name: key, delay }); }; const timerId = setTimeout(wrappedCallback, delay); this.timers.set(key, { id: timerId, type: 'timeout', startedAt: Date.now(), delay, callback }); this.metrics.created++; return timerId; }

  clear(name: string, options: Record<string, unknown> = {}) { const key = options.skipNamespace ? name : this._namespaceKey(name); const timer = this.timers.get(key); if (timer) { clearTimeout(timer.id); this.timers.delete(key); this.metrics.cancelled++; this._track('timer:cancelled', { name: key }); } }
  clearInterval(name: string, options: Record<string, unknown> = {}) { const key = options.skipNamespace ? name : this._namespaceKey(name); const interval = this.intervals.get(key); if (interval) { if (interval.driftCorrection) clearTimeout(interval.id); else clearInterval(interval.id); this.intervals.delete(key); this.metrics.cancelled++; this._track('interval:cancelled', { name: key }); } }
  clearAll() { this.timers.forEach((timer: any) => clearTimeout(timer.id)); this.timers.clear(); this.intervals.forEach((interval: any) => { if (interval.driftCorrection) clearTimeout(interval.id); else clearInterval(interval.id); }); this.intervals.clear(); this._track('timers:cleared-all', { count: this.metrics.created }); }
  abort() { this.abortController.abort(); this.clearAll(); this.metrics.aborted++; this._track('timers:aborted', { totalAborted: this.metrics.aborted }); }
  has(name: string) { const key = this._namespaceKey(name); return this.timers.has(key) || this.intervals.has(key); }
  getMetadata(name: string) { const key = this._namespaceKey(name); const timer = this.timers.get(key) || this.intervals.get(key); if (!timer) return null; return { type: timer.type, startedAt: timer.startedAt, delay: timer.delay, elapsed: Date.now() - timer.startedAt, driftCorrection: timer.driftCorrection || false }; }
  getMetrics() { return { ...this.metrics, active: this.timers.size + this.intervals.size }; }
  resetMetrics() { this.metrics = { created: 0, expired: 0, cancelled: 0, aborted: 0 }; }
  _namespaceKey(name: string) { if (name.startsWith(`${this.namespace}:`)) return name; if (name.includes(':')) return `${this.namespace}:${name}`; return `${this.namespace}:${name}`; }
  _bindPagehide() { if (!isBrowser) return; window.addEventListener('pagehide', () => { this.clearAll(); }, { once: true }); }
  _track(event: string, detail: Record<string, unknown> = {}) { if (this.telemetry && typeof this.telemetry === 'function') this.telemetry(event, { ...detail, timestamp: Date.now(), source: 'timers-manager' }); }
  info() { return { moduleId: MODULE_ID, version: VERSION, metrics: this.getMetrics(), activeTimers: this.timers.size, activeIntervals: this.intervals.size, namespace: this.namespace, timestamp: Date.now() }; }
  healthCheck() { const checks = { notAborted: !this.abortSignal.aborted, reasonableActiveCount: (this.timers.size + this.intervals.size) < 50, lowCancelRate: this.metrics.created === 0 || (this.metrics.cancelled / this.metrics.created) < 0.9 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, healthy: passed >= 2, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
}

export default TimersManager;
