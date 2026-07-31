// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.0-VISIBILITY-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-loja-integrada
// PURPOSE: Integration Loja Integrada - Enterprise Component with Live Data
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
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
import { LifecycleManager } from './core/lifecycle.js';
import { CircuitBreaker } from './core/circuit-breaker.js';
import { StateStore } from './state/store.js';
import { Logger } from './telemetry/logger.js';
import { Tracker } from './telemetry/tracker.js';
export const MODULE_ID = 'panels/panel-integration-loja-integrada';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const getVersion = () => VERSION;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init(); const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p); export const getPorts = () => Ports.snapshot();
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
const CONFIG = { id: 'integration-loja-integrada', area: 'integration', label: 'Loja Integrada', emoji: '🏪', apiEndpoint: '/api/status/lojaintegrada.php', refreshInterval: 120000 };
export class IntegrationLojaIntegradaComponent {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) { _initPorts(); this.container = options.container || null; this.config = { ...CONFIG, ...(options.config as Record<string, unknown>) }; this.eventBus = options.eventBus || _getPort('eventBus'); this.store = new StateStore({ mounted: false, loading: false, error: null, data: null, ordersToday: 0, status: 'unknown' }); this.lifecycle = new LifecycleManager(this); this.circuitBreaker = new CircuitBreaker({ threshold: 3, timeout: 30000 }); this.logger = new Logger({ prefix: `[${MODULE_ID}]` }); this.tracker = new Tracker({ moduleId: MODULE_ID }); this._mounted = false; this._initialized = false; this._element = null; this._abortController = null; this._refreshTimer = null; this._metrics = { mountCount: 0, errorCount: 0, fetchCount: 0, lastFetchAt: null }; }
  _canRefresh() { if (!this._mounted) return false; if (!_isDocumentVisible()) return false; if (!_isAuthenticated()) return false; return true; }
  init(ctx: Record<string, unknown>) { if (this._initialized) return this; this._ctx = ctx || {}; this._initialized = true; return this; }
  mount(container: HTMLElement) { if (this._mounted) return Promise.resolve(this); this.container = container || this.container; if (!this.container) return Promise.resolve(this); if (!_isAuthenticated()) { this.container.innerHTML = '<div style="padding:1rem;text-align:center;color:#F59E0B;font-size:12px;">Login</div>'; return Promise.resolve(this); } this._abortController = new AbortController(); return this.lifecycle.mount().then(() => { this.render(); this._mounted = true; this.store.setState({ mounted: true }); this._metrics.mountCount++; this._fetchData(); this._startRefresh(); this.eventBus?.emit?.(COMPONENT_EVENTS.MOUNTED, { componentId: CONFIG.id, moduleId: MODULE_ID, timestamp: Date.now() }); return this; }).catch((e: Error) => { this._metrics.errorCount++; return this; }); }
  unmount() { if (!this._mounted) return Promise.resolve(this); this._abortController?.abort(); this._stopRefresh(); return this.lifecycle.unmount().then(() => { if (this.container) this.container.innerHTML = ''; this._mounted = false; this._element = null; this.store.setState({ mounted: false }); return this; }); }
  async _fetchData() { if (!this._canRefresh()) return; this.store.setState({ loading: true }); this._metrics.fetchCount++; this._metrics.lastFetchAt = Date.now(); try { const r = await fetch(this.config.apiEndpoint, { signal: this._abortController?.signal, credentials: 'include' }); if (!r.ok) throw new Error(`HTTP ${r.status}`); const j = await r.json(); if ((j.ok ?? j.success) && j.data) { this.store.setState({ loading: false, error: null, data: j.data, ordersToday: j.data.orders_today || 0, status: j.data.status || 'unknown' }); this._updateDisplay(); } } catch (e: any) { if (e.name !== 'AbortError') { this._metrics.errorCount++; this.store.setState({ loading: false, error: e.message }); } } }
  _startRefresh() { this._stopRefresh(); this._refreshTimer = setInterval(() => { if (this._canRefresh()) this._fetchData(); }, this.config.refreshInterval); }
  _stopRefresh() { if (this._refreshTimer) { clearInterval(this._refreshTimer); this._refreshTimer = null; } }
  render() { this._element = document.createElement('div'); this._element.className = `enterprise-component ${CONFIG.id}`; this._element.setAttribute('data-module-id', MODULE_ID); this._element.innerHTML = `<div class="panel-enterprise panel-${CONFIG.id}" title="${CONFIG.label}"><span class="integration-icon">${CONFIG.emoji}</span><span class="integration-label">${CONFIG.label}</span><span class="integration-value" data-metric="orders">--</span><span class="integration-indicator" data-metric="status"></span></div>`; this.container.innerHTML = ''; this.container.appendChild(this._element); }
  _updateDisplay() { if (!this._element) return; const s = this.store.getState(); const v = this._element.querySelector('.integration-value'); const i = this._element.querySelector('.integration-indicator'); if (v) v.textContent = s.ordersToday > 0 ? `${s.ordersToday} pedidos` : '✓'; if (i) { i.className = `integration-indicator ${s.status === 'online' ? 'status-ok' : 'status-error'}`; } }
  healthCheck() { const ps = Ports.snapshot(); const checks = { initialized: this._initialized, mounted: this._mounted, hasContainer: !!this.container, portsInitialized: ps._initialized, hasData: !!this.store.getState().data, isAuthenticated: _isAuthenticated(), abortControllerActive: !!this._abortController && !this._abortController.signal.aborted }; const passed = Object.values(checks).filter(Boolean).length; const maxScore = Object.keys(checks).length; return { status: passed === maxScore ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore, version: VERSION, moduleId: MODULE_ID, p22Compliant: true }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, metrics: this._metrics, state: this.store.getState() }; }
  getState() { return this.store.getState(); } getMetrics() { return { ...this._metrics }; } refresh() { if (this._canRefresh()) return this._fetchData(); return Promise.resolve(); }
}
let _currentInstance: IntegrationLojaIntegradaComponent | null = null;

// @ts-expect-error TS migration - TS2554
export const mount = (container, config) => { const i = new IntegrationLojaIntegradaComponent({ container, config }); i.init(); i.mount(container); _currentInstance = i; return { success: true, moduleId: MODULE_ID, instance: i }; };
export const unmount = () => { if (_currentInstance) { const instance = _currentInstance; _currentInstance = null; instance.unmount(); } return { success: true, moduleId: MODULE_ID }; };
export const destroy = () => unmount();
export const healthCheck = () => _currentInstance?.healthCheck() ?? { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
export default { IntegrationLojaIntegradaComponent, mount, unmount, destroy, healthCheck, getVersion, MODULE_ID, VERSION, injectPorts, getPorts };
