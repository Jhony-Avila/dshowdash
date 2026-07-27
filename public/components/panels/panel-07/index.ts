/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — panel-07/index.js
 * @version 9.3.0-VISIBILITY-AUTH-GATING
 * @batch Batch Z (Contract #202 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   /core/runtime/ports-profiles.js  → { createPanelPorts }
 *   /core/runtime/events/index.js    → { PANEL_EVENTS, PANEL_INTENTS, LIFECYCLE_EVENTS, createPanelHandler }
 *   ./services/api.js                → { ApiClient }
 *   ./state/store.js                 → { StateStore }
 *   ./ui/component.js                → { UIComponent }
 *   ./utils/circuit-breaker.js       → { CircuitBreaker }
 *   ./utils/logger.js                → { Logger as PanelLogger }
 *   ./telemetry/tracker.js           → { PanelTelemetryTracker as Telemetry }
 *   ./core/states.js                 → { STATES }
 *   ./core/config.js                 → { CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, DEFAULT_PERFORMANCE_METRICS, getErrorMessage }
 *   ./core/template.js               → { renderStructure, updateRefreshBtn, updateTimestamp, updateCountdown, setAutoRefreshState }
 *   ./core/data-loader.js            → { DataLoader }
 *
 * EXPORTS (PUBLIC API):
 *   MODULE_ID, VERSION, injectPorts(), getPorts()
 *   mount(), unmount(), getStatus(), getVersion(), healthCheck(), info()
 *   default: { mount, unmount, getStatus, getVersion, healthCheck, info, injectPorts, getPorts, MODULE_ID, VERSION }
 *
 * BROWSER APIs:
 *   document (visibility, querySelector, createElement, head.appendChild)
 *   window (AssetLoader, SessionManager), AbortController, setInterval, clearInterval
 *   performance.now(), Promise, Date.now()
 *
 * PATTERNS:
 *   PortsFactory (createPanelPorts), ES6 Class (Painel07)
 *   Singleton instance management with mount guard
 *   Auth gating, visibility checks, countdown auto-refresh (30s)
 *   Circuit breaker, DataLoader, state subscription, event filtering
 * ═══════════════════════════════════════════════════════════════ */
// Painel-07 - Procedures em Execução
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
import { STATES } from './core/states.js';

// @ts-expect-error TS migration - TS2614
import { CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, DEFAULT_PERFORMANCE_METRICS, getErrorMessage } from './core/config.js';
import { renderStructure, updateRefreshBtn, updateTimestamp, updateCountdown, setAutoRefreshState } from './core/template.js';
import { DataLoader } from './core/data-loader.js';

export const MODULE_ID = 'panel-07';
export const VERSION = '9.3.0-P2-ENTERPRISE';
const PAINEL_ID = 'panel-07';
const REFRESH_INTERVAL = 30;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { if (!_debug() && level === 'debug') return; const logger = _getPort('logger'); if (!logger) return; const fn = (logger as Record<string, unknown>)[level] || (logger as Record<string, unknown>).info; if (typeof fn === 'function') (fn as Function)(`[${MODULE_ID}]`, ...args); };

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
  const cssPath = '/components/panels/panel-07/styles/index.css';
  if (typeof window !== 'undefined' && (window as any).AssetLoader) (window as any).AssetLoader.loadCSS(cssPath);
  else if (typeof document !== 'undefined' && !document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; link.setAttribute('data-painel', 'panel-07'); document.head.appendChild(link); }
})();

class Painel07 {
  [key: string]: any;
  constructor() {
    this.container = null; this.uiComponent = null; this.logger = new (PanelLogger as unknown as new (...args: unknown[]) => unknown)(PAINEL_ID, VERSION); this.telemetry = new (Telemetry as unknown as new (...args: unknown[]) => unknown)(PAINEL_ID, VERSION);
    this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, this.logger); this.apiClient = new ApiClient(PAINEL_ID, this.logger);

