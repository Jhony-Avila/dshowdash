// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.9.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.state.store
// PURPOSE: Footer State Store - Reactive state management
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract FOOTER_STORE - FooterStore class for state management
// @contract INIT - init() initializes store
// @contract GET_STATE - getState() returns current state
// @contract SET_STATE - setState() updates state
// @contract SUBSCRIBE - subscribe() registers state change listener
// @contract DESTROY - destroy() cleans up store
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
//   FooterStore — exported class
//   store — exported singleton instance
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v5.9.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v5.8.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.9.0-P2-ENTERPRISE';
export const MODULE_ID = 'footer.store';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { logger.error?.(prefix, ...args); return; }
  if (level === 'warn') { logger.warn?.(prefix, ...args); return; }
  if (level === 'info') { logger.info?.(prefix, ...args); return; }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};

let _metrics = { initCount: 0, onlineChanges: 0, tickCount: 0, errors: 0 };

export class FooterStore {
  [key: string]: any;
  constructor() {
    this.state = {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastUpdate: null,
      version: null,
      environment: null,
      mounted: false,
      sessionStart: Date.now()
    };
    this._listeners = new Set();
    this._timers = new Map();
    this._initialized = false;
  }

  init(config: { version?: string; environment?: string; debug?: boolean } = {}) {
    if (this._initialized) return;
    _initPorts();
    _metrics.initCount++;
    const cfg = _getPort('config');
    this.state.version = config.version || cfg?.app?.version || '0.0.0';
    this.state.environment = config.environment || cfg?.app?.env || 'production';
    this.state.sessionStart = Date.now();
    this._initialized = true;
    _log('info', 'Store initialized');
  }

  getState() { return { ...this.state }; }

  getStatus() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      initialized: this._initialized,
      state: this.getState(),
      timerCount: this._timers.size,
      subscriberCount: this._listeners.size,
      metrics: this.getMetrics(),
      timestamp: Date.now()
    };
  }

  setState(partial: unknown) {
    const prev = { ...this.state };
    // @ts-expect-error TS migration - TS2698
    this.state = { ...this.state, ...partial };
    this._notify(prev, this.state);
  }

  setOnline(online: unknown) {
    if (this.state.online !== online) {
      _metrics.onlineChanges++;
      this.setState({ online });
    }
  }

  setMounted(mounted: unknown) { this.setState({ mounted }); }

  setTimer(name: string, timerId: string) {
    if (this._timers.has(name)) clearInterval(this._timers.get(name));
    this._timers.set(name, timerId);
  }

  clearTimer(name: string) {
    if (this._timers.has(name)) {
      clearInterval(this._timers.get(name));
      this._timers.delete(name);
    }
  }

  getSessionElapsed() { return Date.now() - (this.state.sessionStart || Date.now()); }

  tick() {
    _metrics.tickCount++;
    this.setState({ lastUpdate: Date.now() });
  }

  subscribe(callback: Function) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify(prev: unknown, next: unknown) {
    this._listeners.forEach((cb: Function) => {
      try { cb(next, prev); } catch (e) { _metrics.errors++; _log('error', 'Subscriber error:', e); }
    });
  }

  destroy() {
    this._timers.forEach((timerId: string) => clearInterval(timerId));
    this._timers.clear();
    this._listeners.clear();
    this._initialized = false;
    _log('info', 'Store destroyed');
  }

  getMetrics() { return { ..._metrics }; }

  info() {
    const portsSnapshot = Ports.snapshot();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      state: this.getState(),
      initialized: this._initialized,
      subscriberCount: this._listeners.size,
      timerCount: this._timers.size,
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  }

  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = {
      initialized: this._initialized,
      validState: !!this.state,
      lowErrors: _metrics.errors < 10,
      sessionActive: !!this.state.sessionStart,
      portsInitialized: portsSnapshot._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? 'HEALTHY' : 'DEGRADED',
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      metrics: _metrics,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }
}

export const store = new FooterStore();
export default FooterStore;
