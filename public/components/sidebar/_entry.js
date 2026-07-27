import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { VERSION, MODULE_ID, CAPABILITIES } from "./core/constants.js";
import { LIFECYCLE_STATES } from "./domain/state-machine.js";
import { default as default2 } from "./registry/registry.js";
import { Sidebar } from "./sidebar.js";
import { MODULE_ID as MODULE_ID2, CAPABILITIES as CAPABILITIES2 } from "./core/constants.js";
import { setupWindowAPI } from "./core/window-api.js";
import { setupDevTools } from "./core/dev-tools.js";
import * as Kernel from "./kernel/index.js";
import * as MetricsHub from "./telemetry/metrics-hub.js";
import * as CircuitBreaker from "./kernel/circuit-breaker.js";
import * as HealthMonitor from "./kernel/health-monitor.js";
import { createCreateSidebar, createGetSidebar, createDestroySidebar } from "./core/sidebar-lifecycle.js";
import { createHealthCheck, createInfo, createGetMetrics, kernelNamespace, metricsHubNamespace, circuitBreakerNamespace, healthMonitorNamespace } from "./api/observability.js";
const VERSION2 = "7.4.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID2 });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const prefix = "[Sidebar]";
  const logger = _getPort("logger");
  if (logger && logger[level]) {
    logger[level](...[prefix].concat(args));
  } else if (level === "error" || level === "warn" || level === "info") {
    const fn = console.debug;
    fn.apply(console, [prefix].concat(args));
  }
};
function _getEventBus() {
  return _getPort("eventBus") || _getPort("eventBusGlobal");
}
let _instance = null;
let _featuresLoaded = false;
const _featureModules = /* @__PURE__ */ new Map();
let _safeMode = false;
const DEFAULT_CONFIG = {
  enableConsoleCommands: true,
  enableHealthMonitor: true,
  enableCircuitBreaker: true,
  healthMonitorIntervalMs: 3e4,
  healthMonitorAutoRecover: true,
  circuitBreakerFailureThreshold: 5,
  circuitBreakerTimeout: 3e4,
  autoEnableMaxPriority: 1,
  featureEnableTimeoutMs: 5e3,
  logLevel: "info"
};
let _config = Object.assign({}, DEFAULT_CONFIG);
let _moduleMetrics = {
  instancesCreated: 0,
  featuresRegistered: 0,
  featuresEnabled: 0,
  featuresSkipped: 0,
  featureErrors: 0,
  circuitBreakerBlocks: 0,
  initTime: null,
  lastError: null,
  safeModeBoots: 0
};
const _getSidebarEl = () => {
  if (!_instance || !_instance._renderer || !_instance._renderer.getSidebar) return null;
  return _instance._renderer.getSidebar();
};
const ctx = {
  Ports,
  VERSION: VERSION2,
  DEFAULT_CONFIG,
  log: _log,
  initPorts: _initPorts,
  getEventBus: _getEventBus,
  getSidebarEl: _getSidebarEl,
  moduleMetrics: _moduleMetrics,
  featureModules: _featureModules,
  getInstance: () => _instance,
  setInstance: (v) => {
    _instance = v;
  },
  getConfig: () => _config,
  setConfig: (v) => {
    _config = v;
  },
  getSafeMode: () => _safeMode,
  setSafeMode: (v) => {
    _safeMode = v;
  },
  getFeaturesLoaded: () => _featuresLoaded,
  setFeaturesLoaded: (v) => {
    _featuresLoaded = v;
  }
};
const createSidebar = createCreateSidebar(ctx);
const getSidebar = createGetSidebar(ctx);
const destroySidebar = createDestroySidebar(ctx);
const healthCheck = createHealthCheck(ctx);
const info = createInfo(ctx);
const getMetrics = createGetMetrics();
const kernel = kernelNamespace;
const metricsHub = metricsHubNamespace;
const circuitBreaker = circuitBreakerNamespace;
const healthMonitor = healthMonitorNamespace;
if (typeof window !== "undefined") {
  setupDevTools(() => _instance);
  if (!isStrict()) {
    setupWindowAPI(() => _instance, _getSidebarEl, createSidebar, destroySidebar);
    window.SidebarKernel = Kernel;
    window.SidebarMetricsHub = MetricsHub;
    window.SidebarCircuitBreaker = CircuitBreaker;
    window.SidebarHealthMonitor = HealthMonitor;
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID2, target: "(window as any).SidebarKernel" });
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID2, target: "(window as any).SidebarMetricsHub" });
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID2, target: "(window as any).SidebarCircuitBreaker" });
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID2, target: "(window as any).SidebarHealthMonitor" });
  }
}
var entry_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  CAPABILITIES: CAPABILITIES2,
  createSidebar,
  getSidebar() {
    return _instance;
  },
  destroySidebar,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts,
  kernel,
  metricsHub,
  circuitBreaker,
  healthMonitor
};
export {
  CAPABILITIES,
  VERSION as CORE_VERSION,
  LIFECYCLE_STATES,
  MODULE_ID,
  SIDEBAR_EVENTS,
  Sidebar,
  default2 as SidebarRegistry,
  VERSION2 as VERSION,
  circuitBreaker,
  createSidebar,
  entry_default as default,
  destroySidebar,
  getMetrics,
  getPorts,
  getSidebar,
  healthCheck,
  healthMonitor,
  info,
  injectPorts,
  kernel,
  metricsHub
};
