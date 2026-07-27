// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-19
// PURPOSE: Painel-19 - Gráfico Taxa de Sucesso
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   startCountdown, stopCountdown, toggleAutoRefresh, pause, resume, REFRESH_INTE...
//   setupStateSubscription, setupEventListeners, cleanupEventListeners from ./eve...
//   ApiClient from ./services/api.js
//   StateStore from ./state/store.js
//   UIComponent from ./ui/component.js
//   CircuitBreaker from ./utils/circuit-breaker.js
//   PAINEL_ID from ./core/constants.js
//   STATES from ./core/states.js
//   CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, DEFAULT_PERFORMANCE_METRI...
//   renderStructure from ./core/template.js
//   DataLoader from ./core/data-loader.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   mount() — exported function
//   unmount() — exported function
//   getStatus() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import { startCountdown, stopCountdown, toggleAutoRefresh, pause, resume, REFRESH_INTERVAL } from './countdown.js';
import { setupStateSubscription, setupEventListeners, cleanupEventListeners } from './event-setup.js';
import { ApiClient } from './services/api.js';
import { StateStore } from './state/store.js';
import { UIComponent } from './ui/component.js';
import { CircuitBreaker } from './utils/circuit-breaker.js';
import { PAINEL_ID } from './core/constants.js';
import { STATES } from './core/states.js';
import { CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, DEFAULT_PERFORMANCE_METRICS } from './core/config.js';
import { renderStructure } from './core/template.js';
import { DataLoader } from './core/data-loader.js';

declare const PanelLogger: new (...args: any[]) => any;
declare const Telemetry: new (...args: any[]) => any;
export const MODULE_ID = 'panel-19';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const hasDocument = typeof document !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const loadCSS = () => { const cssPath = '/components/panels/panel-19/styles/index.css'; const al = _getPort('assetLoader'); if (al?.loadCSS) al.loadCSS(cssPath); else if (hasDocument && !document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; link.setAttribute('data-painel', MODULE_ID); document.head.appendChild(link); } };

(() => { _initPorts(); loadCSS(); })();

class Painel19 {
  [key: string]: any;
  constructor() {
    this.container = null; this.uiComponent = null;
    this.logger = new PanelLogger(PAINEL_ID, VERSION);
    this.telemetry = new Telemetry(PAINEL_ID, VERSION);
    this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, this.logger);
    this.apiClient = new ApiClient(PAINEL_ID, this.logger);
    this.store = new StateStore(this.logger);
    this.eventBus = null; this.state = STATES.IDLE; this.mounted = false; this.initialLoadDone = false; this.destroyed = false;
    this.consecutiveErrors = 0; this.isDegraded = false; this.lastLoadTime = 0; this.loadCount = 0;
    this.abortController = null; this.unsubscribers = [];
    this.performanceMetrics = { ...DEFAULT_PERFORMANCE_METRICS };
    this.dataLoader = null; this.autoRefreshEnabled = true; this.countdownValue = REFRESH_INTERVAL; this.countdownInterval = null;
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._handleRefreshEvent = this._handleRefreshEvent.bind(this);
    this._handleAutoRefreshToggle = this._handleAutoRefreshToggle.bind(this);
  }

  mount(container: HTMLElement, deps: Record<string, unknown> = {}) {
    _initPorts();
    if (this.mounted || this.state !== STATES.IDLE) { this.logger.warn('mount.skipped', { reason: 'already-mounted', currentState: this.state }); return Promise.resolve(); }
    if (!container || !(container instanceof HTMLElement)) { this.logger.error('mount.invalid-container', { container }); return Promise.reject(new Error(`[${PAINEL_ID}] Container inválido`)); }
    const auth = _getPort('auth');
    if (!auth?.isAuthenticated?.()) { this.logger.warn('mount.blocked', { reason: 'not-authenticated' }); this.container = container; this._renderAuthBlockedView(); return Promise.resolve(); }
    const mountStartTime = performance.now(); this.setState(STATES.MOUNTING);
    return Promise.resolve().then(() => {
      this.logger.debug('mount.start', { version: VERSION, painel: PAINEL_ID });
      this.container = container; this.container.setAttribute('data-painel-id', PAINEL_ID); this.container.setAttribute('data-version', VERSION); this.container.setAttribute('data-state', this.state);
      this.eventBus = _getPort('eventBus'); this.abortController = new AbortController(); this.consecutiveErrors = 0; this.isDegraded = false;
      this.dataLoader = new (DataLoader as unknown as new (ctx: unknown) => { loadData(): Promise<void>; reset(): void; })(this); renderStructure(this.container);
      const contentElement = this.container.querySelector(`#${PAINEL_ID}-content`);
      this.uiComponent = new UIComponent(contentElement, this.logger);
      return this.uiComponent.init();
    }).then(() => { setupStateSubscription(this as unknown as Parameters<typeof setupStateSubscription>[0]); setupEventListeners(this as unknown as Parameters<typeof setupEventListeners>[0], PAINEL_ID); return this.dataLoader.loadData(); }).then(() => {
      startCountdown(this as unknown as Parameters<typeof startCountdown>[0]); this.markLoaded(); this.mounted = true; this.setState(STATES.MOUNTED);
      this.performanceMetrics.mountTime = performance.now() - mountStartTime;
      this.logger.debug('mount.success', { mountTime: `${this.performanceMetrics.mountTime.toFixed(2)}ms`, state: this.state });
      this.eventBus?.emit?.(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: VERSION, mountTime: this.performanceMetrics.mountTime, timestamp: Date.now(), source: MODULE_ID });
    }).catch((error) => { this.setState(STATES.ERROR); this.logger.error('mount.failed', { error: error.message, stack: error.stack }); this.telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { error: error.message }); throw error; });
  }

  _renderAuthBlockedView() { if (!this.container) return; this.container.innerHTML = '<div class="panel-auth-blocked" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:200px;color:#64748b;text-align:center;padding:2rem;"><div style="margin-bottom:1rem;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h3 style="margin:0 0 0.5rem;color:#334155;">Acesso Restrito</h3><p style="margin:0;font-size:0.875rem;">Faça login para visualizar este conteúdo</p></div>'; }
  _handleVisibilityChange() { if (document.hidden) return; if (this.autoRefreshEnabled && this.dataLoader) { this.dataLoader.loadData(); this.countdownValue = REFRESH_INTERVAL; } }
  _handleRefreshEvent() { this.dataLoader?.loadData(); this.countdownValue = REFRESH_INTERVAL; }
  _handleAutoRefreshToggle() { toggleAutoRefresh(this as unknown as Parameters<typeof toggleAutoRefresh>[0]); }
  setState(newState: string) { this.state = newState; this.container?.setAttribute('data-state', newState); }

  unmount(container?: HTMLElement, deps: Record<string, unknown> = {}) {
    if (this.destroyed || this.state === STATES.DESTROYED) return Promise.resolve();
    this.setState(STATES.UNMOUNTING);
    return Promise.resolve().then(() => {
      stopCountdown(this as unknown as Parameters<typeof stopCountdown>[0]); cleanupEventListeners(this as unknown as Parameters<typeof cleanupEventListeners>[0], PAINEL_ID);
      if (this.dataLoader) { this.dataLoader.reset(); this.dataLoader = null; }
      this.apiClient.cancel();
      if (this.uiComponent) return this.uiComponent.destroy().then(() => { this.uiComponent = null; });
    }).then(() => {
      this.store.reset();
      if (this.container) { this.container.innerHTML = ''; this.container.removeAttribute('data-painel-id'); this.container.removeAttribute('data-version'); this.container.removeAttribute('data-state'); this.container = null; }
      this.mounted = false; this.destroyed = true; this.consecutiveErrors = 0; this.isDegraded = false; this.loadCount = 0; this.lastLoadTime = 0;
      this.setState(STATES.DESTROYED);
      this.eventBus?.emit?.(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    });
  }

  markLoaded() { const eventBus = _getPort('eventBus'); eventBus?.emit?.(PANEL_EVENTS.LOADED, { panelId: PAINEL_ID, timestamp: Date.now(), source: MODULE_ID }); }
  getStatus() { return { panelId: PAINEL_ID, version: VERSION, state: this.state, mounted: this.mounted, destroyed: this.destroyed, isDegraded: this.isDegraded, consecutiveErrors: this.consecutiveErrors, loadCount: this.loadCount, lastLoadTime: this.lastLoadTime, autoRefreshEnabled: this.autoRefreshEnabled, countdownValue: this.countdownValue, p22Compliant: true, metrics: { ...this.performanceMetrics } }; }
  refresh() { this.countdownValue = REFRESH_INTERVAL; return this.dataLoader?.loadData() ?? Promise.resolve(); }
  pause() { pause(this as unknown as Parameters<typeof pause>[0]); }
  resume() { resume(this as unknown as Parameters<typeof resume>[0]); }
}

