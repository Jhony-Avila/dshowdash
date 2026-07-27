// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin
// PURPOSE: Panel Feature Flags Admin - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   initPorts, getPort, injectPorts, getPorts from ./ports.js
//   PANEL_EVENTS, PANEL_INTENTS, LIFECYCLE_EVENTS, AUTH_INTENTS from /core/runtim...
//   createLogger from ./logger-helper.js
//   toggleFlag, showCreateModal, showEditModal, deleteFlag from ./crud-operations.js
//   startCountdown, stopCountdown, toggleAutoRefresh, setupStateSubscription, set...
//   ApiClient from ./services/api.js
//   StateStore from ./state/store.js
//   UIComponent from ./ui/component.js
//   CircuitBreaker from ./utils/circuit-breaker.js
//   PANEL_ID, VERSION as REFRESH_INTERVAL from ./core/constants.js
//   STATES from ./core/states.js
//   CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, DEFAULT_PERFORMANCE_METRI...
//   renderStructure from ./core/template.js
//   DataLoader from ./core/data-loader.js
//
// PROVIDES:
//   mount — exported value
//   unmount — exported value
//   getStatus() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts — exported value
//   getPorts — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).AuthAdapter
// ═══════════════════════════════════════════════════════════════
'use strict';

import { initPorts, getPort, injectPorts, getPorts } from './ports.js';
import { PANEL_EVENTS, PANEL_INTENTS } from '/core/runtime/events/catalog/panels.events.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import { AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';
import { createLogger } from './logger-helper.js';
import { toggleFlag, showCreateModal, showEditModal, deleteFlag } from './crud-operations.js';
import { startCountdown, stopCountdown, toggleAutoRefresh, setupStateSubscription, setupEventListeners } from './lifecycle.js';

import { ApiClient } from './services/api.js';
import { StateStore } from './state/store.js';
import { UIComponent } from './ui/component.js';
import { CircuitBreaker } from './utils/circuit-breaker.js';
import { PANEL_ID, VERSION as REFRESH_INTERVAL } from './core/constants.js';
import { STATES } from './core/states.js';
import { CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, DEFAULT_PERFORMANCE_METRICS } from './core/config.js';
import { renderStructure } from './core/template.js';
import { DataLoader } from './core/data-loader.js';

declare const Telemetry: new (...args: any[]) => any;
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-feature-flags-admin';

const _getAuth = () => (typeof window !== 'undefined') ? (window as any).AuthAdapter || null : null;

const LOCK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

(() => {
  initPorts();
  const cssPath = '/components/panels/panel-feature-flags-admin/styles/index.css';
  const assetLoader = getPort('assetLoader');
  if (assetLoader?.loadCSS) assetLoader.loadCSS(cssPath);
  else if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; link.setAttribute('data-painel', 'panel-feature-flags-admin'); document.head.appendChild(link); }
})();

class PanelFeatureFlagsAdmin {
  [key: string]: any;
  constructor() {
    this.container = null; this.uiComponent = null; this.logger = createLogger(); this.telemetry = new Telemetry(PANEL_ID, VERSION);
    this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, this.logger);

    // @ts-expect-error TS migration - TS2554
    this.apiClient = new ApiClient(this.logger); this.store = new StateStore(this.logger); this.eventBus = null;
    this.state = STATES.IDLE; this.mounted = false; this.initialLoadDone = false; this.destroyed = false;
    this.consecutiveErrors = 0; this.isDegraded = false; this.lastLoadTime = 0; this.loadCount = 0;
    this.abortController = null; this.unsubscribers = [];
    this.performanceMetrics = { ...DEFAULT_PERFORMANCE_METRICS };
    this.dataLoader = null; this.autoRefreshEnabled = true; this.countdownValue = REFRESH_INTERVAL; this.countdownInterval = null;
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._handleRefreshEvent = this._handleRefreshEvent.bind(this);
    this._handleAutoRefreshToggle = this._handleAutoRefreshToggle.bind(this);
    this._filteredRefreshHandler = null;
  }

  async mount(container: HTMLElement, deps: Record<string, unknown> = {}) {
    initPorts();
    if (this.mounted || this.state !== STATES.IDLE) { this.logger.warn('mount.skipped', { reason: 'already-mounted', currentState: this.state }); return; }
    const auth = _getAuth();
    if (!auth?.isAuthenticated?.()) {
      container.innerHTML = `<div class="pfa-auth-required" style="padding:2rem;text-align:center;color:#F59E0B;">${LOCK_SVG} Faça login para acessar este painel</div>`;
      const eventBus = getPort('eventBus');
      eventBus?.emit?.(AUTH_INTENTS.LOGIN, { reason: 'panel-mount-no-auth', source: PANEL_ID });
      return;
    }
    if (!container || !(container instanceof HTMLElement)) { this.logger.error('mount.invalid-container', { container }); throw new Error(`[${PANEL_ID}] Container inválido`); }
    const mountStartTime = performance.now();
    this.setState(STATES.MOUNTING);
    try {
      this.logger.debug('mount.start', { version: VERSION, painel: PANEL_ID });
      this.container = container; this.container.setAttribute('data-painel-id', PANEL_ID); this.container.setAttribute('data-version', VERSION); this.container.setAttribute('data-state', this.state);
      this.eventBus = getPort('eventBus'); this.abortController = new AbortController(); this.consecutiveErrors = 0; this.isDegraded = false;
      this.dataLoader = new (DataLoader as unknown as new (ctx: unknown) => unknown)(this); renderStructure(this.container);
      const contentElement = this.container.querySelector(`#${PANEL_ID}-content`);
      this.uiComponent = new UIComponent(contentElement, this.logger, { onToggle: (flagKey: string) => this.toggleFlag(flagKey), onEdit: (flagKey: string) => this.showEditModal(flagKey), onDelete: (flagKey: string) => this.deleteFlag(flagKey) });
      await this.uiComponent.init();
      setupStateSubscription(this as unknown as Parameters<typeof setupStateSubscription>[0]); setupEventListeners(this as unknown as Parameters<typeof setupEventListeners>[0]);
      await this.dataLoader.loadData();
      startCountdown(this as unknown as Parameters<typeof startCountdown>[0]); this.markLoaded(); this.mounted = true; this.setState(STATES.MOUNTED);
      this.performanceMetrics.mountTime = performance.now() - mountStartTime;
      this.logger.debug('mount.success', { mountTime: `${this.performanceMetrics.mountTime.toFixed(2)}ms`, state: this.state });
      this.eventBus?.emit?.(PANEL_EVENTS.MOUNTED, { panelId: PANEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID, mountTime: this.performanceMetrics.mountTime });
    } catch (error: any) {
      this.setState(STATES.ERROR); this.logger.error('mount.failed', { error: error.message, stack: error.stack });
      this.telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { error: error.message }); throw error;
    }
  }

  _handleVisibilityChange() { if (document.hidden) return; if (this.autoRefreshEnabled && this.dataLoader) { this.dataLoader.loadData(); this.countdownValue = REFRESH_INTERVAL; } }
  _handleRefreshEvent(payload: unknown) { if (this.dataLoader) this.dataLoader.loadData(); this.countdownValue = REFRESH_INTERVAL; }
  _handleAutoRefreshToggle() { toggleAutoRefresh(this as unknown as Parameters<typeof toggleAutoRefresh>[0]); }
  toggleFlag(flagKey: string) { return toggleFlag(this as unknown as Parameters<typeof toggleFlag>[0], flagKey); }
  showCreateModal() { return showCreateModal(this as unknown as Parameters<typeof showCreateModal>[0]); }
  showEditModal(flagKey: string) { return showEditModal(this as unknown as Parameters<typeof showEditModal>[0], flagKey); }
  deleteFlag(flagKey: string) { return deleteFlag(this as unknown as Parameters<typeof deleteFlag>[0], flagKey); }
  setState(newState: string) { this.state = newState; if (this.container) this.container.setAttribute('data-state', newState); }

  async unmount(container: HTMLElement, deps: Record<string, unknown> = {}) {
    if (this.destroyed || this.state === STATES.DESTROYED) return;
    this.setState(STATES.UNMOUNTING);
    stopCountdown(this as unknown as Parameters<typeof stopCountdown>[0]);
    if (this.abortController) { this.abortController.abort(); this.abortController = null; }
    if (this.dataLoader) { this.dataLoader.reset(); this.dataLoader = null; }
    this.apiClient.cancel();
    for (const unsub of this.unsubscribers) { try { unsub(); } catch (e) {} }
    this.unsubscribers = [];
    if (this.eventBus?.off && this._filteredRefreshHandler) { this.eventBus.off(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler); }
    if (this.uiComponent) { await this.uiComponent.destroy(); this.uiComponent = null; }
    this.store.reset();
    if (this.container) { this.container.innerHTML = ''; this.container.removeAttribute('data-painel-id'); this.container.removeAttribute('data-version'); this.container.removeAttribute('data-state'); this.container = null; }
    this.mounted = false; this.destroyed = true; this.consecutiveErrors = 0; this.isDegraded = false; this.loadCount = 0; this.lastLoadTime = 0;
    this.setState(STATES.DESTROYED);
    this.eventBus?.emit?.(PANEL_EVENTS.UNMOUNTED, { panelId: PANEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
  }

  markLoaded() { const eventBus = getPort('eventBus'); eventBus?.emit?.(PANEL_EVENTS.LOADED, { panelId: PANEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID }); }
  getStatus() { return { panelId: PANEL_ID, version: VERSION, state: this.state, mounted: this.mounted, destroyed: this.destroyed, isDegraded: this.isDegraded, consecutiveErrors: this.consecutiveErrors, loadCount: this.loadCount, lastLoadTime: this.lastLoadTime, autoRefreshEnabled: this.autoRefreshEnabled, countdownValue: this.countdownValue, flagsCount: this.store.getFlags().length, portsInitialized: getPorts()._initialized, p22Compliant: true, metrics: { ...this.performanceMetrics } }; }
  refresh() { this.countdownValue = REFRESH_INTERVAL; return this.dataLoader ? this.dataLoader.loadData() : Promise.resolve(); }
  pause() { this.autoRefreshEnabled = false; }
  resume() { this.autoRefreshEnabled = true; this.countdownValue = REFRESH_INTERVAL; }
}

let painelInstance: PanelFeatureFlagsAdmin | null = null;

const mount = async (container: HTMLElement, deps: Record<string, unknown> = {}) => {

  if (painelInstance) { const currentContainer = painelInstance.container; const contentInDOM = currentContainer && document.contains(currentContainer); const sameContainer = currentContainer === container; if (contentInDOM && sameContainer && painelInstance.mounted) return; await unmount(); }
  painelInstance = new PanelFeatureFlagsAdmin();
  return painelInstance.mount(container, deps);
};

const unmount = async (container?: HTMLElement, deps: Record<string, unknown> = {}) => { if (!painelInstance) return; await painelInstance.unmount(container as HTMLElement, deps); painelInstance = null; };
const getStatus = () => painelInstance?.getStatus?.() ?? { panelId: PANEL_ID, mounted: false, p22Compliant: true, destroyed: false, isDegraded: false, consecutiveErrors: 0 };
const getVersion = () => VERSION;

const healthCheck = () => {
  const status = getStatus();
  const checks = { instanceExists: !!painelInstance, mounted: status.mounted === true, notDestroyed: status.destroyed !== true, notDegraded: status.isDegraded !== true, lowErrorCount: (status.consecutiveErrors || 0) < 5, portsInitialized: getPorts()._initialized, abortControllerActive: !!painelInstance?.abortController && !painelInstance.abortController.signal.aborted, noOrphanTimers: status.destroyed !== true || !painelInstance?.countdownInterval, noOrphanPolling: status.destroyed !== true || !painelInstance?.autoRefreshEnabled };
  const score = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;
  return { status: score === maxScore ? 'HEALTHY' : score >= 4 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, panelId: PANEL_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() };
};

// @ts-expect-error strict migration — TS2783
const info = () => ({ panelId: PANEL_ID, version: VERSION, portsInitialized: getPorts()._initialized, p22Compliant: true, ...getStatus() });


const destroy = () => unmount();
export { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts, VERSION, PANEL_ID as MODULE_ID };
export default { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts };
