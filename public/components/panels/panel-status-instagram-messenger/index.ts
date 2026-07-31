// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.0-VISIBILITY-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-instagram-messenger
// PURPOSE: Status Instagram Messenger - Enterprise Component with Live Data
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   LifecycleManager from ./core/lifecycle.js
//   CircuitBreaker from ./core/circuit-breaker.js
//   StateStore from ./state/store.js
//   Logger from ./telemetry/logger.js
//   Tracker from ./telemetry/tracker.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   getVersion() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.SessionManager
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import { LifecycleManager } from './core/lifecycle.js';
import { CircuitBreaker } from './core/circuit-breaker.js';
import { StateStore } from './state/store.js';
import { Logger } from './telemetry/logger.js';
import { Tracker } from './telemetry/tracker.js';

export const MODULE_ID = 'panels/panel-status-instagram-messenger';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const getVersion = () => VERSION;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _isAuthenticated = () => {
  const auth = _getPort('auth');
  if (auth?.isAuthenticated?.()) return true;
  if (typeof window === 'undefined') return false;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const sm = window.Core.windowAdapter.get('SessionManager');
    if (sm?.isAuthenticated?.()) return true;
  }
  if (strictMode) return false;
  if (window.SessionManager?.isAuthenticated?.()) {
    recordViolation('WINDOW_SESSIONMANAGER_FALLBACK', { module: MODULE_ID, method: '_isAuthenticated' });
    return true;
  }
  return false;
};
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;

const CONFIG = { id: 'status-instagram-messenger', area: 'status', label: 'Instagram', icon: 'instagram', emoji: '📸', kind: 'panel-component', apiEndpoint: '/api/integrations/instagram/status.php', refreshInterval: 60000 };

export class StatusInstagramMessengerComponent {
  [key: string]: any;
  constructor(options: { container?: HTMLElement | null; config?: Record<string, unknown>; eventBus?: Record<string, unknown> } = {}) {
    _initPorts();
    this.container = options.container || null;
    this.config = { ...CONFIG, ...options.config };
    this.eventBus = options.eventBus || _getPort('eventBus');
    this.store = new StateStore({ mounted: false, loading: false, error: null, data: null, unread: 0, status: 'unknown' });
    this.lifecycle = new LifecycleManager(this);
    this.circuitBreaker = new CircuitBreaker({ threshold: 3, timeout: 30000 });
    this.logger = new Logger({ prefix: `[${MODULE_ID}]` });
    this.tracker = new Tracker({ moduleId: MODULE_ID });
    this._mounted = false; this._initialized = false; this._element = null; this._abortController = null; this._refreshTimer = null;
    this._metrics = { mountCount: 0, errorCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
  }

  _canRefresh() { if (!this._mounted) return false; if (!_isDocumentVisible()) return false; if (!_isAuthenticated()) return false; return true; }
  init(ctx: Record<string, unknown> = {}) { if (this._initialized) return this; this._ctx = ctx; this._initialized = true; this.tracker.track(LIFECYCLE_EVENTS.INITIALIZED, { config: this.config }); return this; }

  mount(container: HTMLElement | null) {
    if (this._mounted) return Promise.resolve(this);
    this.container = container || this.container;
    if (!this.container) return Promise.resolve(this);
    if (!_isAuthenticated()) { this.container.innerHTML = '<div style="padding:0.5rem;text-align:center;color:#F59E0B;font-size:10px;">🔒</div>'; return Promise.resolve(this); }
    this._abortController = new AbortController();
    return this.lifecycle.mount().then(() => {
      this.render(); this.attachEvents(); this._mounted = true; this.store.setState({ mounted: true });
      this._metrics.mountCount++; this._metrics.lastMountAt = Date.now();
      this._fetchData(); this._startRefresh();
      this.eventBus?.emit?.(COMPONENT_EVENTS.MOUNTED, { componentId: CONFIG.id, moduleId: MODULE_ID, timestamp: Date.now() });
      return this;
    }).catch((error: Error) => { this._metrics.errorCount++; this.tracker.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { error: error.message }); return this; });
  }

