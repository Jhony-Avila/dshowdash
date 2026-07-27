/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — panel-09/index.js
 * @version 9.3.0-VISIBILITY-AUTH-GATING
 * @batch Batch Z (Contract #214 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   /core/runtime/ports-profiles.js → { createPanelPorts }
 *   /core/runtime/events/index.js   → { PANEL_EVENTS, PANEL_INTENTS, createPanelHandler }
 *   ./services/api.js               → { ApiClient }
 *   ./state/store.js                → { StateStore }
 *   ./ui/component.js               → { UIComponent }
 *   ./utils/circuit-breaker.js      → { CircuitBreaker }
 *   ./core/constants.js             → { PAINEL_ID, VERSION, PANEL_TITLE, REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED, REQUEST_TIMEOUT, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, STATES }
 *
 * EXPORTS (PUBLIC API):
 *   MODULE_ID, VERSION, injectPorts(), getPorts()
 *   mount(), unmount(), getStatus(), getVersion(), healthCheck(), info(), PANEL_ID
 *   default: { mount, unmount, getStatus, getVersion, healthCheck, info, injectPorts, getPorts, MODULE_ID, VERSION }
 *
 * BROWSER APIs:
 *   document (visibility, querySelector, createElement), window.SessionManager
 *   AbortController, setTimeout, clearTimeout, Promise, Date.now()
 *
 * PATTERNS:
 *   PortsFactory (createPanelPorts), ES6 Class (Panel09 — Analise Comparativa)
 *   Singleton instance with mountInProgress guard
 *   Auth gating, visibility checks, auto-refresh with degraded interval
 *   Circuit breaker, status/timestamp UI updates, renderStructure with SVG icon
 * ═══════════════════════════════════════════════════════════════ */
// Panel-09 - Analise Comparativa Enterprise AAA
// @version 9.3.0-VISIBILITY-AUTH-GATING
// @changelog v9.3.0-VISIBILITY-AUTH-GATING - Added auth/visibility checks in refresh handlers
// @changelog v9.2.0-ENTERPRISE - ES6 class conversion
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { PANEL_EVENTS, PANEL_INTENTS, createPanelHandler } from '/core/runtime/events/catalog/panels.events.js';
import { ApiClient } from './services/api.js';
import { StateStore } from './state/store.js';
import { UIComponent } from './ui/component.js';
import { CircuitBreaker } from './utils/circuit-breaker.js';
import { PAINEL_ID, VERSION as PANEL_TITLE, REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED, REQUEST_TIMEOUT, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, STATES } from './core/constants.js';

export const MODULE_ID = 'panel-09';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = (logger as Record<string, unknown>)[level] || (logger as Record<string, unknown>).info; if (typeof fn === 'function') (fn as (...a: unknown[]) => void)(`[${MODULE_ID}]`, ...args); };

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

const _isDocumentVisible = () => hasDocument && !document.hidden;

(() => {
  const cssPath = '/components/panels/panel-09/styles/index.css';
  const al = _getPort('assetLoader');
  if (al?.loadCSS) al.loadCSS(cssPath);
  else if (hasDocument && !document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; link.setAttribute('data-panel', PAINEL_ID); document.head.appendChild(link); }
})();

class Panel09 {
  [key: string]: any;
  constructor() {
    this.container = null; this.uiComponent = null; this.apiClient = null; this.store = null; this.circuitBreaker = null; this.eventBus = null;
    this.state = STATES.IDLE; this.mounted = false; this.destroyed = false; this.refreshTimer = null; this.consecutiveErrors = 0; this.isDegraded = false;
    this.lastLoadTime = 0; this.loadCount = 0; this.abortController = null; this.unsubscribers = []; this.currentRequestId = 0; this.activeLoadRequest = null;
    this._handleVisibilityChange = () => this._onVisibilityChange();
    this._handleRefreshEvent = (payload: Record<string, unknown>) => this._onRefreshEvent(payload);
    this._filteredRefreshHandler = createPanelHandler(PAINEL_ID, this._handleRefreshEvent);
  }

  _canRefresh() {
    if (!this.mounted) return false;
    if (!_isDocumentVisible()) return false;
    if (!_isAuthenticated()) return false;
    if (this.isDegraded) return false;
    return true;
  }

