import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import { LifecycleManager } from "./core/lifecycle.js";
import { CircuitBreaker } from "./core/circuit-breaker.js";
import { StateStore } from "./state/store.js";
import { Logger } from "./telemetry/logger.js";
import { Tracker } from "./telemetry/tracker.js";
const MODULE_ID = "panels/panel-footer-wifi";
const VERSION = "9.3.0-P2-ENTERPRISE";
const getVersion = () => VERSION;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
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
const CONFIG = { id: "footer-wifi", area: "footer", label: "Network", icon: "wifi", emoji: "\u{1F4F6}", kind: "panel-component", apiEndpoint: "/api/status/network.php", refreshInterval: 3e4 };
class FooterWifiComponent {
  constructor(options = {}) {
    _initPorts();
    this.container = options.container || null;
    this.config = { ...CONFIG, ...options.config };
    this.eventBus = options.eventBus || _getPort("eventBus");
    this.store = new StateStore({ mounted: false, loading: false, error: null, data: null, usage: "--", status: "unknown" });
    this.lifecycle = new LifecycleManager(this);
    this.circuitBreaker = new CircuitBreaker({ threshold: 3, timeout: 3e4 });
    this.logger = new Logger({ prefix: `[${MODULE_ID}]` });
    this.tracker = new Tracker({ moduleId: MODULE_ID });
    this._mounted = false;
    this._initialized = false;
    this._element = null;
    this._abortController = null;
    this._refreshTimer = null;
    this._metrics = { mountCount: 0, errorCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
  }
  _canRefresh() {
    if (!this._mounted) return false;
    if (!_isDocumentVisible()) return false;
    if (!_isAuthenticated()) return false;
    return true;
  }
  init(ctx) {
    if (this._initialized) return this;
    this._ctx = ctx || {};
    this._initialized = true;
    this.tracker.track(LIFECYCLE_EVENTS.INITIALIZED, { config: this.config });
    return this;
  }
  mount(container) {
    if (this._mounted) return Promise.resolve(this);
    this.container = container || this.container;
    if (!this.container) return Promise.resolve(this);
    if (!_isAuthenticated()) {
      this.container.innerHTML = '<div style="padding:0.5rem;text-align:center;color:#F59E0B;font-size:10px;">\u{1F512}</div>';
      return Promise.resolve(this);
    }
    this._abortController = new AbortController();
    return this.lifecycle.mount().then(() => {
      this.render();
      this.attachEvents();
      this._mounted = true;
      this.store.setState({ mounted: true });
      this._metrics.mountCount++;
      this._metrics.lastMountAt = Date.now();
      this._fetchData();
      this._startRefresh();
      this.eventBus?.emit?.(COMPONENT_EVENTS.MOUNTED, { componentId: CONFIG.id, moduleId: MODULE_ID, timestamp: Date.now() });
      return this;
    }).catch((error) => {
      this._metrics.errorCount++;
      this.tracker.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { error: error.message });
      return this;
    });
  }
  unmount() {
    if (!this._mounted) return Promise.resolve(this);
    this._abortController?.abort();
    this._stopRefresh();
    this.detachEvents();
    return this.lifecycle.unmount().then(() => {
      if (this.container) this.container.innerHTML = "";
      this._mounted = false;
      this._element = null;
      this.store.setState({ mounted: false });
      this.eventBus?.emit?.(COMPONENT_EVENTS.UNMOUNTED, { componentId: CONFIG.id, moduleId: MODULE_ID, timestamp: Date.now() });
      return this;
    });
  }
  async _fetchData() {
    if (!this._canRefresh()) return;
    this.store.setState({ loading: true });
    this._metrics.fetchCount++;
    this._metrics.lastFetchAt = Date.now();
    try {
      const response = await fetch(this.config.apiEndpoint, { signal: this._abortController?.signal, credentials: "include", headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if ((result.ok ?? result.success) && result.data) {
        this.store.setState({ loading: false, error: null, data: result.data, usage: result.data.usage || "--", status: result.data.status || "unknown" });
        this._updateDisplay();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        this._metrics.errorCount++;
        this.store.setState({ loading: false, error: error.message });
      }
    }
  }
  _startRefresh() {
    this._stopRefresh();
    this._refreshTimer = setInterval(() => {
      if (this._canRefresh()) this._fetchData();
    }, this.config.refreshInterval);
  }
  _stopRefresh() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }
  render() {
    this._element = document.createElement("div");
    this._element.className = `enterprise-component ${CONFIG.id}`;
    this._element.setAttribute("data-module-id", MODULE_ID);
    this._element.setAttribute("data-version", VERSION);
    this._element.innerHTML = `<div class="panel-enterprise panel-${CONFIG.id}" title="Network Status"><span class="footer-icon">${CONFIG.emoji}</span><span class="footer-value" data-metric="usage">--</span></div>`;
    this.container.innerHTML = "";
    this.container.appendChild(this._element);
  }
  _updateDisplay() {
    if (!this._element) return;
    const state = this.store.getState();
    const valueEl = this._element.querySelector(".footer-value");
    if (valueEl) {
      valueEl.textContent = state.usage;
      valueEl.classList.remove("status-ok", "status-warn", "status-error");
      if (state.status === "online") valueEl.classList.add("status-ok");
      else valueEl.classList.add("status-error");
    }
  }
  attachEvents() {
    this._unsubscribe = this.store.subscribe((state, prev) => {
      if (state.usage !== prev.usage) this._updateDisplay();
    });
  }
  detachEvents() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }
  healthCheck() {
    const ps = Ports.snapshot();
    const checks = { initialized: this._initialized, mounted: this._mounted, hasContainer: !!this.container, portsInitialized: ps._initialized, hasData: !!this.store.getState().data, isAuthenticated: _isAuthenticated(), abortControllerActive: !!this._abortController && !this._abortController.signal.aborted };
    const passed = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;
    return { status: passed === maxScore ? "HEALTHY" : "DEGRADED", score: passed, maxScore, version: VERSION, moduleId: MODULE_ID, p22Compliant: true };
  }
  info() {
    const ps = Ports.snapshot();
    return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), portsInitialized: ps._initialized, p22Compliant: true, metrics: this._metrics, state: this.store.getState() };
  }
  getState() {
    return this.store.getState();
  }
  getMetrics() {
    return { ...this._metrics };
  }
  refresh() {
    if (this._canRefresh()) return this._fetchData();
    return Promise.resolve();
  }
}
let _currentInstance = null;
const mount = (container, config) => {
  const instance = new FooterWifiComponent({ container, config });
  instance.init();
  instance.mount(container);
  _currentInstance = instance;
  return { success: true, moduleId: MODULE_ID, instance };
};
const unmount = () => {
  if (_currentInstance) {
    const instance = _currentInstance;
    _currentInstance = null;
    instance.unmount();
  }
  return { success: true, moduleId: MODULE_ID };
};
const destroy = () => unmount();
const healthCheck = () => _currentInstance?.healthCheck() ?? { status: "UNHEALTHY", mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
var panel_footer_wifi_default = { FooterWifiComponent, mount, unmount, destroy, healthCheck, getVersion, MODULE_ID, VERSION, injectPorts, getPorts };
export {
  FooterWifiComponent,
  MODULE_ID,
  VERSION,
  panel_footer_wifi_default as default,
  destroy,
  getPorts,
  getVersion,
  healthCheck,
  injectPorts,
  mount,
  unmount
};