    // @ts-expect-error TS migration - TS2554
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
    this.logger.debug('mount.start', { version: VERSION, painel: PAINEL_ID });
    this.container = container; this.container.setAttribute('data-painel-id', PAINEL_ID); this.container.setAttribute('data-version', VERSION); this.container.setAttribute('data-state', this.state);
    this.eventBus = _getPort('eventBus'); this.abortController = new AbortController(); this.consecutiveErrors = 0; this.isDegraded = false;
    this.dataLoader = new DataLoader(this); renderStructure(this.container);
    const contentElement = this.container.querySelector(`#${PAINEL_ID}-content`);
    this.uiComponent = new UIComponent(contentElement, this.logger);
    return this.uiComponent.init().then(() => { this.setupStateSubscription(); this.setupEventListeners(); return this.dataLoader.loadData(); }).then(() => {
      this.startCountdown(); this.markLoaded(); this.mounted = true; this.setState(STATES.MOUNTED);
      this.performanceMetrics.mountTime = performance.now() - mountStartTime;
      this.logger.debug('mount.success', { mountTime: `${this.performanceMetrics.mountTime.toFixed(2)}ms`, state: this.state });
      this.eventBus?.emit?.(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: VERSION, mountTime: this.performanceMetrics.mountTime, timestamp: Date.now(), source: MODULE_ID });
    }).catch((error: Error) => { this.setState(STATES.ERROR); this.logger.error('mount.failed', { error: error.message, stack: error.stack }); this.telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { error: error.message }); throw error; });
  }

  _renderAuthBlockedView() {
    if (!this.container) return;
    this.container.innerHTML = '<div class="panel-auth-blocked" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:200px;color:#64748b;text-align:center;padding:2rem;"><div style="margin-bottom:1rem;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h3 style="margin:0 0 0.5rem;color:#334155;">Acesso Restrito</h3><p style="margin:0;font-size:0.875rem;">Faça login para visualizar este conteúdo</p></div>';
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
  toggleAutoRefresh() { this.autoRefreshEnabled = !this.autoRefreshEnabled; setAutoRefreshState(this.container, this.autoRefreshEnabled); if (this.autoRefreshEnabled) { this.countdownValue = REFRESH_INTERVAL; updateCountdown(this.container, this.countdownValue); } this.logger.info('auto-refresh.toggled', { enabled: this.autoRefreshEnabled }); }

  setupStateSubscription() {
    const unsubscribe = this.store.subscribe((state: Record<string, unknown>) => {
      if (state.loading) { if (!this.initialLoadDone && this.uiComponent) this.uiComponent.showLoading(); updateRefreshBtn(this.container, 'Atualizando...', true); }
      else if (state.error) { if (!state.data && this.uiComponent) this.uiComponent.showError(getErrorMessage(state.error)); updateRefreshBtn(this.container, 'Erro', false); }
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

  unmount(container?: HTMLElement, deps?: Record<string, unknown>) {
    if (this.destroyed || this.state === STATES.DESTROYED) return Promise.resolve();
    this.setState(STATES.UNMOUNTING); this.stopCountdown();
    this.abortController?.abort(); this.abortController = null;
    if (this.dataLoader) { this.dataLoader.reset(); this.dataLoader = null; }
    this.apiClient.cancel();
    (this.unsubscribers as (() => void)[]).forEach((unsub: () => void) => { try { unsub(); } catch {} }); this.unsubscribers = [];
    this.eventBus?.off?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
    const p = this.uiComponent ? this.uiComponent.destroy() : Promise.resolve();
    return p.then(() => {
      this.uiComponent = null; this.store.reset();
      if (this.container) { this.container.innerHTML = ''; this.container.removeAttribute('data-painel-id'); this.container.removeAttribute('data-version'); this.container.removeAttribute('data-state'); this.container = null; }
      this.mounted = false; this.destroyed = true; this.consecutiveErrors = 0; this.isDegraded = false; this.loadCount = 0; this.lastLoadTime = 0; this.setState(STATES.DESTROYED);
      const eb = _getPort('eventBus'); eb?.emit?.(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    });
  }

  markLoaded() { const eb = _getPort('eventBus'); eb?.emit?.(PANEL_EVENTS.LOADED, { panelId: PAINEL_ID, timestamp: Date.now(), source: MODULE_ID }); }
  getStatus() { return { panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, state: this.state, mounted: this.mounted, destroyed: this.destroyed, isDegraded: this.isDegraded, consecutiveErrors: this.consecutiveErrors, loadCount: this.loadCount, lastLoadTime: this.lastLoadTime, autoRefreshEnabled: this.autoRefreshEnabled, countdownValue: this.countdownValue, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, metrics: { ...this.performanceMetrics } }; }
  refresh() { if (!_isAuthenticated()) { _log('warn', 'refresh blocked - not authenticated'); return Promise.resolve(); } this.countdownValue = REFRESH_INTERVAL; return this.dataLoader?.loadData() ?? Promise.resolve(); }
  pause() { this.autoRefreshEnabled = false; setAutoRefreshState(this.container, false); }
  resume() { this.autoRefreshEnabled = true; setAutoRefreshState(this.container, true); this.countdownValue = REFRESH_INTERVAL; }
}

let painelInstance: Painel07 | null = null;

export const mount = (container: HTMLElement, deps: Record<string, unknown> = {}) => {

  if (painelInstance) { const cur = painelInstance.container; if (cur && document.contains(cur) && cur === container && painelInstance.mounted) return Promise.resolve(); return unmount().then(() => { painelInstance = new Painel07(); return painelInstance.mount(container, deps); }); }
  painelInstance = new Painel07(); return painelInstance.mount(container, deps);
};

export const unmount = (container?: HTMLElement, deps?: Record<string, unknown>) => { if (!painelInstance) return Promise.resolve(); return painelInstance.unmount(container, deps).then(() => { painelInstance = null; }
); };
export const getStatus = () => painelInstance?.getStatus?.() ?? { panelId: PAINEL_ID, moduleId: MODULE_ID, mounted: false, p22Compliant: true };
export const getVersion = () => VERSION;

export const healthCheck = () => {
  const status = getStatus() as Record<string, unknown>;
  const checks = { instanceExists: !!painelInstance, mounted: status.mounted === true, notDestroyed: status.destroyed !== true, notDegraded: status.isDegraded !== true, lowErrorCount: ((status.consecutiveErrors as number) || 0) < 5, isAuthenticated: _isAuthenticated() , abortControllerActive: !!painelInstance?.abortController && !(painelInstance.abortController as AbortController).signal.aborted, noOrphanTimers: status.destroyed !== true || !painelInstance?.countdownInterval, noOrphanPolling: status.destroyed !== true || !painelInstance?.autoRefreshEnabled };
  const score = Object.values(checks).filter(Boolean).length; const maxScore = Object.keys(checks).length;
  return { status: score === maxScore ? 'HEALTHY' : score >= 4 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() };
};

// @ts-expect-error strict migration — TS2783
export const info = () => ({ panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, ...getStatus() });


export const destroy = () => unmount();
export default { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts, MODULE_ID, VERSION };
