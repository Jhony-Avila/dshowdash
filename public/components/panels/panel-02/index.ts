// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.0-VISIBILITY-AUTH-GATING)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS, PANEL_INTENTS, createPanelHandler from /core/runtime/events/catalog/panels.events.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   ApiClient from ./services/api.js
//   StateStore from ./state/store.js
//   UIComponent from ./ui/component.js
//   CircuitBreaker from ./utils/circuit-breaker.js
//   Logger (as PanelLogger) from ./utils/logger.js
//   PanelTelemetryTracker (as Telemetry) from ./telemetry/tracker.js
//   PAINEL_ID, VERSION (as CORE_VERSION) from ./core/constants.js
//   STATES from ./core/states.js
//   CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT,
//     DEFAULT_PERFORMANCE_METRICS, getErrorMessage from ./core/config.js
//   renderStructure, updateRefreshBtn, updateTimestamp,
//     updateCountdown, setAutoRefreshState from ./core/template.js
//   DataLoader from ./core/data-loader.js
//
// PROVIDES: Painel02 class (mount/unmount/getStatus/healthCheck/info/
//   refresh/pause/resume), mount/unmount/getStatus/getVersion/healthCheck/
//   info, MODULE_ID, VERSION, injectPorts, getPorts
//
// RECEIVES (via mount):
//   container — DOM Element (HTMLElement)
//   deps — optional dependencies object
//
// WINDOW ACCESS (legítimo — auth fallback):
//   window.SessionManager (auth fallback check)
//
// BROWSER APIs (legítimo — panel DOM + lifecycle):
//   document.querySelector, document.createElement, document.head.appendChild,
//   document.addEventListener('visibilitychange'), document.hidden,
//   document.contains, performance.now, setInterval/clearInterval,
//   AbortController
// ═══════════════════════════════════════════════════════════════
// Painel-02 - Monitoramento de Jobs
// @version 9.3.0-VISIBILITY-AUTH-GATING
// @changelog v9.4.0-STRICT-MODE - Migração para strict mode (NR-FULL)
// @changelog v9.3.0-VISIBILITY-AUTH-GATING - Added auth/visibility checks in countdown and refresh handlers
// @changelog v9.2.0-ENTERPRISE - ES6 class conversion
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { PANEL_EVENTS, PANEL_INTENTS, createPanelHandler } from '/core/runtime/events/catalog/panels.events.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import { ApiClient } from './services/api.js';
import { StateStore } from './state/store.js';
import { UIComponent } from './ui/component.js';
import { CircuitBreaker } from './utils/circuit-breaker.js';
import { Logger as PanelLogger } from './utils/logger.js';
import { PanelTelemetryTracker as Telemetry } from './telemetry/tracker.js';
import { PAINEL_ID, VERSION as CORE_VERSION } from './core/constants.js';
import { STATES } from './core/states.js';
import { CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, DEFAULT_PERFORMANCE_METRICS, getErrorMessage } from './core/config.js';
import { renderStructure, updateRefreshBtn, updateTimestamp, updateCountdown, setAutoRefreshState } from './core/template.js';
import { DataLoader } from './core/data-loader.js';

export const MODULE_ID = 'panel-02';
export const VERSION = '9.3.0-P2-ENTERPRISE';
const REFRESH_INTERVAL = 30;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { if (!_debug() && level === 'debug') return; const logger = _getPort('logger') as Record<string, unknown> | null; if (!logger) return; const fn = (logger[level] || logger['info']) as ((...a: unknown[]) => void) | undefined; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };

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

(() => {
  const cssPath = '/components/panels/panel-02/styles/index.css';
  const al = _getPort('assetLoader');
  if (al?.loadCSS) al.loadCSS(cssPath);
  else if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; link.setAttribute('data-painel', 'panel-02'); document.head.appendChild(link); }
})();

