// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.9.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal.state.store
// PURPOSE: Login Modal - Store (State Management)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STORE_EVENTS — exported value
//   MODAL_STATES — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   LoginModalStore — exported class
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.9.0-ENTERPRISE';
export const MODULE_ID = 'login-modal.state.store';

export const STORE_EVENTS = { CHANGE: 'store:change' };

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;

const _log = (level: string, ...args: any[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[login-store]';
  if (level === 'error') { logger.error?.(prefix, ...args); return; }
  if (level === 'warn') { logger.warn?.(prefix, ...args); return; }
  if (level === 'info') { logger.info?.(prefix, ...args); return; }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};

export const MODAL_STATES = { CLOSED: 'CLOSED', OPENING: 'OPENING', OPEN: 'OPEN', CLOSING: 'CLOSING', BUSY: 'BUSY', ERROR: 'ERROR' };

export class LoginModalStore {
  [key: string]: any;
  constructor(config: Record<string, any> = {}) {
    _initPorts();
    this.config = config;
    this.eventBus = config.eventBus || _getPort('eventBus');
    this.state = { status: MODAL_STATES.CLOSED, busy: false, error: null, user: null, lastAction: null, lastActionAt: null };
    this.listeners = new Set();
    this._mounted = false;
    this._metrics = { stateChanges: 0, busyToggles: 0, errors: 0 };
  }

  mount() { if (this._mounted) return; this._mounted = true; _log('info', 'Store montado'); }
  unmount() { if (!this._mounted) return; this.listeners.clear(); this._mounted = false; _log('info', 'Store desmontado'); }
  getState() { return { ...this.state }; }

  setState(partial: Record<string, unknown>) {
    this._metrics.stateChanges++;
    const prev = { ...this.state };
    this.state = { ...this.state, ...partial, lastActionAt: Date.now() };
    this._notify(prev, this.state);
  }

  setStatus(status: string) { this.setState({ status, lastAction: `status:${status}` }); }

  setBusy(busy: boolean) {
    this._metrics.busyToggles++;
    const newStatus = busy ? MODAL_STATES.BUSY : (this.state.status === MODAL_STATES.BUSY ? MODAL_STATES.OPEN : this.state.status);
    this.setState({ busy, status: newStatus, lastAction: `busy:${busy}` });
  }

  setError(error: unknown) { this._metrics.errors++; this.setState({ error, status: MODAL_STATES.ERROR, lastAction: 'error' }); }

  clearError() {
    const newStatus = this.state.busy ? MODAL_STATES.BUSY : MODAL_STATES.OPEN;
    this.setState({ error: null, status: newStatus, lastAction: 'clear-error' });
  }

  setUser(user: Record<string, unknown> | null) { this.setState({ user, lastAction: 'set-user' }); }
  open() { this.setState({ status: MODAL_STATES.OPEN, error: null, lastAction: 'open' }); }
  close() { this.setState({ status: MODAL_STATES.CLOSED, busy: false, error: null, lastAction: 'close' }); }

  reset() {
    this.state = { status: MODAL_STATES.CLOSED, busy: false, error: null, user: null, lastAction: 'reset', lastActionAt: Date.now() };
    this._notify({}, this.state);
    _log('info', 'Store resetado');
  }

  isOpen() { return this.state.status === MODAL_STATES.OPEN || this.state.status === MODAL_STATES.BUSY; }
  isBusy() { return this.state.busy || this.state.status === MODAL_STATES.BUSY; }
  hasError() { return !!this.state.error || this.state.status === MODAL_STATES.ERROR; }

  subscribe(callback: (next: Record<string, unknown>, prev: Record<string, unknown>) => void) { this.listeners.add(callback); return () => this.listeners.delete(callback); }

  _notify(prev: Record<string, unknown>, next: Record<string, unknown>) {
    this.listeners.forEach((callback: (next: Record<string, unknown>, prev: Record<string, unknown>) => void) => { try { callback(next, prev); } catch (error) { _log('error', 'Erro em subscriber:', error); } });
    this.eventBus?.emit?.(STORE_EVENTS.CHANGE, { prev, next });
  }

  getStatus() { return { mounted: this._mounted, state: this.getState(), subscriberCount: this.listeners.size, metrics: { ...this._metrics } }; }

  info() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, portsInitialized: Ports.isInitialized(), loggerAvailable: !!_getPort('logger'), state: this.getState(), subscriberCount: this.listeners.size, metrics: { ...this._metrics }, timestamp: Date.now() };
  }

  healthCheck() {
    const checks = { isMounted: this._mounted, validStatus: Object.values(MODAL_STATES).includes(this.state.status), noStuckBusy: !this.state.busy || (Date.now() - (this.state.lastActionAt || 0)) < 60000, lowErrorCount: this._metrics.errors < 100, loggerAvailable: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const status = passed >= 5 ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY');
    return { status, score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
}

export default LoginModalStore;
export { LoginModalStore as StateStore };
