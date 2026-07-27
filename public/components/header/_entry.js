import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { VERSION as MODULE_ID, log, isDebug, setDebugMode, _metrics, resetMetrics, getMetrics, getIntegrationsStatus } from "./core/logger.js";
import { loadCSSFromMeta } from "./core/css-loader.js";
import { setupGlobalStateIntegration, updateUserDisplay } from "./core/global-state-integration.js";
import { healthCheck as performHealthCheck, info as getInfo, createDebugAPI } from "./core/diagnostics.js";
import { registerWindowGlobals } from "./core/auto-init.js";
import { executeMount, handleMountError } from "./core/mount-handler.js";
import { executeUnmount } from "./core/unmount-handler.js";
import { Logger } from "./telemetry/logger.js";
import { TelemetryTracker } from "./telemetry/tracker.js";
import { TimersManager } from "./utils/timers.js";
import { StateStore } from "./state/store.js";
import { LifecycleManager } from "./core/lifecycle.js";
import { createFetchClient } from "./api/fetch.js";
import { HeaderInitializer } from "./core/header-initializer.js";
import { HeaderManagers } from "./core/header-managers.js";
import { HeaderUI } from "./core/header-ui.js";
import { HeaderEvents } from "./core/header-events/index.js";
import { HeaderAPI } from "./core/header-api.js";
import { MountCircuitBreaker } from "./core/circuit-breaker.js";
import * as HeaderIntegrations from "./core/header-integrations.js";
import * as DevTools from "./core/devtools.js";
import * as FeatureFlags from "./core/feature-flags.js";
const VERSION = "8.5.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
loadCSSFromMeta();
function _safeDevToolsDisable() {
  if (typeof DevTools.disable === "function") {
    const disableFn = DevTools.disable;
    disableFn.call(DevTools);
  }
}
function Header(options = {}) {
  this.instanceId = options.instanceId || `header-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  this.version = VERSION;
  this.sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  this.isMounted = false;
  this.isDestroyed = false;
  this.isMounting = false;
  this.config = null;
  this.logger = null;
  this.telemetry = null;
  this.timers = null;
  this.store = null;
  this.lifecycle = null;
  this.eventBus = null;
  this._localListeners = [];
  this.fetchClient = null;
  this.healthAPI = null;
  this.alertsAPI = null;
  this.networkMonitor = null;
  this.polling = null;
  this.statusTray = null;
  this.tooltips = null;
  this.envChip = null;
  this.infoIcons = null;
  this.scrollDetector = null;
  this.fullscreenManager = null;
  this.refreshCoordinator = null;
  this.rovingTabindex = null;
  this.announceManager = null;
  this.shortcuts = null;
  this.rippleManager = null;
  this.notifications = null;
  this.currencyPanel = null;
  this.weatherPanel = null;
  this.connectivityModal = null;
  this.alertsPanel = null;
  this.healthPanel = null;
  this.elements = {};
  this.features = { refresh: false, fullscreen: false };
  this.reducedMode = false;
  this.pollingRestored = false;
  this.abortControllers = { global: null, componentsReady: null, fallback: null, visibility: null, connectivity: null };
  this.performanceObserver = null;
  this.options = options;
  this.globalStateCleanups = [];
  this.circuitBreaker = new MountCircuitBreaker();
  this.fallbackManager = null;
  this.routerIntegration = null;
  this.componentsLoader = null;
  this.initializer = new HeaderInitializer(this);
  this.managers = new HeaderManagers(this);
  this.ui = new HeaderUI(this);
  this.events = new HeaderEvents(this);
  this.api = new HeaderAPI(this);
  this.integrations = null;
  _initPorts();
  log("info", "Header instance created (v8.4.0-ES6)");
}
Header.prototype._validateContainer = (container) => {
  if (!container) throw new TypeError("Container e obrigatorio");
  if (!(container instanceof Element)) throw new TypeError("Container deve ser um Element");
  if (!container.isConnected) throw new Error("Container nao esta no DOM");
  return true;
};
Header.prototype._setupGlobalStateIntegration = function() {
  this.globalStateCleanups = setupGlobalStateIntegration(this);
};
Header.prototype._updateUserDisplay = (session) => {
  updateUserDisplay(session);
};
Header.prototype.mount = function(container) {
  if (this.isMounted) {
    log("warn", "Header ja montado");
    return Promise.resolve(this);
  }
  if (this.isMounting) {
    log("warn", "Mount ja em andamento");
    return Promise.resolve(this);
  }
  if (this.isDestroyed) {
    return Promise.reject(new Error("Nao pode montar header destruido - crie nova instancia"));
  }
  this.circuitBreaker.check();
  this._validateContainer(container);
  this.isMounting = true;
  const self = this;
  return executeMount(this, container).then(() => self._initEnterpriseIntegrations()).catch((error) => handleMountError(self, error));
};
Header.prototype._initEnterpriseIntegrations = function() {
  const self = this;
  const configPort = _getPort("config");
  const debugMode = configPort && configPort.app && configPort.app.debug || isDebug();
  FeatureFlags.init();
  const integrationConfig = {
    id: "header-enterprise",
    version: VERSION,
    name: "Header Enterprise Integrations",
    description: "Enterprise modules for Header component",
    features: {
      routerIntegration: true,
      globalStateIntegration: true,
      eventBusIntegration: true,
      appShellIntegration: true,
      telemetryEnabled: true,
      circuitBreakerEnabled: true,
      pollingEnabled: true,
      accessibilityEnabled: true,
      selfHealingEnabled: FeatureFlags.isEnabled("selfHealingEnabled"),
      gracefulDegradationEnabled: FeatureFlags.isEnabled("gracefulDegradationEnabled"),
      pluginSystemEnabled: FeatureFlags.isEnabled("pluginSystemEnabled"),
      lazyLoadingEnabled: FeatureFlags.isEnabled("lazyLoadingEnabled")
    },
    api: {
      healthEndpoint: "/api/health/status.php",
      alertsEndpoint: "/api/alerts/header-alerts.php",
      timeout: 6e3,
      retries: 1
    },
    polling: {
      healthInterval: 18e5,
      alertsInterval: 2e6
    },
    telemetry: {
      enabled: true,
      sampleRate: 0.1
    },
    defaults: {
      locale: "pt-BR",
      environment: "production",
      debug: debugMode
    }
  };
  return HeaderIntegrations.init(this, integrationConfig).then(() => {
    self.integrations = HeaderIntegrations;
    if (FeatureFlags.isEnabled("selfHealingEnabled") || FeatureFlags.isEnabled("gracefulDegradationEnabled")) {
      HeaderIntegrations.start();
    }
    if (debugMode) {
      DevTools.init(self, HeaderIntegrations);
      log("info", "DevTools ativado - use window.__headerDev.help()");
    }
    log("info", "Enterprise integrations initialized");
    return self;
  }).catch((error) => {
    log("warn", "Enterprise integrations failed (non-fatal):", error.message);
    return self;
  });
};
Header.prototype.initCore = function() {
  const configPort = _getPort("config");
  const configDebug = configPort && configPort.app && configPort.app.debug || false;
  this.logger = new Logger({ debug: isDebug() || configDebug, prefix: `[Header:${this.instanceId.substr(-8)}]` });
  this.eventBus = _getPort("eventBus");
  if (!this.eventBus) {
    log("warn", "EventBus global nao disponivel via Ports, Header operara em modo degradado");
  }
  this._localListeners = [];
  this.telemetry = new TelemetryTracker(this.config || {}, this.logger);
  this.timers = new TimersManager();
  this.store = new StateStore(this.logger);
  this.lifecycle = new LifecycleManager({ instanceId: this.instanceId, eventBus: this.eventBus, enableTelemetry: true, autoRecovery: true });
  this.abortControllers.global = new AbortController();
  this.abortControllers.componentsReady = new AbortController();
  this.abortControllers.fallback = new AbortController();
  this.abortControllers.visibility = new AbortController();
  this.abortControllers.connectivity = new AbortController();
  const self = this;
  this.fetchClient = createFetchClient({
    timeout: 6e3,
    retries: 3,
    logger: this.logger,
    telemetry: this.telemetry,
    onCircuitStateChange(transition) {
      log("info", `Circuit Breaker: ${transition.from} -> ${transition.to}`);
      if (self.eventBus && self.eventBus.emit) {
        self.eventBus.emit(HEADER_EVENTS.ORCHESTRATOR_STATUS_CHANGED, { circuit: transition.to, timestamp: Date.now() });
      }
    }
  });
  if (isDebug()) {
    log("debug", "Boot Diagnostics:", { instanceId: this.instanceId, version: this.version, sessionId: this.sessionId });
  }
};
Header.prototype._registerLocalListener = function(eventName, handler) {
  if (this.eventBus && this.eventBus.on) {
    this.eventBus.on(eventName, handler);
    this._localListeners.push({ eventName, handler });
  }
};
Header.prototype._cleanupLocalListeners = function() {
  if (this.eventBus && this.eventBus.off) {
    this._localListeners.forEach(function(item) {
      this.eventBus.off(item.eventName, item.handler);
    }, this);
  }
  this._localListeners = [];
};
Header.prototype.propagateNetworkQuality = function(quality) {
  this.events.propagateNetworkQuality(quality);
};
Header.prototype.showFallback = function(type, message, options) {
  type = type || "generic";
  message = message || "Erro ao carregar dados";
  options = options || {};
  if (this.fallbackManager) this.fallbackManager.show(type, message, options);
};
Header.prototype.hideFallback = function() {
  if (this.fallbackManager) this.fallbackManager.hide();
};
Header.prototype.unmount = function() {
  if (this.isDestroyed) {
    log("warn", "Header ja destruido");
    return Promise.resolve();
  }
  if (!this.isMounted) {
    log("warn", "Header nao esta montado");
    return Promise.resolve();
  }
  if (this.integrations && this.integrations.cleanup) {
    this.integrations.cleanup();
  }
  _safeDevToolsDisable();
  return executeUnmount(this);
};
Header.prototype.refresh = function() {
  if (!this.refreshCoordinator) {
    log("warn", "RefreshCoordinator nao disponivel");
    return;
  }
  _metrics.refreshCount++;
  _metrics.lastActivity = Date.now();
  this.refreshCoordinator.request();
};
Header.prototype.getState = function() {
  return this.store ? this.store.getState() : {};
};
Header.prototype.getCurrentRoute = function() {
  return this.routerIntegration ? this.routerIntegration.getCurrentRoute() : null;
};
Header.prototype.log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  log.apply(null, [level].concat(args));
};
Header.prototype._emitGlobalEvent = (eventName, detail) => {
  const event = new CustomEvent(eventName, { detail, bubbles: true, cancelable: false });
  document.dispatchEvent(event);
};
Header.prototype.setDebug = function(enabled) {
  setDebugMode(enabled);
  if (this.logger && this.logger.setDebug) this.logger.setDebug(enabled);
  if (this.telemetry && this.telemetry.setDebug) this.telemetry.setDebug(enabled);
  if (this.events && this.events.setDebug) this.events.setDebug(enabled);
  if (enabled && !DevTools.isEnabled()) {
    DevTools.init(this, this.integrations);
  } else if (!enabled && DevTools.isEnabled()) {
    _safeDevToolsDisable();
  }
  log("info", `Debug mode: ${isDebug()}`);
};
Header.prototype.getMetrics = () => getMetrics();
Header.prototype.getIntegrationsStatus = () => getIntegrationsStatus();
Header.prototype.resetMetrics = function() {
  resetMetrics();
  if (this.events && this.events.resetMetrics) this.events.resetMetrics();
};
Header.prototype.healthCheck = function() {
  const hc = performHealthCheck(this);
  hc.portsInitialized = Ports.isInitialized();
  hc.p26Compliant = true;
  hc.p0Compliant = true;
  hc.usesGlobalEventBus = !!this.eventBus;
  hc.enterpriseVersion = VERSION;
  if (this.integrations && this.integrations.healthCheck) {
    hc.enterpriseIntegrations = this.integrations.healthCheck();
  }
  return hc;
};
Header.prototype.info = function() {
  const i = getInfo(this);
  i.portsInitialized = Ports.isInitialized();
  i.p26Compliant = true;
  i.p0Compliant = true;
  i.usesGlobalEventBus = !!this.eventBus;
  i.localListenersCount = this._localListeners.length;
  i.enterpriseVersion = VERSION;
  if (this.integrations && this.integrations.info) {
    i.enterpriseIntegrations = this.integrations.info();
  }
  i.featureFlags = FeatureFlags.getAll();
  return i;
};
Header.prototype.getVersion = () => VERSION;
Header.prototype.getIntegrations = function() {
  return this.integrations;
};
Header.prototype.getFeatureFlags = () => FeatureFlags;
const createHeader = (options) => {
  options = options || {};
  return new Header(options);
};
const mount = (container, options) => {
  options = options || {};
  const instance = createHeader(options);
  return instance.mount(container).then(() => {
    if (typeof window !== "undefined") {
      if (!isStrict()) {
        window.__headerAPIInstance = instance;
      } else {
        recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "(window as any).__headerAPIInstance", context: "mount()" });
      }
    }
    return instance;
  });
};
const getHeaderInstance = () => {
  if (typeof window === "undefined") return null;
  if (isStrict()) {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "(window as any).__headerAPIInstance", context: "getHeaderInstance()" });
    return null;
  }
  return window.__headerAPIInstance || null;
};
var entry_default = { createHeader, mount, getHeaderInstance, VERSION, MODULE_ID, injectPorts, getPorts };
if (!isStrict()) {
  registerWindowGlobals(createHeader, mount, getHeaderInstance);
} else {
  recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "registerWindowGlobals", context: "module-init" });
}
if (typeof window !== "undefined") {
  window.__dev = window.__dev || {};
  window.__dev.header = createDebugAPI(getHeaderInstance);
}
export {
  MODULE_ID,
  VERSION,
  createHeader,
  entry_default as default,
  getHeaderInstance,
  getPorts,
  injectPorts,
  mount
};