class Painel02 {
  [key: string]: any;
  constructor() {
    this.container = null; this.uiComponent = null; this.logger = new (PanelLogger as unknown as new (...a: unknown[]) => unknown)(PAINEL_ID, VERSION); this.telemetry = new (Telemetry as unknown as new (...a: unknown[]) => unknown)(PAINEL_ID, VERSION);
    this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, this.logger); this.apiClient = new ApiClient(PAINEL_ID, this.logger);
    this.store = new StateStore(this.logger); this.eventBus = null; this.state = STATES.IDLE; this.mounted = false; this.initialLoadDone = false; this.destroyed = false;
    this.consecutiveErrors = 0; this.isDegraded = false; this.lastLoadTime = 0; this.loadCount = 0; this.abortController = null; this.unsubscribers = [];
    this.performanceMetrics = { ...DEFAULT_PERFORMANCE_METRICS }; this.dataLoader = null; this.autoRefreshEnabled = true; this.countdownValue = REFRESH_INTERVAL; this.countdownInterval = null;
    this._handleVisibilityChange = () => this._onVisibilityChange();
    this._handleRefreshEvent = (payload: unknown) => this._onRefreshEvent(payload);
    this._handleAutoRefreshToggle = () => this._onAutoRefreshToggle();
    this._filteredRefreshHandler = createPanelHandler(PAINEL_ID, this._handleRefreshEvent);
  }

  _canRefresh() {
    if (!this.mounted) return false;
    if (!this.autoRefreshEnabled) return false;
    if (!_isDocumentVisible()) return false;
    if (!_isAuthenticated()) return false;
    if (this.isDegraded) return false;
    return true;
  }

  mount(container: HTMLElement, deps: Record<string, unknown> = {}) {
    if (this.mounted || this.state !== STATES.IDLE) { this.logger.warn('mount.skipped', { reason: 'already-mounted', currentState: this.state }); return Promise.resolve(); }
    if (!container || !(container instanceof HTMLElement)) { this.logger.error('mount.invalid-container', { container }); return Promise.reject(new Error(`[${PAINEL_ID}] Container inválido`)); }
    if (!_isAuthenticated()) { this.logger.warn('mount.blocked', { reason: 'not-authenticated' }); this.container = container; this._renderAuthBlockedView(); return Promise.resolve(); }
    const mountStartTime = performance.now(); this.setState(STATES.MOUNTING);
    return Promise.resolve().then(() => {
      this.logger.debug('mount.start', { version: VERSION, painel: PAINEL_ID }); this.container = container;
      this.container.setAttribute('data-painel-id', PAINEL_ID); this.container.setAttribute('data-version', VERSION); this.container.setAttribute('data-state', this.state);
      this.eventBus = _getPort('eventBus'); this.abortController = new AbortController(); this.consecutiveErrors = 0; this.isDegraded = false;
      this.dataLoader = new (DataLoader as unknown as new (...a: unknown[]) => unknown)(this as unknown as Record<string, unknown>); renderStructure(this.container);
      const contentElement = this.container.querySelector(`#${PAINEL_ID}-content`); this.uiComponent = new UIComponent(contentElement, this.logger);
      return this.uiComponent.init();
    }).then(() => { this.setupStateSubscription(); this.setupEventListeners(); return this.dataLoader.loadData(); }).then(() => {
      this.startCountdown(); this.markLoaded(); this.mounted = true; this.setState(STATES.MOUNTED);
      this.performanceMetrics.mountTime = performance.now() - mountStartTime;
      this.logger.debug('mount.success', { mountTime: `${this.performanceMetrics.mountTime.toFixed(2)}ms`, state: this.state });
      this.eventBus?.emit?.(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: VERSION, mountTime: this.performanceMetrics.mountTime, timestamp: Date.now(), source: MODULE_ID });
    }).catch((error) => { this.setState(STATES.ERROR); this.logger.error('mount.failed', { error: error.message, stack: error.stack }); this.telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { error: error.message }); throw error; });
  }

  startCountdown() {
    this.stopCountdown();
    this.countdownValue = REFRESH_INTERVAL;
    updateCountdown(this.container, this.countdownValue);
    this.countdownInterval = setInterval(() => {
      if (!this.autoRefreshEnabled) return;
      if (!_isDocumentVisible()) return;
      this.countdownValue--;
      updateCountdown(this.container, this.countdownValue);
      if (this.countdownValue <= 0) {
        this.countdownValue = REFRESH_INTERVAL;
        if (this._canRefresh()) {
          this.dataLoader?.loadData();
        }
      }
    }, 1000);
  }

  stopCountdown() { if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; } }

  _renderAuthBlockedView() {
    if (!this.container) return;
    this.container.innerHTML = '<div class="panel-auth-blocked" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:200px;color:#64748b;text-align:center;padding:2rem;"><div style="margin-bottom:1rem;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h3 style="margin:0 0 0.5rem;color:#334155;">Acesso Restrito</h3><p style="margin:0;font-size:0.875rem;">Faça login para visualizar este conteúdo</p></div>';
  }

  toggleAutoRefresh() { this.autoRefreshEnabled = !this.autoRefreshEnabled; setAutoRefreshState(this.container, this.autoRefreshEnabled); if (this.autoRefreshEnabled) { this.countdownValue = REFRESH_INTERVAL; updateCountdown(this.container, this.countdownValue); } _log('info', 'auto-refresh.toggled', { enabled: this.autoRefreshEnabled }); }

  setupStateSubscription() {
    const unsubscribe = this.store.subscribe((state: Record<string, unknown>) => {
      if (state.loading) { if (!this.initialLoadDone && this.uiComponent) this.uiComponent.showLoading(); updateRefreshBtn(this.container, 'Atualizando...', true); }
      else if (state.error) { if (!state.data && this.uiComponent) this.uiComponent.showError(getErrorMessage(state.error as string)); updateRefreshBtn(this.container, 'Erro', false); }
      else if (state.data) { this.uiComponent?.update(state.data as Record<string, unknown>); updateRefreshBtn(this.container, 'Atualizado', false); updateTimestamp(this.container, state.lastUpdate as number); this.countdownValue = REFRESH_INTERVAL; updateCountdown(this.container, this.countdownValue); }
    });
    this.unsubscribers.push(unsubscribe);
  }

  setupEventListeners() {
    document.addEventListener('visibilitychange', this._handleVisibilityChange, { signal: this.abortController.signal });
    this.eventBus?.on?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
    const refreshBtn = this.container.querySelector('[data-action="refresh"]');
    if (refreshBtn) refreshBtn.addEventListener('click', () => { if (_isAuthenticated()) { this.dataLoader?.loadData(); this.countdownValue = REFRESH_INTERVAL; } }, { signal: this.abortController.signal });
    const autoRefreshToggle = this.container.querySelector('[data-action="toggle-auto-refresh"]');
    if (autoRefreshToggle) autoRefreshToggle.addEventListener('click', this._handleAutoRefreshToggle, { signal: this.abortController.signal });
  }

  _onVisibilityChange() {
    if (document.hidden) return;
    if (this._canRefresh()) {
      this.dataLoader?.loadData();
      this.countdownValue = REFRESH_INTERVAL;
    }
  }

  _onRefreshEvent(payload: unknown) {
    if (!_isAuthenticated()) { _log('warn', 'refresh.event blocked - not authenticated'); return; }
    this.dataLoader?.loadData();
    this.countdownValue = REFRESH_INTERVAL;
  }

  _onAutoRefreshToggle() { this.toggleAutoRefresh(); }
  setState(newState: string) { this.state = newState; this.container?.setAttribute('data-state', newState); }

  unmount(container?: HTMLElement | null, deps: Record<string, unknown> = {}) {
    if (this.destroyed || this.state === STATES.DESTROYED) return Promise.resolve();
    this.setState(STATES.UNMOUNTING);
    return Promise.resolve().then(() => {
      this.stopCountdown();
      this.abortController?.abort(); this.abortController = null;
      if (this.dataLoader) { this.dataLoader.reset(); this.dataLoader = null; }
      this.apiClient.cancel();
      this.unsubscribers.forEach((unsub: () => void) => { try { unsub(); } catch {} }); this.unsubscribers = [];
      this.eventBus?.off?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
      if (this.uiComponent) return this.uiComponent.destroy().then(() => { this.uiComponent = null; });
    }).then(() => {
      this.store.reset();
      if (this.container) { this.container.innerHTML = ''; this.container.removeAttribute('data-painel-id'); this.container.removeAttribute('data-version'); this.container.removeAttribute('data-state'); this.container = null; }
      this.mounted = false; this.destroyed = true; this.consecutiveErrors = 0; this.isDegraded = false; this.loadCount = 0; this.lastLoadTime = 0; this.setState(STATES.DESTROYED);
      this.eventBus?.emit?.(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    });
  }

  markLoaded() { const eb = _getPort('eventBus'); eb?.emit?.(PANEL_EVENTS.LOADED, { panelId: PAINEL_ID, timestamp: Date.now(), source: MODULE_ID }); }
  getStatus() { return { panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, state: this.state, mounted: this.mounted, destroyed: this.destroyed, isDegraded: this.isDegraded, consecutiveErrors: this.consecutiveErrors, loadCount: this.loadCount, lastLoadTime: this.lastLoadTime, autoRefreshEnabled: this.autoRefreshEnabled, countdownValue: this.countdownValue, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), metrics: { ...this.performanceMetrics }, portsInitialized: Ports.isInitialized(), p22Compliant: true }; }
  refresh() { if (!_isAuthenticated()) { _log('warn', 'refresh blocked - not authenticated'); return Promise.resolve(); } this.countdownValue = REFRESH_INTERVAL; return this.dataLoader?.loadData() ?? Promise.resolve(); }
  pause() { this.autoRefreshEnabled = false; setAutoRefreshState(this.container, false); }
  resume() { this.autoRefreshEnabled = true; setAutoRefreshState(this.container, true); this.countdownValue = REFRESH_INTERVAL; }
}

