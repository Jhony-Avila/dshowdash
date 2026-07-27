import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { PANEL_EVENTS, PANEL_INTENTS, createPanelHandler } from "/core/runtime/events/catalog/panels.events.js";
import { ApiClient } from "./services/api.js";
import { StateStore } from "./state/store.js";
import { UIComponent } from "./ui/component.js";
import { CircuitBreaker } from "./utils/circuit-breaker.js";
import { PAINEL_ID, VERSION as PANEL_TITLE, REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED, REQUEST_TIMEOUT, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, STATES } from "./core/constants.js";
const MODULE_ID = "panel-14";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
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
  const cssPath = "/components/panels/panel-14/styles/index.css";
  const assetLoader = _getPort("assetLoader");
  if (assetLoader?.loadCSS) assetLoader.loadCSS(cssPath);
  else if (typeof document !== "undefined" && !document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-panel", PAINEL_ID);
    document.head.appendChild(link);
  }
})();
class Panel14 {
  constructor() {
    this.container = null;
    this.uiComponent = null;
    this.apiClient = null;
    this.store = null;
    this.circuitBreaker = null;
    this.eventBus = null;
    this.state = STATES.IDLE;
    this.mounted = false;
    this.destroyed = false;
    this.refreshTimer = null;
    this.countdownTimer = null;
    this.consecutiveErrors = 0;
    this.isDegraded = false;
    this.lastLoadTime = 0;
    this.loadCount = 0;
    this.abortController = null;
    this.unsubscribers = [];
    this.currentRequestId = 0;
    this.activeLoadRequest = null;
    this._countdownValue = 60;
    this._autoRefreshEnabled = true;
    this._handleVisibilityChange = () => this._onVisibilityChange();
    this._handleRefreshEvent = (payload) => this._onRefreshEvent(payload);
    this._filteredRefreshHandler = createPanelHandler(PAINEL_ID, this._handleRefreshEvent);
  }
  _canRefresh() {
    if (!this.mounted) return false;
    if (!this._autoRefreshEnabled) return false;
    if (!_isDocumentVisible()) return false;
    if (!_isAuthenticated()) return false;
    if (this.isDegraded) return false;
    return true;
  }
  mount(container, deps = {}) {
    if (this.mounted || this.state !== STATES.IDLE) {
      _log("warn", "mount.skipped", { state: this.state });
      return Promise.resolve();
    }
    if (!container || !(container instanceof HTMLElement)) return Promise.reject(new Error(`[${PAINEL_ID}] Container inv\xE1lido`));
    if (!_isAuthenticated()) {
      container.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;">Fa\xE7a login para acessar</div>';
      return Promise.resolve();
    }
    this.setState(STATES.MOUNTING);
    return new Promise((resolve, reject) => {
      try {
        _log("info", "mount.start", { version: VERSION });
        _initPorts();
        this.container = container;
        this.container.setAttribute("data-panel-id", PAINEL_ID);
        this.container.setAttribute("data-version", VERSION);
        this.eventBus = _getPort("eventBus");
        this.abortController = new AbortController();
        this.apiClient = new ApiClient(PAINEL_ID, { debug: _debug });
        this.store = new StateStore({ debug: _debug });
        this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT);
        this.renderStructure();
        const contentEl = this.container.querySelector(`#${PAINEL_ID}-content`);
        this.uiComponent = new UIComponent(contentEl, { debug: _log, info: _log, error: _log });
        this.uiComponent.init().then(() => {
          this.setupStateSubscription();
          this.setupEventListeners();
          return this.loadData();
        }).then(() => {
          this.startAutoRefresh();
          this.startCountdown();
          this.mounted = true;
          this.setState(STATES.MOUNTED);
          _log("info", "Montado", { version: VERSION });
          this.eventBus?.emit?.(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
          resolve();
        }).catch((error) => {
          this.setState(STATES.ERROR);
          _log("error", "mount.failed", { error: error.message });
          reject(error);
        });
      } catch (error) {
        this.setState(STATES.ERROR);
        _log("error", "mount.failed", { error: error.message });
        reject(error);
      }
    });
  }
  renderStructure() {
    this.container.innerHTML = `<div class="${PAINEL_ID}-wrapper" role="region" aria-label="${PANEL_TITLE}"><main id="${PAINEL_ID}-content" class="${PAINEL_ID}-content" aria-busy="true"></main></div>`;
  }
  setupStateSubscription() {
    const unsubscribe = this.store.subscribe((state) => {
      if (state.loading) this.uiComponent?.showLoading?.();
      else if (state.error) this.uiComponent?.showError?.(state.error);
      else if (state.data) this.uiComponent?.update?.(state.data);
    });
    this.unsubscribers.push(unsubscribe);
  }
  setupEventListeners() {
    document.addEventListener("visibilitychange", this._handleVisibilityChange, { signal: this.abortController.signal });
    this.eventBus?.on?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
  }
  _onVisibilityChange() {
    if (document.hidden) {
      this.apiClient?.cancel?.();
      this.stopCountdown();
    } else if (this._canRefresh()) {
      this.loadData();
      this.startCountdown();
    }
  }
  _onRefreshEvent(payload) {
    if (!_isAuthenticated()) {
      _log("warn", "refresh.event blocked - not authenticated");
      return;
    }
    _log("info", "refresh.event");
    this._countdownValue = 60;
    this.loadData();
  }
  loadData() {
    if (this.activeLoadRequest) return Promise.resolve();
    if (!_isDocumentVisible()) return Promise.resolve();
    if (!_isAuthenticated()) {
      _log("warn", "loadData blocked - not authenticated");
      return Promise.resolve();
    }
    if (!this.mounted || this.destroyed) return Promise.resolve();
    try {
      this.circuitBreaker.check();
    } catch {
      this.setState(STATES.DEGRADED);
      return Promise.resolve();
    }
    const requestId = ++this.currentRequestId;
    this.activeLoadRequest = requestId;
    this.setState(STATES.LOADING);
    this.store.setLoading(true);
    return this.apiClient.fetchData({ signal: this.abortController.signal, timeout: REQUEST_TIMEOUT }).then((result) => {
      if (this.activeLoadRequest !== requestId) return;
      if (result.success && result.payload) {
        this.consecutiveErrors = 0;
        if (this.isDegraded) {
          this.isDegraded = false;
          this.setState(STATES.READY);
        }
        this.store.setData(result.payload);
        this.circuitBreaker.recordSuccess();
        this.setState(STATES.READY);
        _log("debug", "load.success");
      } else throw new Error(String(result.error) || "Resposta inv\xE1lida");
    }).catch((error) => {
      if (error.name === "AbortError") return;
      this.consecutiveErrors++;
      this.circuitBreaker.recordFailure();
      this.store.setError(error.message);
      _log("error", "load.failed", { error: error.message });
      if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        this.isDegraded = true;
        this.setState(STATES.DEGRADED);
      } else this.setState(STATES.ERROR);
    }).finally(() => {
      if (this.activeLoadRequest === requestId) this.activeLoadRequest = null;
      this.store.setLoading(false);
      this.lastLoadTime = Date.now();
      this.loadCount++;
    });
  }
  startAutoRefresh() {
    this.stopAutoRefresh();
    const tick = () => {
      if (this.refreshTimer) clearTimeout(this.refreshTimer);
      const interval = this.isDegraded ? REFRESH_INTERVAL_DEGRADED : REFRESH_INTERVAL_BASE;
      this.refreshTimer = setTimeout(() => {
        if (this._canRefresh()) {
          this.loadData().then(() => {
            this._countdownValue = 60;
          });
        }
        tick();
      }, interval);
    };
    tick();
  }
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  startCountdown() {
    this.stopCountdown();
    this._countdownValue = 60;
    this.countdownTimer = setInterval(() => {
      if (!this._autoRefreshEnabled) return;
      if (!_isDocumentVisible()) return;
      this._countdownValue--;
      if (this._countdownValue <= 0) this._countdownValue = 60;
      const el = this.container?.querySelector("[data-countdown]");
      if (el) el.textContent = this._countdownValue;
    }, 1e3);
  }
  stopCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
  unmount() {
    if (this.destroyed || this.state === STATES.DESTROYED) return Promise.resolve();
    this.setState(STATES.UNMOUNTING);
    _log("info", "unmount.start");
    return new Promise((resolve) => {
      try {
        this.abortController?.abort();
        this.stopAutoRefresh();
        this.stopCountdown();
        this.apiClient?.cancel?.();
        this.unsubscribers.forEach((fn) => {
          try {
            fn();
          } catch {
          }
        });
        this.unsubscribers = [];
        this.eventBus?.off?.(PANEL_INTENTS.REFRESH, this._filteredRefreshHandler);
        this.uiComponent?.destroy?.();
        this.store?.reset?.();
        if (this.container) {
          this.container.innerHTML = "";
          this.container = null;
        }
        this.mounted = false;
        this.destroyed = true;
        this.setState(STATES.DESTROYED);
        _log("info", "Desmontado");
        this.eventBus?.emit?.(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
        resolve();
      } catch (error) {
        _log("error", "unmount.failed", { error: error.message });
        resolve();
      }
    });
  }
  setState(newState) {
    this.state = newState;
    this.container?.setAttribute("data-state", newState);
  }
  getStatus() {
    return { panelId: PAINEL_ID, version: VERSION, state: this.state, mounted: this.mounted, autoRefresh: this._autoRefreshEnabled, countdown: this._countdownValue, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, timestamp: Date.now() };
  }
  healthCheck() {
    const checks = { instanceExists: true, mounted: this.mounted, notDestroyed: !this.destroyed, notDegraded: !this.isDegraded, lowErrorCount: this.consecutiveErrors < MAX_CONSECUTIVE_ERRORS, isAuthenticated: _isAuthenticated(), abortControllerActive: !!this.abortController && !this.abortController.signal.aborted, noOrphanPolling: !this.destroyed || !this._autoRefreshEnabled };
    const score = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;
    return { status: score === maxScore ? "HEALTHY" : score >= 4 ? "DEGRADED" : "UNHEALTHY", score, maxScore, checks, panelId: PAINEL_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() };
  }
  // @ts-expect-error strict migration — TS2783
  info() {
    return { panelId: PAINEL_ID, version: VERSION, title: PANEL_TITLE, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p22Compliant: true, timestamp: Date.now(), ...this.getStatus() };
  }
}
let instance = null;
const mount = (container, deps = {}) => {
  if (instance?.mounted) {
    _log("warn", "Instance exists");
    return Promise.resolve();
  }
  instance = new Panel14();
  return instance.mount(container, deps);
};
const unmount = () => {
  if (instance) return instance.unmount().then(() => {
    instance = null;
  });
  return Promise.resolve();
};
const getStatus = () => instance?.getStatus?.() ?? { panelId: PAINEL_ID, mounted: false, p22Compliant: true, timestamp: Date.now() };
const getVersion = () => VERSION;
const healthCheck = () => instance?.healthCheck?.() ?? { status: "UNHEALTHY", mounted: false, p22Compliant: true, timestamp: Date.now() };
const info = () => instance?.info?.() ?? { panelId: PAINEL_ID, version: VERSION, mounted: false, p22Compliant: true, timestamp: Date.now() };
const destroy = () => unmount();
var panel_14_default = { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  PAINEL_ID as PANEL_ID,
  VERSION,
  panel_14_default as default,
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