  unmount() {
    if (!this._mounted) return Promise.resolve(this);
    this._abortController?.abort(); this._stopRefresh(); this.detachEvents();
    return this.lifecycle.unmount().then(() => {
      if (this.container) this.container.innerHTML = ''; this._mounted = false; this._element = null; this.store.setState({ mounted: false });
      this.eventBus?.emit?.(COMPONENT_EVENTS.UNMOUNTED, { componentId: CONFIG.id, moduleId: MODULE_ID, timestamp: Date.now() }); return this;
    });
  }

  async _fetchData() {
    if (!this._canRefresh()) return;
    this.store.setState({ loading: true }); this._metrics.fetchCount++; this._metrics.lastFetchAt = Date.now();
    try {
      const response = await fetch(this.config.apiEndpoint, { signal: this._abortController?.signal, credentials: 'include', headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if ((result.ok ?? result.success) && result.data) {
        const unread = result.data.unread_count || 0;
        const status = result.data.status || 'unknown';
        this.store.setState({ loading: false, error: null, data: result.data, unread, status });
        this._updateDisplay();
      }
    } catch (error: any) { if (error.name !== 'AbortError') { this._metrics.errorCount++; this.store.setState({ loading: false, error: error.message }); } }
  }

  _startRefresh() { this._stopRefresh(); this._refreshTimer = setInterval(() => { if (this._canRefresh()) this._fetchData(); }, this.config.refreshInterval); }
  _stopRefresh() { if (this._refreshTimer) { clearInterval(this._refreshTimer); this._refreshTimer = null; } }

  render() {
    this._element = document.createElement('div');
    this._element.className = `enterprise-component ${CONFIG.id}`;
    this._element.setAttribute('data-module-id', MODULE_ID);
    this._element.setAttribute('data-version', VERSION);
    this._element.innerHTML = `<div class="panel-enterprise panel-${CONFIG.id}" title="Instagram Messenger"><span class="status-icon">${CONFIG.emoji}</span><span class="status-value" data-metric="unread">--</span><span class="status-indicator" data-metric="status"></span></div>`;
    this.container.innerHTML = ''; this.container.appendChild(this._element);
  }

  _updateDisplay() {
    if (!this._element) return;
    const state = this.store.getState();
    const valueEl = this._element.querySelector('.status-value');
    const indicatorEl = this._element.querySelector('.status-indicator');
    if (valueEl) valueEl.textContent = state.unread > 0 ? state.unread : '✓';
    if (indicatorEl) indicatorEl.className = `status-indicator ${state.status === 'connected' ? 'status-ok' : 'status-error'}`;
  }

  attachEvents() { this._unsubscribe = this.store.subscribe((state: Record<string, unknown>, prev: Record<string, unknown>) => { if (state.unread !== prev.unread || state.status !== prev.status) this._updateDisplay(); }); }
  detachEvents() { if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; } }
  healthCheck() { const ps = Ports.snapshot(); const checks = { initialized: this._initialized, mounted: this._mounted, hasContainer: !!this.container, portsInitialized: ps._initialized, hasData: !!this.store.getState().data, isAuthenticated: _isAuthenticated(), abortControllerActive: !!this._abortController && !this._abortController.signal.aborted }; const passed = Object.values(checks).filter(Boolean).length; const maxScore = Object.keys(checks).length; return { status: passed === maxScore ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore, version: VERSION, moduleId: MODULE_ID, p22Compliant: true }; }
  info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), portsInitialized: ps._initialized, p22Compliant: true, metrics: this._metrics, state: this.store.getState() }; }
  getState() { return this.store.getState(); }
  getMetrics() { return { ...this._metrics }; }
  refresh() { if (this._canRefresh()) return this._fetchData(); return Promise.resolve(); }
}

let _currentInstance: StatusInstagramMessengerComponent | null = null;

export const mount = (container: any, config: any) => { const instance = new StatusInstagramMessengerComponent({ container, config }); instance.init(); instance.mount(container); _currentInstance = instance; return { success: true, moduleId: MODULE_ID, instance }; };
export const unmount = () => { if (_currentInstance) { const instance = _currentInstance; _currentInstance = null; instance.unmount(); } return { success: true, moduleId: MODULE_ID }; };
export const destroy = () => unmount();
export const healthCheck = () => _currentInstance?.healthCheck() ?? { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
export default { StatusInstagramMessengerComponent, mount, unmount, destroy, healthCheck, getVersion, MODULE_ID, VERSION, injectPorts, getPorts };
