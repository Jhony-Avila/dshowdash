// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-analytics
// PURPOSE: Analytics - Enterprise AAA Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
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
//   createAnalytics() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   UI_EVENTS.ACTION
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { LifecycleManager } from './core/lifecycle.js';
import { CircuitBreaker as _CircuitBreakerImport } from './core/circuit-breaker.js';
const CircuitBreaker = _CircuitBreakerImport as new (options: Record<string, unknown>) => Record<string, unknown>;
import { StateStore } from './state/store.js';
import { Logger as _LoggerImport } from './telemetry/logger.js';
const Logger = _LoggerImport as unknown as new (options: Record<string, unknown>) => Record<string, unknown>;
import { Tracker } from './telemetry/tracker.js';

export const MODULE_ID = 'panels/panel-analytics';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const getVersion = () => VERSION;

const SVGS = { barChart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>' };

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isAuthenticated = () => { const auth = _getPort('auth'); return auth?.isAuthenticated?.() ?? false; };
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const CONFIG = { id: 'analytics', area: 'panel', label: 'Analytics', icon: 'analytics', svgIcon: SVGS.barChart, kind: 'panel-component' };
let _debug = false;

const emitUIAction = (eventBus: Record<string, any>, data: Record<string, any> = {}) => { if (!eventBus?.emit) return; eventBus.emit(UI_EVENTS.ACTION, { actionId: `panel:${CONFIG.id}`, source: MODULE_ID, timestamp: Date.now(), meta: { label: CONFIG.label, icon: CONFIG.icon, kind: CONFIG.kind, ...data } }); };

export class AnalyticsComponent {
  [key: string]: any;
  constructor(options: { container?: HTMLElement | null; config?: Record<string, any>; eventBus?: Record<string, any> } = {}) {
    _initPorts();
    this.container = options.container || null;
    this.config = { ...CONFIG, ...options.config };
    this.eventBus = options.eventBus || _getPort('eventBus');
    this.store = new StateStore({ mounted: false, loading: false, error: null, data: null });
    this.lifecycle = new LifecycleManager(this);
    this.circuitBreaker = new CircuitBreaker({ threshold: 3, timeout: 30000 });
    this.logger = new Logger({ prefix: `[${MODULE_ID}]` });
    this.tracker = new Tracker({ moduleId: MODULE_ID });
    this._mounted = false;
    this._initialized = false;
    this._element = null;
    this._abortController = null;
    this._metrics = { mountCount: 0, errorCount: 0, lastMountAt: null };
  }

  init(ctx: Record<string, unknown>) { if (this._initialized) return this; this._ctx = ctx || {}; this._initialized = true; this.logger.debug('Initialized'); this.tracker.track('init', { config: this.config }); return this; }

  mount(container: HTMLElement | null) {
    if (this._mounted) { this.logger.warn('Already mounted'); return Promise.resolve(this); }
    this.container = container || this.container;
    if (!this.container) { this.logger.error('No container provided'); return Promise.resolve(this); }
    this._abortController = new AbortController();
    return this.lifecycle.mount().then(() => {
      this.render(); this.attachEvents(); this._mounted = true; this.store.setState({ mounted: true });
      this._metrics.mountCount++; this._metrics.lastMountAt = Date.now();
      this.eventBus?.emit?.(COMPONENT_EVENTS.MOUNTED, { componentId: CONFIG.id, moduleId: MODULE_ID, timestamp: Date.now() });
      emitUIAction(this.eventBus, { action: 'mount' });
      this.logger.debug('Mounted successfully'); this.tracker.track('mount', { success: true });
      return this;
    }).catch((error: Error) => { this._metrics.errorCount++; this.logger.error('Mount failed:', error); this.tracker.track('mount', { success: false, error: error.message }); this.store.setState({ error: error.message }); return this; });
  }

  unmount() {
    if (!this._mounted) return Promise.resolve(this);
    if (this._abortController) this._abortController.abort();
    this.detachEvents();
    return this.lifecycle.unmount().then(() => {
      if (this.container) this.container.innerHTML = '';
      this._mounted = false; this._element = null; this.store.setState({ mounted: false });
      this.eventBus?.emit?.(COMPONENT_EVENTS.UNMOUNTED, { componentId: CONFIG.id, moduleId: MODULE_ID, timestamp: Date.now() });
      this.logger.debug('Unmounted'); this.tracker.track('unmount', { success: true });
      return this;
    }).catch((error: Error) => { this.logger.error('Unmount failed:', error); return this; });
  }

  render() {
    this._element = document.createElement('div');
    this._element.className = `enterprise-component ${CONFIG.id}`;
    this._element.setAttribute('data-module-id', MODULE_ID);
    this._element.setAttribute('data-version', VERSION);
    this._element.innerHTML = `<div class="panel-enterprise panel-${CONFIG.id}"><div class="panel-enterprise__header"><h1 class="panel-enterprise__title">${CONFIG.svgIcon} ${CONFIG.label}</h1><span class="panel-enterprise__version">v${VERSION}</span></div><div class="panel-enterprise__content"><p class="panel-enterprise__subtitle">Este módulo está em desenvolvimento</p><p class="panel-enterprise__desc">Componente enterprise com arquitetura AAA completa.</p></div><div class="panel-enterprise__footer"><span class="panel-enterprise__status" data-status="ready">Ready</span></div></div>`;
    this.container.innerHTML = '';
    this.container.appendChild(this._element);
  }

  attachEvents() { this._unsubscribe = this.store.subscribe((state: Record<string, unknown>, prev: Record<string, unknown>) => this._onStateChange(state, prev)); }
  detachEvents() { if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; } }
  _onStateChange(state: Record<string, unknown>, prev: Record<string, unknown>) { if (!state || !prev) return; if (state.loading !== prev.loading) this._updateLoadingUI(state.loading as boolean); if (state.error !== prev.error && state.error) this._showError(state.error as string); }
  _updateLoadingUI(loading: boolean) { const statusEl = this._element?.querySelector('[data-status]'); if (statusEl) { statusEl.setAttribute('data-status', loading ? 'loading' : 'ready'); statusEl.textContent = loading ? 'Loading...' : 'Ready'; } }
  _showError(error: string) { this.logger.error('Component error:', error); }

  healthCheck() { const portsSnapshot = Ports.snapshot(); const checks = { initialized: this._initialized, mounted: this._mounted, hasContainer: !!this.container, storeHealthy: this.store.healthCheck().status === 'healthy', lifecycleHealthy: this.lifecycle.healthCheck().status === 'healthy', portsInitialized: portsSnapshot._initialized, abortControllerActive: !!this._abortController && !this._abortController.signal.aborted }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed > total / 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, p22Compliant: true, timestamp: new Date().toISOString() }; }
  info() { const portsSnapshot = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, config: this.config, mounted: this._mounted, initialized: this._initialized, metrics: this._metrics, state: this.store.getState(), portsInitialized: portsSnapshot._initialized, p22Compliant: true, healthCheck: this.healthCheck() }; }
  getState() { return this.store.getState(); }
  setDebug(enabled: boolean) { _debug = !!enabled; this._debug = !!enabled; this.logger.setLevel(enabled ? 'debug' : 'info'); }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { mountCount: 0, errorCount: 0, lastMountAt: null }; }
}

export const createAnalytics = (options: { container?: HTMLElement | null; config?: Record<string, any>; eventBus?: Record<string, any> } = {}) => new AnalyticsComponent(options);
let _currentInstance: AnalyticsComponent | null = null;

// @ts-expect-error TS migration - TS2554
export const mount = (container: HTMLElement, config: Record<string, any> = {}) => { if (!_isAuthenticated()) { return { success: false, moduleId: MODULE_ID, error: "not-authenticated" }; } const instance = new AnalyticsComponent({ container, config }); instance.init(); instance.mount(container); _currentInstance = instance; return { success: true, moduleId: MODULE_ID, instance }; };
export const unmount = () => { if (_currentInstance) { const instance = _currentInstance; _currentInstance = null; instance.unmount(); } return { success: true, moduleId: MODULE_ID }; };
export const destroy = () => unmount();
export const healthCheck = () => { const hc = (_currentInstance?.healthCheck() ?? { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }) as Record<string, unknown>; hc.isDocumentVisible = _isDocumentVisible(); return hc; };

export default { AnalyticsComponent, createAnalytics, mount, unmount, destroy, healthCheck, getVersion, MODULE_ID, VERSION, injectPorts, getPorts };
