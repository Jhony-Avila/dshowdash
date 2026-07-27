import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { log, _metrics, updateIntegrationsStatus } from "./logger.js";
import { getErrorMessage, ensureUARPSRegion } from "./helpers.js";
import { headerTemplate } from "../ui/template.js";
import { EnvironmentDetector } from "./environment.js";
import { FallbackManager } from "./fallback-manager.js";
import { RouterIntegration } from "./router-integration.js";
import { ComponentsLoader } from "./components-loader.js";
const VERSION = "8.1.0-ES6";
const MODULE_ID = "header/core/mount-handler";
const _localMetrics = { mountAttempts: 0, mountSuccesses: 0, mountFailures: 0, cleanupCalls: 0, avgMountTimeMs: 0, lastMountAt: null, lastErrorAt: null };
function executeMount(header, container) {
  const mountStart = Date.now();
  _localMetrics.mountAttempts++;
  _metrics.mountCount++;
  _metrics.lastMountAt = Date.now();
  updateIntegrationsStatus();
  return Promise.resolve().then(() => {
    container.innerHTML = headerTemplate;
    ensureUARPSRegion(container);
    header.initCore();
    return header.lifecycle.mount();
  }).then(() => {
    header._emitGlobalEvent(COMPONENT_EVENTS.MOUNTED, {
      componentName: "header",
      version: header.version,
      instanceId: header.instanceId,
      sessionId: header.sessionId,
      timestamp: Date.now()
    });
    return header.initializer.loadConfig();
  }).then(() => {
    header.initializer.cacheElements(container);
    header.initializer.validateStructure();
    if (header.reducedMode) log("warn", "Header operando em MODO REDUZIDO");
    header.fallbackManager = new FallbackManager(header);
    header.routerIntegration = new RouterIntegration(header);
    header.managers.initAPI();
    header.managers.initManagers();
    header.ui.initUI();
    header.ui.initRefresh();
    header.ui.initAccessibility();
    header.componentsLoader = new ComponentsLoader(header);
    return header.componentsLoader.loadAll();
  }).then(() => {
    header.ui.mountAll();
    header.events.setupVisibilityChange();
    header.events.setupConnectivityHandlers();
    header.events.setupRefreshEventHandlers();
    header.events.setupAuthEventHandlers();
    header.events.setupIntentsHandlers();
    header.events.setupRuntimeContextHandlers();
    header.routerIntegration.setup();
    header._setupGlobalStateIntegration();
    const environmentData = EnvironmentDetector.detect();
    header.store.setEnvironment(environmentData.environment);
    header.envChip.update(environmentData.environment);
    return header.lifecycle.ready();
  }).then(() => {
    const loadTimeMs = Date.now() - mountStart;
    _localMetrics.mountSuccesses++;
    _localMetrics.lastMountAt = Date.now();
    _localMetrics.avgMountTimeMs = (_localMetrics.avgMountTimeMs * (_localMetrics.mountSuccesses - 1) + loadTimeMs) / _localMetrics.mountSuccesses;
    _metrics.lastActivity = Date.now();
    header.telemetry.trackBoot(header.version, navigator.userAgent, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language);
    header._emitGlobalEvent(COMPONENT_EVENTS.READY, {
      componentName: "header",
      loadTimeMs,
      version: header.version,
      instanceId: header.instanceId,
      sessionId: header.sessionId,
      features: header.features,
      reducedMode: header.reducedMode,
      p0Compliant: true,
      p3RuntimeContext: true,
      timestamp: Date.now()
    });
    log("info", `Header v${header.version} montado (${loadTimeMs}ms)${header.reducedMode ? " [REDUZIDO]" : ""}`);
    header.api.exposeGlobalAPI();
    header.events.setupComponentsReadyListener();
    header.api.initPerformanceObserver();
    header.isMounted = true;
    header.isMounting = false;
    header.circuitBreaker.reset();
    return header;
  });
}
function handleMountError(header, error) {
  header.isMounting = false;
  _localMetrics.mountFailures++;
  _localMetrics.lastErrorAt = Date.now();
  _metrics.errorCount++;
  const errorMsg = getErrorMessage(error);
  const errorStack = error && error.stack ? error.stack.substring(0, 300) : "Stack indisponivel";
  const isOpen = header.circuitBreaker.recordFailure();
  if (isOpen) log("error", "Circuit breaker ABERTO - multiplas falhas de mount");
  log("error", `Erro ao montar: ${errorMsg}`);
  log("error", "Stack:", errorStack);
  const lifecyclePromise = header.lifecycle ? header.lifecycle.error(error) : Promise.resolve();
  return lifecyclePromise.then(() => {
    header._emitGlobalEvent(COMPONENT_EVENTS.ERROR, {
      componentName: "header",
      error: errorMsg,
      stack: errorStack,
      phase: "mount",
      instanceId: header.instanceId,
      timestamp: Date.now()
    });
    cleanupPartialMount(header);
    throw error;
  });
}
function cleanupPartialMount(header) {
  _localMetrics.cleanupCalls++;
  try {
    if (header.abortControllers.global) {
      header.abortControllers.global.abort();
      header.abortControllers.global = null;
    }
    if (header.timers) {
      header.timers.destroy();
      header.timers = null;
    }
    if (header._cleanupLocalListeners) {
      header._cleanupLocalListeners();
    }
    header.eventBus = null;
    if (header.lifecycle) {
      header.lifecycle.reset();
      header.lifecycle = null;
    }
    if (header.events && header.events.cleanup) header.events.cleanup();
  } catch (e) {
    log("error", `Erro no cleanup parcial: ${getErrorMessage(e)}`);
  }
}
function getMetrics() {
  return Object.assign({}, _localMetrics);
}
function resetMetrics() {
  _localMetrics.mountAttempts = 0;
  _localMetrics.mountSuccesses = 0;
  _localMetrics.mountFailures = 0;
  _localMetrics.cleanupCalls = 0;
  _localMetrics.avgMountTimeMs = 0;
  _localMetrics.lastMountAt = null;
  _localMetrics.lastErrorAt = null;
}
function healthCheck() {
  const successRate = _localMetrics.mountAttempts > 0 ? _localMetrics.mountSuccesses / _localMetrics.mountAttempts : 1;
  const checks = { executeMountAvailable: typeof executeMount === "function", handleMountErrorAvailable: typeof handleMountError === "function", cleanupAvailable: typeof cleanupPartialMount === "function", goodSuccessRate: successRate >= 0.8 || _localMetrics.mountAttempts === 0, noRecentErrors: !_localMetrics.lastErrorAt || Date.now() - _localMetrics.lastErrorAt > 6e4 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, successRate, avgMountTimeMs: Math.round(_localMetrics.avgMountTimeMs), version: VERSION, moduleId: MODULE_ID, p3RuntimeContext: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, p3RuntimeContext: true, metrics: getMetrics(), healthCheck: healthCheck() };
}
var mount_handler_default = { VERSION, MODULE_ID, executeMount, handleMountError, cleanupPartialMount, getMetrics, resetMetrics, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  cleanupPartialMount,
  mount_handler_default as default,
  executeMount,
  getMetrics,
  handleMountError,
  healthCheck,
  info,
  resetMetrics
};