  mount(container: HTMLElement, deps: Record<string, unknown> = {}) {
    if (this.mounted || this.state !== STATES.IDLE) { _log('debug', 'mount.skipped', { state: this.state }); return Promise.resolve(); }
    if (!container || !(container instanceof HTMLElement)) return Promise.reject(new Error(`[${PAINEL_ID}] Container invalido`));
    if (!_isAuthenticated()) { container.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;">Faca login para acessar</div>'; return Promise.resolve(); }
    this.setState(STATES.MOUNTING); _log('debug', 'mount.start', { version: VERSION });
    this.container = container; this.container.setAttribute('data-panel-id', PAINEL_ID); this.container.setAttribute('data-version', VERSION);
    this.eventBus = _getPort('eventBus'); this.abortController = new AbortController();

    // @ts-expect-error TS migration - TS2554
    this.apiClient = new ApiClient(PAINEL_ID, { debug: _debug }); this.store = new StateStore({ debug: _debug }); this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT);
    this.renderStructure();
    const contentEl = this.container.querySelector(`#${PAINEL_ID}-content`);
    this.uiComponent = new UIComponent(contentEl, { debug: _debug, info: _log, error: _log });
    return this.uiComponent.init().then(() => { this.setupStateSubscription(); this.setupEventListeners(); return this.loadData(); }).then(() => {
      this.startAutoRefresh(); this.mounted = true; this.setState(STATES.MOUNTED); _log('debug', 'Montado', { version: VERSION });
      this.eventBus?.emit?.(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    }).catch((error: Error) => { this.setState(STATES.ERROR); _log('error', 'mount.failed', { error: error.message }); throw error; });
  }

  renderStructure() {
    const icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>';
    this.container.innerHTML = `<div class="${PAINEL_ID}-wrapper" role="region" aria-label="${PANEL_TITLE}"><header class="${PAINEL_ID}-header"><div class="${PAINEL_ID}-header-title"><span class="${PAINEL_ID}-icon">${icon}</span><span class="${PAINEL_ID}-title">${PANEL_TITLE}</span></div><div class="${PAINEL_ID}-header-info"><span class="${PAINEL_ID}-status" data-status>Carregando...</span><span class="${PAINEL_ID}-last-update" data-last-update>---</span></div></header><main id="${PAINEL_ID}-content" class="${PAINEL_ID}-content" aria-busy="true"></main></div>`;
  }

  setupStateSubscription() {
    const unsubscribe = this.store.subscribe((state: Record<string, unknown>) => {
      if (state.loading) { this.uiComponent?.showLoading?.(); this.updateStatus('Carregando...'); }
      else if (state.error) { this.uiComponent?.showError?.(state.error); this.updateStatus('Erro'); }
      else if (state.data) { this.uiComponent?.update?.(state.data); this.updateStatus('Atualizado'); this.updateTimestamp(state.lastUpdate as number | null); }
    });
    this.unsubscribers.push(unsubscribe);
  }

  setupEventListeners() {
    document.addEventListener('visibilitychange', this._handleVisibilityChange, { signal: this.abortController.signal });
    this.eventBus?.on?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
  }

  _onVisibilityChange() {
    if (document.hidden) {
      this.apiClient?.cancel?.();
    } else if (this._canRefresh()) {
      this.loadData();
    }
  }

  _onRefreshEvent(payload: Record<string, unknown>) {
    if (!_isAuthenticated()) { _log('warn', 'refresh.event blocked - not authenticated'); return; }
    _log('info', 'refresh.event');
    this.loadData();
  }

  loadData() {
    if (this.activeLoadRequest) return Promise.resolve();
    if (!_isDocumentVisible()) return Promise.resolve();
    if (!_isAuthenticated()) { _log('warn', 'loadData blocked - not authenticated'); return Promise.resolve(); }
    if (!this.mounted || this.destroyed) return Promise.resolve();
    try { this.circuitBreaker.check(); } catch { this.setState(STATES.DEGRADED); return Promise.resolve(); }
    const requestId = ++this.currentRequestId; this.activeLoadRequest = requestId; this.setState(STATES.LOADING); this.store.setLoading(true);
    return this.apiClient.fetchData({ signal: this.abortController.signal, timeout: REQUEST_TIMEOUT }).then((result: Record<string, unknown>) => {
      if (this.activeLoadRequest !== requestId) return;
      if (result.success && result.payload) { this.consecutiveErrors = 0; if (this.isDegraded) { this.isDegraded = false; this.setState(STATES.READY); } this.store.setData(result.payload); this.circuitBreaker.recordSuccess(); this.setState(STATES.READY); _log('debug', 'load.success'); }
      else throw new Error((result.error as string) || 'Resposta invalida');
    }).catch((error: Error) => {
      if (error.name === 'AbortError') return; this.consecutiveErrors++; this.circuitBreaker.recordFailure(); this.store.setError(error.message); _log('error', 'load.failed', { error: error.message });
      if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) { this.isDegraded = true; this.setState(STATES.DEGRADED); } else this.setState(STATES.ERROR);
    }).finally(() => { if (this.activeLoadRequest === requestId) this.activeLoadRequest = null; this.store.setLoading(false); this.lastLoadTime = Date.now(); this.loadCount++; });
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    const tick = () => {
      if (this.refreshTimer) clearTimeout(this.refreshTimer);
      const interval = this.isDegraded ? REFRESH_INTERVAL_DEGRADED : REFRESH_INTERVAL_BASE;
      this.refreshTimer = setTimeout(() => {
        if (this._canRefresh()) {
          this.loadData().then(() => tick());
        } else {
          tick();
        }
      }, interval);
    };
    tick();
  }

  stopAutoRefresh() { if (this.refreshTimer) { clearTimeout(this.refreshTimer); this.refreshTimer = null; } }

  unmount() {
    if (this.destroyed || this.state === STATES.DESTROYED) return Promise.resolve();
    this.setState(STATES.UNMOUNTING); _log('debug', 'unmount.start');
    this.abortController?.abort(); this.stopAutoRefresh(); this.apiClient?.cancel?.();
    this.unsubscribers.forEach((fn: () => void) => { try { fn(); } catch {} }); this.unsubscribers = [];
    this.eventBus?.off?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
    const destroyPromise = this.uiComponent?.destroy?.() ?? Promise.resolve();
    return destroyPromise.then(() => {
      this.store?.reset?.();
      if (this.container) { this.container.innerHTML = ''; this.container = null; }
      this.mounted = false; this.destroyed = true; this.setState(STATES.DESTROYED); _log('debug', 'Desmontado');
      this.eventBus?.emit?.(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    }).catch((error: Error) => { _log('error', 'unmount.failed', { error: error.message }); });
  }

  setState(newState: string) { this.state = newState; this.container?.setAttribute('data-state', newState); }
  updateStatus(status: string) { const el = this.container?.querySelector('[data-status]'); if (el) el.textContent = status; }
  updateTimestamp(ts: number | null) { const el = this.container?.querySelector('[data-last-update]'); if (!el || !ts) return; const time = new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); el.textContent = `Atualizado: ${time}`; }
  getStatus() { return { panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, state: this.state, mounted: this.mounted, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, timestamp: Date.now() }; }
  healthCheck() { const checks = { instanceExists: true, mounted: this.mounted, notDestroyed: !this.destroyed, notDegraded: !this.isDegraded, lowErrorCount: this.consecutiveErrors < MAX_CONSECUTIVE_ERRORS, isAuthenticated: _isAuthenticated() , abortControllerActive: !!this.abortController && !this.abortController.signal.aborted, noOrphanTimers: !this.destroyed || !this.refreshTimer }; const score = Object.values(checks).filter(Boolean).length; const maxScore = Object.keys(checks).length; return { status: score === maxScore ? 'HEALTHY' : score >= 4 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, checks, panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() }; }
  // @ts-expect-error strict migration — TS2783
  info() { return { panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, title: PANEL_TITLE, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, timestamp: Date.now(), ...this.getStatus() }; }
}

let instance: Panel09 | null = null;
let mountInProgress = false;

export const mount = (container: HTMLElement, deps: Record<string, unknown> = {}) => { if (instance) { _log('debug', 'Instance exists, skipping mount'); return Promise.resolve(); } if (mountInProgress) { _log('debug', 'Mount in progress, skipping'); return Promise.resolve(); } mountInProgress = true; instance = new Panel09(); return instance.mount(container, deps).finally(() => { mountInProgress = false; }); };
export const unmount = () => { if (instance) return instance.unmount().then(() => { instance = null; }
); return Promise.resolve(); };
export const getStatus = () => instance?.getStatus?.() ?? { panelId: PAINEL_ID, moduleId: MODULE_ID, mounted: false, p22Compliant: true, timestamp: Date.now() };
export const getVersion = () => VERSION;
export const healthCheck = () => instance?.healthCheck?.() ?? { status: 'UNHEALTHY', mounted: false, p22Compliant: true, timestamp: Date.now() };
export const info = () => instance?.info?.() ?? { panelId: PAINEL_ID, moduleId: MODULE_ID, version: VERSION, mounted: false, p22Compliant: true, timestamp: Date.now() };

export { PAINEL_ID as PANEL_ID };
export const destroy = () => unmount();
export default { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts, MODULE_ID, VERSION };
