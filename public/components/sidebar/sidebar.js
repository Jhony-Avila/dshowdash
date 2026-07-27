import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { MODULE_ID, KEYBOARD_CONFIG } from "./core/constants.js";
import { saveCollapsedState } from "./core/state-persistence.js";
import { setDependencies as setErrorDeps, emitDegraded, getDegradedComponents, getStatus, setStatus } from "./core/error-emitter.js";
import { setDependencies as setEventDeps } from "./features/event-setup.js";
import { setLogger as setRouterLogger } from "./features/router-sync.js";
import { reloadNavigation } from "./core/navigation-reload.js";
import SidebarRegistry from "./registry/registry.js";
import NavigationModelLoader from "./integration/navigation-model-loader.js";
import { LIFECYCLE_STATES } from "./domain/sidebar-engine.js";
import { createLogger } from "./telemetry/logger.js";
import { createTracker } from "./telemetry/tracker.js";
import { createPublicMethods } from "./api/public-methods.js";
import { createGetState } from "./api/health-info.js";
import { createInitializer, createSetupCoordinator, createDestroyer } from "./lifecycle/index.js";
import { createMetricsManager } from "./metrics/metrics-manager.js";
import { createHealthReporter } from "./diagnostics/health-reporter.js";
const VERSION = "6.5.1-IMPORT-FIX";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _getEventBus() {
  return _getPort("eventBus") || _getPort("eventBusGlobal");
}
function _getCurrentHashViaPort() {
  const rg = _getPort("routerGlobal");
  if (rg && rg.getCurrentRoute) {
    try {
      const route = rg.getCurrentRoute();
      if (route && (route.hash || route.path)) return route.hash || route.path;
    } catch (e) {
    }
  }
  if (typeof window !== "undefined" && window.location) return window.location.hash || "#/";
  return "#/";
}
class Sidebar {
  constructor() {
    this._logger = createLogger({ debug: false });
    this._tracker = createTracker({ enabled: true });
    this._keyboardNavEnabled = KEYBOARD_CONFIG.enabled;
    this._context = {
      engine: null,
      renderer: null,
      adapters: {},
      ports: null,
      config: null,
      initialized: false,
      initAt: null,
      safeMode: false,
      modelLoaderInitialized: false,
      keyboardNavEnabled: this._keyboardNavEnabled
    };
    this._metricsManager = createMetricsManager();
    this._setupCoordinator = createSetupCoordinator({
      logger: this._logger,
      tracker: this._tracker,
      getPort: _getPort,
      emitDegraded
    });
    this._initializer = createInitializer({
      logger: this._logger,
      tracker: this._tracker,
      metricsManager: this._metricsManager
    });
    this._destroyer = createDestroyer({
      logger: this._logger
    });
    this._healthReporter = createHealthReporter({
      getContext: () => this._context,
      metricsManager: this._metricsManager,
      setupCoordinator: this._setupCoordinator,
      portsManager: Ports
    });
    setErrorDeps(this._logger, this._tracker);
    setEventDeps(this._logger, this._tracker);
    setRouterLogger(this._logger);
    _initPorts();
  }
  get status() {
    return getStatus();
  }
  async init(options) {
    if (options === void 0) options = {};
    if (this._context.initialized) {
      this._logger.warn("Already initialized");
      return { success: true, message: "Already initialized" };
    }
    const initResult = await this._initializer.execute(options, this._context);
    if (!initResult.success) {
      return initResult;
    }
    this._setupCoordinator.setupCore({
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: SidebarRegistry,
      adapters: this._context.adapters,
      onToggle: () => this.toggle(),
      onSetActiveItem: (id) => this._setActiveItem(id),
      onToggleSection: (id) => this.toggleSection(id)
    });
    if (!this._context.safeMode) {
      this._setupCoordinator.setupPostReady({
        engine: this._context.engine,
        renderer: this._context.renderer,
        registry: SidebarRegistry,
        adapters: this._context.adapters,
        onToggle: () => this.toggle(),
        onSetActiveItem: (id) => this._setActiveItem(id),
        onExpandSection: (id) => this.expandSection(id),
        onCollapseSection: (id) => this.collapseSection(id),
        onCloseMobile: () => this.closeMobile(),
        onReloadNavigation: () => this._reloadNavigation()
      });
    } else {
      this._logger.info("SafeMode: Skipping POST_READY features");
    }
    try {
      await this._context.engine.ready();
    } catch (error) {
      emitDegraded("engine-ready", error.message);
    }
    if (this._context.renderer?.setItemsChangedCallback) {
      this._context.renderer.setItemsChangedCallback(() => this._reloadNavigation());
    }
    this._bindPublicMethods();
    this._context.initialized = true;
    this._context.initAt = Date.now();
    const degraded = getDegradedComponents();
    setStatus(degraded.length > 0 ? "degraded" : "healthy");
    this._emitReadyEvent();
    this._logger.info(`Sidebar V6.5 ES6 initialized (${this.status})`, {
      version: VERSION,
      safeMode: this._context.safeMode,
      degradedComponents: degraded,
      modelLoaderInitialized: this._context.modelLoaderInitialized
    });
    this._tracker.track("initialized", {
      version: VERSION,
      status: this.status,
      safeMode: this._context.safeMode
    });
    return { success: true, version: VERSION, status: this.status, safeMode: this._context.safeMode };
  }
  _emitReadyEvent() {
    const bus = _getEventBus();
    if (bus && bus.emit) {
      bus.emit(SIDEBAR_EVENTS.READY, {
        version: VERSION,
        status: this.status,
        safeMode: this._context.safeMode,
        timestamp: Date.now()
      });
      this._logger.info("SIDEBAR_EVENTS.READY emitted");
    }
  }
  _setActiveItem(itemId) {
    try {
      this._metricsManager.incrementNavigations();
      this._context.engine.setActiveItem(itemId);
      this._context.renderer.setActiveItem(itemId);
    } catch (error) {
      this._logger.error("setActiveItem error:", error);
    }
  }
  async _reloadNavigation() {
    return reloadNavigation({
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: SidebarRegistry,
      adapters: this._context.adapters,
      logger: this._logger,
      metrics: this._metricsManager.getAll(),
      modelLoaderInitialized: this._context.modelLoaderInitialized,
      getCurrentHash: _getCurrentHashViaPort
    });
  }
  _bindPublicMethods() {
    const self = this;
    const deps = {
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: SidebarRegistry,
      routerAdapter: this._context.adapters.router,
      permissionsAdapter: this._context.adapters.permissions,
      tracker: this._tracker,
      logger: this._logger,
      saveState() {
        saveCollapsedState(self._context.engine.collapsed);
      }
    };
    const methods = createPublicMethods(deps);
    this.toggle = () => {
      self._metricsManager.incrementToggles();
      return methods.toggle.call(self);
    };
    this.collapse = methods.collapse.bind(this);
    this.expand = methods.expand.bind(this);
    this.forceSync = methods.forceSync?.bind(this);
    this.getToggleMetrics = methods.getToggleMetrics?.bind(this);
    this.toggleSection = methods.toggleSection.bind(this);
    this.expandSection = methods.expandSection.bind(this);
    this.collapseSection = methods.collapseSection.bind(this);
    this.expandAllSections = methods.expandAllSections.bind(this);
    this.collapseAllSections = methods.collapseAllSections.bind(this);
    this.isSectionExpanded = methods.isSectionExpanded.bind(this);
    this.getExpandedSections = methods.getExpandedSections.bind(this);
    this.setAccordionMode = methods.setAccordionMode.bind(this);
    this.openMobile = methods.openMobile.bind(this);
    this.closeMobile = methods.closeMobile.bind(this);
    this.toggleMobile = methods.toggleMobile.bind(this);
    this.navigate = (id) => {
      self._metricsManager.incrementNavigations();
      return methods.navigate.call(self, id);
    };
    this.setBadge = methods.setBadge.bind(this);
    this.refresh = methods.refresh.bind(this);
    this.getState = createGetState(this._context.engine);
    this.healthCheck = () => self._healthReporter.healthCheck();
    this.info = () => self._healthReporter.info();
    this.getManifest = () => self._healthReporter.getManifest();
    this.getMetrics = () => self._healthReporter.getMetrics();
  }
  destroy() {
    this._destroyer.execute(this._context, this._setupCoordinator);
    this._metricsManager.reset();
  }
}
var sidebar_default = Sidebar;
const VERSION_EXPORT = VERSION;
const MODULE_ID_EXPORT = "sidebar";
function getManifest() {
  return {
    registryId: "sidebar",
    version: VERSION,
    loadedAt: null,
    classAvailable: true,
    portsInitialized: Ports.isInitialized(),
    p24ModelFirst: true,
    modular: true,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: "sidebar",
    version: VERSION,
    classAvailable: true,
    portsInitialized: Ports.isInitialized(),
    p24ModelFirst: true,
    modular: true,
    modelLoaderAvailable: typeof NavigationModelLoader !== "undefined"
  };
}
function getMetrics() {
  return {
    classAvailable: true,
    portsInitialized: Ports.isInitialized(),
    modular: true,
    modelLoaderInfo: NavigationModelLoader.info?.() ?? {}
  };
}
function healthCheck() {
  const checks = {
    classAvailable: true,
    portsInitialized: Ports.isInitialized(),
    modelLoaderAvailable: typeof NavigationModelLoader !== "undefined"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    checks,
    issues: [],
    moduleId: "sidebar",
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    p24ModelFirst: true,
    modular: true,
    modelLoaderHealth: NavigationModelLoader.healthCheck?.() ?? { healthy: false },
    timestamp: Date.now()
  };
}
export {
  LIFECYCLE_STATES,
  MODULE_ID_EXPORT,
  SIDEBAR_EVENTS,
  Sidebar,
  VERSION,
  VERSION_EXPORT,
  sidebar_default as default,
  getManifest,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
