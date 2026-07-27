// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.5.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/state/store
// PURPOSE: Global state management store with subscribers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   StateUpdaters from ./updaters.js
//   StateSnapshots from ./snapshots.js
// PROVIDES:
//   StateStore (class) — central state store with pub/sub
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   getVersion() — return module version
// WINDOW:
//   Reads: (window as any).Environment
// ═══════════════════════════════════════════════════════════════
// State Store - Global State Management (Enterprise)
// @version 5.5.0-P17WI
// P17WI: PortsFactory/PortsProfiles
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { StateUpdaters } from './updaters.js';
import { StateSnapshots } from './snapshots.js';

export const VERSION = '5.5.0-P17WI';
export const MODULE_ID = 'header/state/store';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; } if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; } if (_debugEnabled()) logger.debug?.(`[${MODULE_ID}]`, ...args); };

const getInitialEnvironment = () => { if (typeof window !== 'undefined' && (window as any).Environment) { try { const env = (window as any).Environment.get('environment'); if (env) return env; } catch (e) {} } return 'PROD'; };

export class StateStore { [key: string]: any;
  // @ts-expect-error strict migration — TS2322
  constructor(logger: Record<string,unknown> = null) {
    this.logger = logger;
    this._metrics = { updateCount: 0, subscribeCount: 0, notifyCount: 0, snapshotCount: 0, rollbackCount: 0, lastUpdateAt: null };
    const initialEnv = getInitialEnvironment();
    this._state = { connectivity: { online: true, rttMs: null, lastCheckAt: Date.now(), timeoutCount: 0 }, alerts: { critical: 0, warning: 0, lastCheckAt: null }, sync: { busy: false, status: 'idle', lastSyncAt: null, failCount: 0 }, health: { status: 'unknown', checks: {}, responseTimeMs: null, degradedReason: null, lastCheckAt: null }, errors: { count: 0, lastError: null, lastErrorAt: null }, environment: initialEnv, scrolled: false, networkQuality: { rtt: null, effectiveType: null, downlink: null, status: 'unknown' } };
    this._subscribers = new Set(); this._isNotifying = false; this._pendingNotification = false;
    this.updaters = new StateUpdaters(this);
    this.snapshots = new StateSnapshots(10);
    this.snapshots.capture(this._state);
  }

  subscribe(callback: Function) { if (typeof callback !== 'function') throw new TypeError('Subscriber deve ser uma função'); this._subscribers.add(callback); this._metrics.subscribeCount++; return () => { this._subscribers.delete(callback); }; }

  _notifySubscribers() {
    if (this._isNotifying) { this._pendingNotification = true; return; }
    this._isNotifying = true; this._metrics.notifyCount++;
    const stateCopy = this.getState();
    this._subscribers.forEach((callback: Function) => { try { callback(stateCopy); } catch (error) { _log('error', 'Erro no subscriber:', error); } });
    this._isNotifying = false;
    if (this._pendingNotification) { this._pendingNotification = false; this._notifySubscribers(); }
  }

  getState() { return JSON.parse(JSON.stringify(this._state)); }
  updateConnectivity(data: Record<string,unknown>) { this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.updaters.updateConnectivity(data); }
  updateAlerts(data: Record<string,unknown>) { this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.updaters.updateAlerts(data); }
  updateSync(data: Record<string,unknown>) { this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.updaters.updateSync(data); }
  updateHealth(data: Record<string,unknown>) { this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.updaters.updateHealth(data); }
  updateErrors(data: Record<string,unknown>) { this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.updaters.updateErrors(data); }
  setEnvironment(env: unknown) { this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.updaters.setEnvironment(env); }
  setScrolled(scrolled: unknown) { this.updaters.setScrolled(scrolled); }
  updateNetworkQuality(data: Record<string,unknown>) { this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this.updaters.updateNetworkQuality(data); }
  incrementConnectivityTimeout() { this.updaters.incrementConnectivityTimeout(); }
  resetConnectivityTimeout() { this.updaters.resetConnectivityTimeout(); }
  incrementSyncFail() { this.updaters.incrementSyncFail(); }
  resetSyncFail() { this.updaters.resetSyncFail(); }
  clearErrors() { this.updaters.clearErrors(); }

  snapshot() { this._metrics.snapshotCount++; return this.snapshots.capture(this._state); }
  rollback(index = -1) { try { const previousState = this.snapshots.rollback(index); this._state = JSON.parse(JSON.stringify(previousState)); this._notifySubscribers(); this._metrics.rollbackCount++; _log('info', `Rollback para snapshot ${index}`); return true; } catch (error) { _log('error', 'Erro no rollback:', error); return false; } }
  getSnapshots() { return this.snapshots.getAll(); }

  reset() {
    const initialEnv = getInitialEnvironment();
    this._state = { connectivity: { online: true, rttMs: null, lastCheckAt: Date.now(), timeoutCount: 0 }, alerts: { critical: 0, warning: 0, lastCheckAt: null }, sync: { busy: false, status: 'idle', lastSyncAt: null, failCount: 0 }, health: { status: 'unknown', checks: {}, responseTimeMs: null, degradedReason: null, lastCheckAt: null }, errors: { count: 0, lastError: null, lastErrorAt: null }, environment: initialEnv, scrolled: false, networkQuality: { rtt: null, effectiveType: null, downlink: null, status: 'unknown' } };
    this._subscribers.clear(); this._isNotifying = false; this._pendingNotification = false;
    this.snapshots.clear(); this.snapshots.capture(this._state);
    _log('info', 'Store resetado');
  }

  getMetrics() { return { subscriberCount: this._subscribers.size, snapshotCount: this.snapshots.getCount(), isNotifying: this._isNotifying, pendingNotification: this._pendingNotification, ...this._metrics }; }

  healthCheck() {
    const checks = { hasState: !!this._state, hasUpdaters: !!this.updaters, hasSnapshots: !!this.snapshots, notNotifying: !this._isNotifying };
    const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([,v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), subscriberCount: this._subscribers.size, timestamp: new Date().toISOString() };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), subscriberCount: this._subscribers.size, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  resetMetrics() { this._metrics = { updateCount: 0, subscribeCount: 0, notifyCount: 0, snapshotCount: 0, rollbackCount: 0, lastUpdateAt: null }; }
}

export function getVersion() { return VERSION; }
export default StateStore;
