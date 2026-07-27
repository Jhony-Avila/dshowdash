import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { initPorts, getPort, injectPorts, getPorts, isPortsInitialized } from "./ports.js";
import { createLogger } from "./logger-helper.js";
import { createTelemetry } from "./telemetry-helper.js";
import { bindUIEvents, updateCountdownDisplay, renderAuthBlockedView, renderErrorView } from "./ui-handlers.js";
import { startAutoRefresh, stopAutoRefresh, setupEventListeners, cleanupEventListeners, updatePerformanceMetrics } from "./auto-refresh.js";
import { Store, actions, selectors } from "./state/store.js";
import { CircuitBreaker } from "./utils/circuit-breaker.js";
import { CONFIG } from "./constants.js";
import { injectStyles } from "./styles.js";
import { collectHealthData } from "./collector.js";
import { renderSkeleton, renderDashboard } from "./render.js";
import { STATES } from "./core/states.js";
import { CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, DEFAULT_PERFORMANCE_METRICS, REFRESH_INTERVAL, getErrorMessage } from "./core/config.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-health-dashboard";
const PANEL_ID = MODULE_ID;
(() => {
  initPorts();
  const cssPath = "/components/panels/panel-health-dashboard/styles/index.css";
  const assetLoader = getPort("assetLoader");
  if (assetLoader && assetLoader.loadCSS) {
    assetLoader.loadCSS(cssPath);
  } else if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-painel", "panel-health-dashboard");
    document.head.appendChild(link);
  }
})();
function PanelHealthDashboard() {
  this.PANEL_ID = PANEL_ID;
  this.container = null;
  this.logger = createLogger();
  this.telemetry = createTelemetry(PANEL_ID);
  this.circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, this.logger);
  this.store = Store;
  this.eventBus = null;
  this.state = STATES.IDLE;
  this.mounted = false;
  this.initialLoadDone = false;
  this.destroyed = false;
  this.consecutiveErrors = 0;
  this.isDegraded = false;
  this.lastLoadTime = 0;
  this.loadCount = 0;
  this.abortController = null;
  this.unsubscribers = [];
  this.performanceMetrics = Object.assign({}, DEFAULT_PERFORMANCE_METRICS);
  this.autoRefreshEnabled = true;
  this.countdownValue = REFRESH_INTERVAL / 1e3;
  this.countdownInterval = null;
  this.expandedCategories = /* @__PURE__ */ new Set(["kernels", "core", "components", "panels"]);
  this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
  this._handleRefreshEvent = this._handleRefreshEvent.bind(this);
}
PanelHealthDashboard.prototype.mount = function(container, deps) {
  const self = this;
  deps = deps || {};
  initPorts();
  if (this.mounted || this.state !== STATES.IDLE) {
    this.logger.warn("mount.skipped", { reason: "already-mounted" });
    return Promise.resolve(this);
  }
  const startTime = performance.now();
  this.state = STATES.MOUNTING;
  this.logger.debug("mount.start");
  return Promise.resolve().then(() => {
    const auth = getPort("auth");
    if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) {
      self.logger.warn("mount.blocked", { reason: "not-authenticated" });
      self.container = typeof container === "string" ? document.querySelector(container) : container;
      if (self.container) renderAuthBlockedView(self.container);
      return self;
    }
    self.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!self.container) {
      self.logger.error("mount.failed", { reason: "container-not-found" });
      self.state = STATES.ERROR;
      return null;
    }
    self.eventBus = deps.eventBus || getPort("eventBus");
    self.abortController = new AbortController();
    injectStyles();
    self._renderSkeletonView();
    setupEventListeners(self);
    return self._loadData();
  }).then(() => {
    self.mounted = true;
    self.state = STATES.READY;
    self.performanceMetrics.mountTime = Math.round(performance.now() - startTime);
    if (self.autoRefreshEnabled) startAutoRefresh(self);
    self.logger.debug("mount.success", { time: self.performanceMetrics.mountTime });
    if (self.eventBus && self.eventBus.emit) {
      self.eventBus.emit(COMPONENT_EVENTS.MOUNTED, { componentId: PANEL_ID, moduleId: MODULE_ID, timestamp: Date.now() });
    }
    self.telemetry.ready({ mountTime: self.performanceMetrics.mountTime });
    return self;
  }).catch((error) => {
    self.logger.error("mount.error", { error: error.message });
    self.state = STATES.ERROR;
    self.telemetry.error(error, { phase: "mount" });
    renderErrorView(self.container, error.message, () => {
      self.refresh();
    });
    return self;
  });
};
PanelHealthDashboard.prototype.unmount = function() {
  if (!this.mounted && this.state === STATES.IDLE) return;
  this.logger.debug("unmount.start");
  this.state = STATES.UNMOUNTING;
  stopAutoRefresh(this);
  cleanupEventListeners(this);
  if (this.abortController) {
    this.abortController.abort();
    this.abortController = null;
  }
  if (this.eventBus && this.eventBus.emit) {
    this.eventBus.emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: PANEL_ID, moduleId: MODULE_ID, timestamp: Date.now() });
  }
  if (this.container) {
    this.container.innerHTML = "";
    this.container = null;
  }
  this.mounted = false;
  this.initialLoadDone = false;
  this.state = STATES.IDLE;
  this.consecutiveErrors = 0;
  this.isDegraded = false;
  this.logger.debug("unmount.complete");
  this.telemetry.unmounted("manual");
};
PanelHealthDashboard.prototype.refresh = function() {
  if (!this.mounted || this.state === STATES.LOADING) return Promise.resolve(false);
  return this._loadData();
};
PanelHealthDashboard.prototype._loadData = function() {
  const self = this;
  if (this.circuitBreaker.isOpen()) {
    this.logger.warn("load.blocked", { reason: "circuit-breaker-open" });
    renderErrorView(this.container, getErrorMessage("CIRCUIT_BREAKER_OPEN"), () => {
      self.refresh();
    });
    return Promise.resolve(false);
  }
  const auth = getPort("auth");
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) {
    this.logger.warn("load.blocked", { reason: "not-authenticated" });
    return Promise.resolve(false);
  }
  const startTime = performance.now();
  this.state = STATES.LOADING;
  this.loadCount++;
  if (!this.initialLoadDone) this._renderSkeletonView();
  return Promise.resolve().then(() => {
    self.circuitBreaker.check();
    return collectHealthData();
  }).then((snapshot) => {
    actions.setSnapshot(snapshot);
    actions.setError(null);
    actions.setLoading(false);
    self.consecutiveErrors = 0;
    self.isDegraded = false;
    self.circuitBreaker.recordSuccess();
    const loadTime = Math.round(performance.now() - startTime);
    self.lastLoadTime = loadTime;
    updatePerformanceMetrics(self, loadTime, true);
    self.initialLoadDone = true;
    self.state = STATES.READY;
    self._render();
    self.logger.debug("load.success", { time: loadTime, status: snapshot.overallStatus });
    self.telemetry.refresh({ success: true, time: loadTime });
    return true;
  }).catch((error) => {
    self.consecutiveErrors++;
    self.circuitBreaker.recordFailure(error);
    updatePerformanceMetrics(self, 0, false);
    const errorMsg = error.message && error.message.indexOf("CIRCUIT_BREAKER_OPEN") === 0 ? getErrorMessage("CIRCUIT_BREAKER_OPEN") : error.message;
    actions.setError(errorMsg);
    actions.setLoading(false);
    if (self.consecutiveErrors >= 3) {
      self.isDegraded = true;
      self.state = STATES.DEGRADED;
    } else {
      self.state = STATES.ERROR;
    }
    self._render();
    self.logger.warn("load.error", { error: error.message, consecutive: self.consecutiveErrors });
    self.telemetry.error(error, { phase: "load" });
    return false;
  });
};
PanelHealthDashboard.prototype._render = function() {
  if (!this.container) return;
  const state = this.store.getState();
  if (state.loading && !state.snapshot) {
    this._renderSkeletonView();
    return;
  }
  this.container.innerHTML = renderDashboard(state, CONFIG, this.expandedCategories);
  this._updateCountdownDisplay();
  bindUIEvents(this);
};
PanelHealthDashboard.prototype._renderSkeletonView = function() {
  if (this.container) this.container.innerHTML = renderSkeleton();
};
PanelHealthDashboard.prototype._updateCountdownDisplay = function() {
  updateCountdownDisplay(this);
};
PanelHealthDashboard.prototype._startAutoRefresh = function() {
  startAutoRefresh(this);
};
PanelHealthDashboard.prototype._stopAutoRefresh = function() {
  stopAutoRefresh(this);
};
PanelHealthDashboard.prototype._handleVisibilityChange = function() {
  if (document.visibilityState === "visible" && this.mounted && this.autoRefreshEnabled) {
    this.logger.debug("visibility.visible", { action: "refresh" });
    this.refresh();
  }
};
PanelHealthDashboard.prototype._handleRefreshEvent = function() {
  this.refresh();
};
PanelHealthDashboard.prototype.toggleAutoRefresh = function(enabled) {
  this.autoRefreshEnabled = enabled;
  if (enabled) startAutoRefresh(this);
  else stopAutoRefresh(this);
  this._render();
};
PanelHealthDashboard.prototype.healthCheck = function() {
  const checks = {
    mounted: this.mounted,
    stateValid: [STATES.READY, STATES.MOUNTED, STATES.LOADING].indexOf(this.state) >= 0,
    hasContainer: !!this.container,
    circuitBreakerClosed: this.circuitBreaker.isClosed(),
    notDegraded: !this.isDegraded,
    lowErrorRate: this.consecutiveErrors < 3,
    hasSnapshot: !!selectors.getSnapshot(),
    portsInitialized: isPortsInitialized(),
    abortControllerActive: !!this.abortController && !this.abortController.signal.aborted,
    noOrphanTimers: !this.destroyed || !this.countdownInterval,
    noOrphanPolling: !this.destroyed || !this.autoRefreshEnabled
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed < total * 0.5 ? "UNHEALTHY" : passed < total ? "DEGRADED" : "HEALTHY";
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    state: this.state,
    circuitBreaker: this.circuitBreaker.healthCheck(),
    performance: Object.assign({}, this.performanceMetrics),
    version: VERSION,
    moduleId: MODULE_ID,
    p22Compliant: true,
    timestamp: Date.now()
  };
};
PanelHealthDashboard.prototype.info = function() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: this.mounted,
    state: this.state,
    initialLoadDone: this.initialLoadDone,
    isDegraded: this.isDegraded,
    autoRefreshEnabled: this.autoRefreshEnabled,
    countdownValue: this.countdownValue,
    loadCount: this.loadCount,
    consecutiveErrors: this.consecutiveErrors,
    performance: Object.assign({}, this.performanceMetrics),
    circuitBreaker: this.circuitBreaker.healthCheck(),
    expandedCategories: Array.from(this.expandedCategories),
    portsInitialized: isPortsInitialized(),
    p22Compliant: true
  };
};
PanelHealthDashboard.prototype.getVersion = () => VERSION;
let _instance = null;
function getInstance() {
  if (!_instance) _instance = new PanelHealthDashboard();
  return _instance;
}
const PanelHealthDashboardAPI = {
  mount(container, deps) {
    return getInstance().mount(container, deps);
  },
  unmount() {
    return getInstance().unmount();
  },
  refresh() {
    return getInstance().refresh();
  },
  healthCheck() {
    return getInstance().healthCheck();
  },
  info() {
    return getInstance().info();
  },
  getVersion() {
    return VERSION;
  },
  toggleAutoRefresh(enabled) {
    return getInstance().toggleAutoRefresh(enabled);
  },
  injectPorts,
  getPorts,
  MODULE_ID,
  VERSION
};
if (typeof window !== "undefined" && !isStrict()) window.PanelHealthDashboard = PanelHealthDashboardAPI;
const mount = (container, deps) => PanelHealthDashboardAPI.mount(container, deps);
const unmount = () => PanelHealthDashboardAPI.unmount();
const destroy = () => unmount();
const healthCheck = () => PanelHealthDashboardAPI.healthCheck();
var panel_health_dashboard_default = { ...PanelHealthDashboardAPI, healthCheck };
export {
  MODULE_ID,
  PanelHealthDashboardAPI as PanelHealthDashboard,
  VERSION,
  panel_health_dashboard_default as default,
  destroy,
  getPorts,
  healthCheck,
  injectPorts,
  mount,
  unmount
};