let painelInstance: Painel02 | null = null;

const mount = (container: HTMLElement, deps: Record<string, unknown> = {}) => {
  if (painelInstance) {
    const currentContainer = painelInstance.container; const contentInDOM = currentContainer && document.contains(currentContainer); const sameContainer = currentContainer === container;
    if (contentInDOM && sameContainer && painelInstance.mounted) return Promise.resolve();

    return unmount().then(() => { painelInstance = new Painel02(); return painelInstance.mount(container, deps); });
  }
  painelInstance = new Painel02(); return painelInstance.mount(container, deps);
};

const unmount = (container?: HTMLElement | null, deps?: Record<string, unknown>) => { if (!painelInstance) return Promise.resolve(); return painelInstance.unmount(container, deps).then(() => { painelInstance = null; }); };
const getStatus = () => painelInstance?.getStatus?.() ?? { panelId: PAINEL_ID, moduleId: MODULE_ID, mounted: false, portsInitialized: Ports.isInitialized(), p22Compliant: true };
const getVersion = () => VERSION;

const healthCheck = () => {
  const status = getStatus();
  const fullStatus = status as { panelId: string; moduleId: string; mounted: boolean; destroyed?: boolean; isDegraded?: boolean; consecutiveErrors?: number; portsInitialized: boolean; p22Compliant: boolean };
  const checks = { instanceExists: !!painelInstance, mounted: fullStatus.mounted === true, notDestroyed: fullStatus.destroyed !== true, notDegraded: fullStatus.isDegraded !== true, lowErrorCount: (fullStatus.consecutiveErrors || 0) < 5, isAuthenticated: _isAuthenticated() , abortControllerActive: !!painelInstance?.abortController && !painelInstance.abortController.signal.aborted, noOrphanTimers: fullStatus.destroyed !== true || !painelInstance?.countdownInterval, noOrphanPolling: fullStatus.destroyed !== true || !painelInstance?.autoRefreshEnabled };
  const score = Object.values(checks).filter(Boolean).length; const maxScore = Object.keys(checks).length;
  return { status: score === maxScore ? 'HEALTHY' : score >= 4 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, portsInitialized: Ports.isInitialized(), panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() };
};

// @ts-expect-error strict migration — TS2783
const info = () => ({ panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, ...getStatus() });


const destroy = () => unmount();
export { mount, unmount, destroy, getStatus, getVersion, healthCheck, info };
export default { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts, MODULE_ID, VERSION };