let painelInstance: Painel19 | null = null;


const mount = (container: HTMLElement, deps: Record<string, unknown> = {}) => { if (painelInstance) { const currentContainer = painelInstance.container; const contentInDOM = currentContainer && document.contains(currentContainer); const sameContainer = currentContainer === container; if (contentInDOM && sameContainer && painelInstance.mounted) return Promise.resolve(); return unmount().then(() => { painelInstance = new Painel19(); return painelInstance.mount(container, deps); }); } painelInstance = new Painel19(); return painelInstance.mount(container, deps); };
const unmount = (container?: HTMLElement, deps?: Record<string, unknown>) => { if (!painelInstance) return Promise.resolve(); return painelInstance.unmount(container, deps).then(() => { painelInstance = null; }); };
const getStatus = () => painelInstance?.getStatus?.() ?? { panelId: PAINEL_ID, mounted: false, p22Compliant: true, destroyed: false, isDegraded: false, consecutiveErrors: 0, state: null as string | null, loadCount: 0, lastLoadTime: 0, autoRefreshEnabled: false, countdownValue: 0, metrics: null as Record<string, unknown> | null };
const getVersion = () => VERSION;
const healthCheck = () => { const status = getStatus(); const checks = { instanceExists: !!painelInstance, mounted: status.mounted === true, notDestroyed: status.destroyed !== true, notDegraded: status.isDegraded !== true, lowErrorCount: (status.consecutiveErrors || 0) < 5 , abortControllerActive: !!painelInstance?.abortController && !painelInstance.abortController.signal.aborted, noOrphanTimers: status.destroyed !== true || !painelInstance?.countdownInterval, noOrphanPolling: status.destroyed !== true || !painelInstance?.autoRefreshEnabled }; const score = Object.values(checks).filter(Boolean).length; const maxScore = Object.keys(checks).length; return { status: score === maxScore ? 'HEALTHY' : score >= 4 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, panelId: PAINEL_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() }; };
// @ts-expect-error strict migration — TS2783
const info = () => ({ panelId: PAINEL_ID, version: VERSION, p22Compliant: true, ...getStatus() });


const destroy = () => unmount();
export { mount, unmount, destroy, getStatus, getVersion, healthCheck, info };
export default { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts };
