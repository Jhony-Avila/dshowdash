// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.0-VISIBILITY-AUTH-GATING)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS, PANEL_INTENTS, createPanelHandler from /core/runtime/events/catalog/panels.events.js
//   ApiClient from ./services/api.js
//   StateStore from ./state/store.js
//   UIComponent from ./ui/component.js
//   CircuitBreaker from ./utils/circuit-breaker.js
//   DataLoader from ./core/data-loader.js
//   PAINEL_ID, VERSION (as CORE_VERSION), PANEL_TITLE, REFRESH_INTERVAL_SECONDS,
//     REQUEST_TIMEOUT, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD,
//     CIRCUIT_BREAKER_TIMEOUT, STATES, DEFAULT_PERFORMANCE_METRICS from ./core/constants.js
//
// PROVIDES: Panel10 class (mount/unmount/getStatus/healthCheck/info/
//   refresh/pause/resume), mount/unmount/getStatus/getVersion/healthCheck/
//   info, PANEL_ID, MODULE_ID, VERSION, injectPorts, getPorts
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
// Panel-10 - Tabela de Analises Enterprise AAA
// @version 9.3.0-VISIBILITY-AUTH-GATING
// @changelog v9.3.0-VISIBILITY-AUTH-GATING - Added auth/visibility checks in countdown and refresh handlers
// @changelog v9.2.0-ENTERPRISE - ES6 class conversion
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { PANEL_EVENTS, PANEL_INTENTS, createPanelHandler } from '/core/runtime/events/catalog/panels.events.js';
import { ApiClient } from './services/api.js';
import { StateStore } from './state/store.js';
import { UIComponent } from './ui/component.js';
import { CircuitBreaker } from './utils/circuit-breaker.js';
import { DataLoader } from './core/data-loader.js';
import { PAINEL_ID, VERSION as CORE_VERSION, PANEL_TITLE, REFRESH_INTERVAL_SECONDS, REQUEST_TIMEOUT, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, STATES, DEFAULT_PERFORMANCE_METRICS } from './core/constants.js';

export const MODULE_ID = 'panel-10';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const LOCK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = (logger as Record<string, unknown>)[level] || (logger as Record<string, unknown>).info; if (typeof fn === 'function') (fn as (...a: unknown[]) => void)(`[${PAINEL_ID}]`, ...args); };

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
  _initPorts();
  const cssPath = '/components/panels/panel-10/styles/index.css';
  const assetLoader = _getPort('assetLoader');
  if (assetLoader?.loadCSS) assetLoader.loadCSS(cssPath);
  else if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; link.setAttribute('data-panel', PAINEL_ID); document.head.appendChild(link); }
})();

const REFRESH_INTERVAL = REFRESH_INTERVAL_SECONDS || 60;

class Panel10 {
  [key: string]: any;
  constructor() {
    this.container = null; this.uiComponent = null; this.apiClient = null; this.store = null; this.circuitBreaker = null; this.dataLoader = null; this.eventBus = null;
    this.state = STATES.IDLE; this.mounted = false; this.destroyed = false; this.initialLoadDone = false; this.consecutiveErrors = 0; this.isDegraded = false;
    this.lastLoadTime = 0; this.loadCount = 0; this.abortController = null; this.unsubscribers = []; this.currentPeriod = '24h';
    this.autoRefreshEnabled = true; this.countdownValue = REFRESH_INTERVAL; this.countdownInterval = null;
    this.performanceMetrics = { ...DEFAULT_PERFORMANCE_METRICS }; this._log = _log;
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._handleRefreshEvent = this._handleRefreshEvent.bind(this);
    this._handlePeriodChange = this._handlePeriodChange.bind(this);
    this._handleManualRefresh = this._handleManualRefresh.bind(this);
    this._handleAutoRefreshToggle = this._handleAutoRefreshToggle.bind(this);
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
    _initPorts();
    if (this.mounted || this.state !== STATES.IDLE) { _log('warn', 'mount.skipped', { state: this.state }); return Promise.resolve(); }
    if (!container || !(container instanceof HTMLElement)) return Promise.reject(new Error(`[${PAINEL_ID}] Container inválido`));
    if (!_isAuthenticated()) { container.innerHTML = `<div style="padding:2rem;text-align:center;color:#F59E0B;">${LOCK_SVG} Faça login para acessar</div>`; return Promise.resolve(); }
    const mountStartTime = performance.now(); this.setState(STATES.MOUNTING);
    return Promise.resolve().then(() => {
      _log('debug', 'mount.start', { version: VERSION });
      this.container = container; this.container.setAttribute('data-panel-id', PAINEL_ID); this.container.setAttribute('data-version', VERSION);
      this.eventBus = _getPort('eventBus'); this.abortController = new AbortController();
      this.apiClient = new (ApiClient as unknown as new (id: string, opts: Record<string, unknown>) => Record<string, unknown>)(PAINEL_ID, { debug: _debug }); this.store = new StateStore({ debug: _debug });
      this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT); this.dataLoader = new (DataLoader as unknown as new (panel: Record<string, unknown>) => Record<string, unknown>)(this);
      this.renderStructure();
      const contentEl = this.container.querySelector(`#${PAINEL_ID}-content`);
      this.uiComponent = new UIComponent(contentEl, { debug: _debug, logger: { info: _log, error: _log, debug: _log }, onPeriodChange: this._handlePeriodChange, onManualRefresh: this._handleManualRefresh, onAutoRefreshToggle: this._handleAutoRefreshToggle });
      return this.uiComponent.init();
    }).then(() => { this.setupStateSubscription(); this.setupEventListeners(); return this.dataLoader.loadData(); }).then(() => {
      this.startCountdown(); this.markLoaded(); this.mounted = true; this.setState(STATES.MOUNTED);
      this.performanceMetrics.mountTime = performance.now() - mountStartTime;
      _log('debug', 'Montado', { mountTime: `${this.performanceMetrics.mountTime.toFixed(2)}ms` });
      this.eventBus?.emit?.(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: VERSION, mountTime: this.performanceMetrics.mountTime, timestamp: Date.now(), source: MODULE_ID });
    }).catch((error) => { this.setState(STATES.ERROR); _log('error', 'mount.failed', { error: error.message }); throw error; });
  }

  renderStructure() {
    const icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
    this.container.innerHTML = `<div class="${PAINEL_ID}-wrapper" role="region" aria-label="${PANEL_TITLE}"><header class="${PAINEL_ID}-header"><div class="${PAINEL_ID}-header-title"><span class="${PAINEL_ID}-icon">${icon}</span><span class="${PAINEL_ID}-title">${PANEL_TITLE}</span></div><div class="${PAINEL_ID}-header-info"><span class="${PAINEL_ID}-status" data-status>Carregando...</span><span class="${PAINEL_ID}-last-update" data-last-update>---</span></div></header><main id="${PAINEL_ID}-content" class="${PAINEL_ID}-content" aria-busy="true"></main></div>`;
  }

  startCountdown() {
    this.stopCountdown();
    this.countdownValue = REFRESH_INTERVAL;
    this.uiComponent?.updateCountdown?.(this.countdownValue);
    this.countdownInterval = setInterval(() => {
      if (!this.autoRefreshEnabled) return;
      if (!_isDocumentVisible()) return;
      this.countdownValue--;
      this.uiComponent?.updateCountdown?.(this.countdownValue);
      if (this.countdownValue <= 0) {
        this.countdownValue = REFRESH_INTERVAL;
        if (this._canRefresh()) {
          this.dataLoader?.loadData();
        }
      }
    }, 1000);
  }

  stopCountdown() { if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; } }

  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    this.uiComponent?.setAutoRefreshState?.(this.autoRefreshEnabled);
    if (this.autoRefreshEnabled) { this.countdownValue = REFRESH_INTERVAL; this.uiComponent?.updateCountdown?.(this.countdownValue); }
    _log('info', 'auto-refresh.toggled', { enabled: this.autoRefreshEnabled });
  }

  setupStateSubscription() {
    const unsubscribe = this.store.subscribe((state: Record<string, unknown>) => {
      if (state.loading) { if (!this.initialLoadDone && this.uiComponent) this.uiComponent.showLoading(); this.updateStatus('Atualizando...'); }
      else if (state.error) { if (!state.data && this.uiComponent) this.uiComponent.showError(state.error as string); this.updateStatus('Erro'); }
      else if (state.data) { this.uiComponent?.update(state.data as Record<string, unknown>); this.updateStatus('Atualizado'); this.updateTimestamp(state.lastUpdate as number); this.countdownValue = REFRESH_INTERVAL; this.uiComponent?.updateCountdown?.(this.countdownValue); }
    });
    this.unsubscribers.push(unsubscribe);
  }

  setupEventListeners() {
    document.addEventListener('visibilitychange', this._handleVisibilityChange, { signal: this.abortController.signal });
    this.eventBus?.on?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
  }

  _handleVisibilityChange() {
    if (document.hidden) {
      this.apiClient?.cancel?.();
      _log('debug', 'Visibility hidden - cancelled requests');
    } else if (this._canRefresh()) {
      this.dataLoader?.loadData();
      this.countdownValue = REFRESH_INTERVAL;
      _log('debug', 'Visibility visible - refreshing');
    }
  }

  _handleRefreshEvent(payload: Record<string, unknown>) {
    if (!_isAuthenticated()) { _log('warn', 'refresh.event blocked - not authenticated'); return; }
    _log('info', 'refresh.event');
    this.dataLoader?.loadData();
    this.countdownValue = REFRESH_INTERVAL;
  }

  _handlePeriodChange(period: string) {
    if (!_isAuthenticated()) { _log('warn', 'period.change blocked - not authenticated'); return; }
    _log('info', 'period.change', { from: this.currentPeriod, to: period });
    this.currentPeriod = period;
    this.dataLoader?.loadData();
    this.countdownValue = REFRESH_INTERVAL;
  }

  _handleManualRefresh() {
    if (!_isAuthenticated()) { _log('warn', 'refresh.manual blocked - not authenticated'); return; }
    _log('info', 'refresh.manual');
    this.dataLoader?.loadData();
    this.countdownValue = REFRESH_INTERVAL;
  }

  _handleAutoRefreshToggle() { this.toggleAutoRefresh(); }
  setState(newState: string) { this.state = newState; this.container?.setAttribute('data-state', newState); }
  updateStatus(status: string) { const el = this.container?.querySelector('[data-status]'); if (el) el.textContent = status; }
  updateTimestamp(ts: number | string) { const el = this.container?.querySelector('[data-last-update]'); if (!el || !ts) return; const time = new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); el.textContent = `Atualizado: ${time}`; }
  markLoaded() { const eventBus = _getPort('eventBus'); eventBus?.emit?.(PANEL_EVENTS.LOADED, { panelId: PAINEL_ID, timestamp: Date.now(), source: MODULE_ID }); }

  unmount() {
    if (this.destroyed || this.state === STATES.DESTROYED) return Promise.resolve();
    this.setState(STATES.UNMOUNTING); _log('debug', 'unmount.start');
    return Promise.resolve().then(() => {
      this.stopCountdown(); this.abortController?.abort();
      if (this.dataLoader) { this.dataLoader.reset(); this.dataLoader = null; }
      this.apiClient?.cancel?.();
      this.unsubscribers.forEach((unsub: () => void) => { try { unsub(); } catch {} }); this.unsubscribers = [];
      this.eventBus?.off?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
      if (this.uiComponent?.destroy) return this.uiComponent.destroy();
    }).then(() => {
      this.store?.reset?.();
      if (this.container) { this.container.innerHTML = ''; this.container = null; }
      this.mounted = false; this.destroyed = true; this.setState(STATES.DESTROYED); _log('debug', 'Desmontado');
    });
  }

  getStatus() { return { panelId: PAINEL_ID, version: VERSION, state: this.state, mounted: this.mounted, destroyed: this.destroyed, isDegraded: this.isDegraded, consecutiveErrors: this.consecutiveErrors, loadCount: this.loadCount, lastLoadTime: this.lastLoadTime, period: this.currentPeriod, autoRefreshEnabled: this.autoRefreshEnabled, countdownValue: this.countdownValue, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), metrics: { ...this.performanceMetrics }, p22Compliant: true, timestamp: Date.now() }; }
  healthCheck() { const checks = { instanceExists: true, mounted: this.mounted, notDestroyed: !this.destroyed, notDegraded: !this.isDegraded, lowErrorCount: this.consecutiveErrors < MAX_CONSECUTIVE_ERRORS, isAuthenticated: _isAuthenticated() , abortControllerActive: !!this.abortController && !this.abortController.signal.aborted, noOrphanTimers: !this.destroyed || !this.countdownInterval, noOrphanPolling: !this.destroyed || !this.autoRefreshEnabled }; const score = Object.values(checks).filter(Boolean).length; const maxScore = Object.keys(checks).length; return { status: score === maxScore ? 'HEALTHY' : score >= 4 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, panelId: PAINEL_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() }; }
  // @ts-expect-error strict migration — TS2783
  info() { return { panelId: PAINEL_ID, version: VERSION, title: PANEL_TITLE, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, timestamp: Date.now(), ...this.getStatus() }; }
  refresh() { if (!_isAuthenticated()) { _log('warn', 'refresh blocked - not authenticated'); return Promise.resolve(); } this.countdownValue = REFRESH_INTERVAL; return this.dataLoader?.loadData() ?? Promise.resolve(); }
  pause() { this.autoRefreshEnabled = false; this.uiComponent?.setAutoRefreshState?.(false); }
  resume() { this.autoRefreshEnabled = true; this.uiComponent?.setAutoRefreshState?.(true); this.countdownValue = REFRESH_INTERVAL; }
}

let instance: Panel10 | null = null;

const mount = (container: HTMLElement, deps: Record<string, unknown> = {}) => { if (instance) { const cur = instance.container; if (cur && document.contains(cur) && cur === container && instance.mounted) return Promise.resolve(); return unmount().then(() => { instance = new Panel10(); return instance.mount(container, deps); }); } instance = new Panel10(); return instance.mount(container, deps); };
const unmount = (_container?: HTMLElement, _deps?: Record<string, unknown>) => { if (!instance) return Promise.resolve(); return instance.unmount().then(() => { instance = null; }); };
const getStatus = () => instance?.getStatus?.() ?? { panelId: PAINEL_ID, mounted: false, p22Compliant: true, timestamp: Date.now() };
const getVersion = () => VERSION;
const healthCheck = () => instance?.healthCheck?.() ?? { status: 'UNHEALTHY', mounted: false, p22Compliant: true, timestamp: Date.now() };
const info = () => instance?.info?.() ?? { panelId: PAINEL_ID, version: VERSION, mounted: false, p22Compliant: true, timestamp: Date.now() };


const destroy = () => unmount();
export { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, PAINEL_ID as PANEL_ID };
export default { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts };
