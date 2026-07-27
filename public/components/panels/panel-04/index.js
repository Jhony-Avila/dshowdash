import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { PANEL_EVENTS, PANEL_INTENTS, createPanelHandler } from "/core/runtime/events/catalog/panels.events.js";
import { ApiClient } from "./services/api.js";
import { StateStore } from "./state/store.js";
import { UIComponent } from "./ui/component.js";
import { CircuitBreaker } from "./utils/circuit-breaker.js";
import { DataLoader } from "./core/data-loader.js";
import { PAINEL_ID, VERSION as PANEL_TITLE, REFRESH_INTERVAL_SECONDS, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, STATES, DEFAULT_PERFORMANCE_METRICS } from "./core/constants.js";
const MODULE_ID = "panel-04";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const LOCK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ?? false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${PAINEL_ID}]`, ...args);
};
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  if (auth?.isAuthenticated?.()) return true;
  if (typeof window === "undefined") return false;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const sm = window.Core.windowAdapter.get("SessionManager");
    if (sm?.isAuthenticated?.()) return true;
  }
  if (strictMode) return false;
  if (window.SessionManager?.isAuthenticated?.()) {
    recordViolation("WINDOW_SESSIONMANAGER_FALLBACK", { module: MODULE_ID, method: "_isAuthenticated" });
    return true;
  }
  return false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
(() => {
  _initPorts();
  const cssPath = "/components/panels/panel-04/styles/index.css";
  const assetLoader = _getPort("assetLoader");
  if (assetLoader?.loadCSS) assetLoader.loadCSS(cssPath);
  else if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-panel", PAINEL_ID);
    document.head.appendChild(link);
  }
})();
const REFRESH_INTERVAL = REFRESH_INTERVAL_SECONDS || 60;
class Panel04 {
  constructor() {
    this.container = null;
    this.uiComponent = null;
    this.apiClient = null;
    this.store = null;
    this.circuitBreaker = null;
    this.dataLoader = null;
    this.eventBus = null;
    this.state = STATES.IDLE;
    this.mounted = false;
    this.destroyed = false;
    this.initialLoadDone = false;
    this.consecutiveErrors = 0;
    this.isDegraded = false;
    this.lastLoadTime = 0;
    this.loadCount = 0;
    this.abortController = null;
    this.unsubscribers = [];
    this.currentPeriod = "24h";
    this.autoRefreshEnabled = true;
    this.countdownValue = REFRESH_INTERVAL;
    this.countdownInterval = null;
    this.performanceMetrics = { ...DEFAULT_PERFORMANCE_METRICS };
    this._log = _log;
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
  mount(container, deps = {}) {
    _initPorts();
    if (this.mounted || this.state !== STATES.IDLE) {
      _log("warn", "mount.skipped", { state: this.state });
      return Promise.resolve();
    }
    if (!container || !(container instanceof HTMLElement)) return Promise.reject(new Error(`[${PAINEL_ID}] Container inv\xE1lido`));
    if (!_isAuthenticated()) {
      container.innerHTML = `<div style="padding:2rem;text-align:center;color:#F59E0B;">${LOCK_SVG} Fa\xE7a login para acessar</div>`;
      return Promise.resolve();
    }
    const mountStartTime = performance.now();
    this.setState(STATES.MOUNTING);
    return Promise.resolve().then(() => {
      _log("debug", "mount.start", { version: VERSION });
      this.container = container;
      this.container.setAttribute("data-panel-id", PAINEL_ID);
      this.container.setAttribute("data-version", VERSION);
      this.eventBus = _getPort("eventBus");
      this.abortController = new AbortController();
      this.apiClient = new ApiClient(PAINEL_ID, { debug: _debug });
      this.store = new StateStore({ debug: _debug });
      this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT);
      this.dataLoader = new DataLoader(this);
      this.renderStructure();
      const contentEl = this.container.querySelector(`#${PAINEL_ID}-content`);
      this.uiComponent = new UIComponent(contentEl, { debug: _debug, logger: { info: _log, error: _log, debug: _log }, onPeriodChange: this._handlePeriodChange, onManualRefresh: this._handleManualRefresh, onAutoRefreshToggle: this._handleAutoRefreshToggle });
      return this.uiComponent.init();
    }).then(() => {
      this.setupStateSubscription();
      this.setupEventListeners();
      return this.dataLoader.loadData();
    }).then(() => {
      this.startCountdown();
      this.markLoaded();
      this.mounted = true;
      this.setState(STATES.MOUNTED);
      this.performanceMetrics.mountTime = performance.now() - mountStartTime;
      _log("debug", "Montado", { mountTime: `${this.performanceMetrics.mountTime.toFixed(2)}ms` });
      this.eventBus?.emit?.(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: VERSION, mountTime: this.performanceMetrics.mountTime, timestamp: Date.now(), source: MODULE_ID });
    }).catch((error) => {
      this.setState(STATES.ERROR);
      _log("error", "mount.failed", { error: error.message });
      throw error;
    });
  }
  renderStructure() {
    const icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
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
    }, 1e3);
  }
  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    this.uiComponent?.setAutoRefreshState?.(this.autoRefreshEnabled);
    if (this.autoRefreshEnabled) {
      this.countdownValue = REFRESH_INTERVAL;
      this.uiComponent?.updateCountdown?.(this.countdownValue);
    }
    _log("debug", "auto-refresh.toggled", { enabled: this.autoRefreshEnabled });
  }
  setupStateSubscription() {
    const unsubscribe = this.store.subscribe((state) => {
      if (state.loading) {
        if (!this.initialLoadDone && this.uiComponent) this.uiComponent.showLoading();
        this.updateStatus("Atualizando...");
      } else if (state.error) {
        if (!state.data && this.uiComponent) this.uiComponent.showError(state.error);
        this.updateStatus("Erro");
      } else if (state.data) {
        this.uiComponent?.update(state.data);
        this.updateStatus("Atualizado");
        this.updateTimestamp(state.lastUpdate);
        this.countdownValue = REFRESH_INTERVAL;
        this.uiComponent?.updateCountdown?.(this.countdownValue);
      }
    });
    this.unsubscribers.push(unsubscribe);
  }
  setupEventListeners() {
    document.addEventListener("visibilitychange", this._handleVisibilityChange, { signal: this.abortController.signal });
    this.eventBus?.on?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
  }
  _handleVisibilityChange() {
    if (document.hidden) {
      this.apiClient?.cancel?.();
      _log("debug", "Visibility hidden - cancelled requests");
    } else if (this._canRefresh()) {
      this.dataLoader?.loadData();
      this.countdownValue = REFRESH_INTERVAL;
      _log("debug", "Visibility visible - refreshing");
    }
  }
  _handleRefreshEvent(payload) {
    if (!_isAuthenticated()) {
      _log("warn", "refresh.event blocked - not authenticated");
      return;
    }
    _log("debug", "refresh.event");
    this.dataLoader?.loadData();
    this.countdownValue = REFRESH_INTERVAL;
  }
  _handlePeriodChange(period) {
    if (!_isAuthenticated()) {
      _log("warn", "period.change blocked - not authenticated");
      return;
    }
    _log("debug", "period.change", { from: this.currentPeriod, to: period });
    this.currentPeriod = period;
    this.dataLoader?.loadData();
    this.countdownValue = REFRESH_INTERVAL;
  }
  _handleManualRefresh() {
    if (!_isAuthenticated()) {
      _log("warn", "refresh.manual blocked - not authenticated");
      return;
    }
    _log("debug", "refresh.manual");
    this.dataLoader?.loadData();
    this.countdownValue = REFRESH_INTERVAL;
  }
  _handleAutoRefreshToggle() {
    this.toggleAutoRefresh();
  }
  setState(newState) {
    this.state = newState;
    this.container?.setAttribute("data-state", newState);
  }
  updateStatus(status) {
    const el = this.container?.querySelector("[data-status]");
    if (el) el.textContent = status;
  }
  updateTimestamp(ts) {
    const el = this.container?.querySelector("[data-last-update]");
    if (!el || !ts) return;
    const time = new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    el.textContent = `Atualizado: ${time}`;
  }
  markLoaded() {
    const eventBus = _getPort("eventBus");
    eventBus?.emit?.(PANEL_EVENTS.LOADED, { panelId: PAINEL_ID, timestamp: Date.now(), source: MODULE_ID });
  }
  unmount() {
    if (this.destroyed || this.state === STATES.DESTROYED) return Promise.resolve();
    this.setState(STATES.UNMOUNTING);
    _log("debug", "unmount.start");
    return Promise.resolve().then(() => {
      this.stopCountdown();
      this.abortController?.abort();
      if (this.dataLoader) {
        this.dataLoader.reset();
        this.dataLoader = null;
      }
      this.apiClient?.cancel?.();
      this.unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch {
        }
      });
      this.unsubscribers = [];
      this.eventBus?.off?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
      if (this.uiComponent?.destroy) return this.uiComponent.destroy();
    }).then(() => {
      this.store?.reset?.();
      if (this.container) {
        this.container.innerHTML = "";
        this.container = null;
      }
      this.mounted = false;
      this.destroyed = true;
      this.setState(STATES.DESTROYED);
      _log("debug", "Desmontado");
    });
  }
  getStatus() {
    return { panelId: PAINEL_ID, version: VERSION, state: this.state, mounted: this.mounted, destroyed: this.destroyed, isDegraded: this.isDegraded, consecutiveErrors: this.consecutiveErrors, loadCount: this.loadCount, lastLoadTime: this.lastLoadTime, period: this.currentPeriod, autoRefreshEnabled: this.autoRefreshEnabled, countdownValue: this.countdownValue, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), metrics: { ...this.performanceMetrics }, p22Compliant: true, timestamp: Date.now() };
  }
  healthCheck() {
    const checks = { instanceExists: true, mounted: this.mounted, notDestroyed: !this.destroyed, notDegraded: !this.isDegraded, lowErrorCount: this.consecutiveErrors < MAX_CONSECUTIVE_ERRORS, isAuthenticated: _isAuthenticated(), abortControllerActive: !!this.abortController && !this.abortController.signal.aborted, noOrphanTimers: !this.destroyed || !this.countdownInterval, noOrphanPolling: !this.destroyed || !this.autoRefreshEnabled };
    const score = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;
    return { status: score === maxScore ? "HEALTHY" : score >= 4 ? "DEGRADED" : "UNHEALTHY", score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, panelId: PAINEL_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() };
  }
  // @ts-expect-error strict migration — TS2783
  info() {
    return { panelId: PAINEL_ID, version: VERSION, title: PANEL_TITLE, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, timestamp: Date.now(), ...this.getStatus() };
  }
  refresh() {
    if (!_isAuthenticated()) {
      _log("warn", "refresh blocked - not authenticated");
      return Promise.resolve();
    }
    this.countdownValue = REFRESH_INTERVAL;
    return this.dataLoader?.loadData() ?? Promise.resolve();
  }
  pause() {
    this.autoRefreshEnabled = false;
    this.uiComponent?.setAutoRefreshState?.(false);
  }
  resume() {
    this.autoRefreshEnabled = true;
    this.uiComponent?.setAutoRefreshState?.(true);
    this.countdownValue = REFRESH_INTERVAL;
  }
}
let instance = null;
const mount = (container, deps = {}) => {
  if (instance) {
    const cur = instance.container;
    if (cur && document.contains(cur) && cur === container && instance.mounted) return Promise.resolve();
    return unmount().then(() => {
      instance = new Panel04();
      return instance.mount(container, deps);
    });
  }
  instance = new Panel04();
  return instance.mount(container, deps);
};
const unmount = (container, deps) => {
  if (!instance) return Promise.resolve();
  return instance.unmount(container, deps).then(() => {
    instance = null;
  });
};
const getStatus = () => instance?.getStatus?.() ?? { panelId: PAINEL_ID, mounted: false, p22Compliant: true, timestamp: Date.now() };
const getVersion = () => VERSION;
const healthCheck = () => instance?.healthCheck?.() ?? { status: "UNHEALTHY", mounted: false, p22Compliant: true, timestamp: Date.now() };
const info = () => instance?.info?.() ?? { panelId: PAINEL_ID, version: VERSION, mounted: false, p22Compliant: true, timestamp: Date.now() };
const destroy = () => unmount();
var panel_04_default = { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  PAINEL_ID as PANEL_ID,
  VERSION,
  panel_04_default as default,
  destroy,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  unmount
};
