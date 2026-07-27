import orchestratorStore from "../state/store.js";
import orchestratorBus from "../bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS, EXTERNAL_EVENTS } from "../bus/events-map.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { ORCHESTRATOR_EVENTS as ORCHESTRATOR_EVENTS_CATALOG } from "/core/runtime/events/catalog/orchestrator.events.js";
import moduleRegistry from "./registry.js";
import moduleLifecycle from "./lifecycle.js";
import orchestratorScheduler from "./scheduler.js";
import { getPresetById } from "./presets.js";
import healthMonitor from "../health/health-monitor.js";
import degradeManager from "../health/degrade-manager.js";
import metricsAdapter from "../health/metrics-adapter.js";
import apiGateway from "../api/api-gateway.js";
import orchestratorTelemetry from "../telemetry/tracker.js";
import { mapPresetToFinalPanels } from "../utils/layout-mapper.js";
import logger from "../utils/logger.js";
import { getSnapshot, getActivePanels } from "../state/selectors.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "core-orchestrator";
class CoreOrchestrator {
  constructor() {
    this.initialized = false;
    this.destroyed = false;
    this.config = null;
    this.externalSubscriptions = [];
    this.initTimestamp = null;
  }
  getVersion() {
    return VERSION;
  }
  isInitialized() {
    return this.initialized && !this.destroyed;
  }
  healthCheck() {
    const issues = [];
    if (!this.initialized) issues.push("Not initialized");
    if (this.destroyed) issues.push("Is destroyed");
    const storeStatus = orchestratorStore.get("status");
    if (storeStatus === "ERROR") issues.push("Store in ERROR state");
    const errorCount = orchestratorStore.get("errorCount");
    if (errorCount > 5) issues.push(`High error count: ${errorCount}`);
    if (degradeManager.isDegraded()) issues.push(`Degraded mode: level ${degradeManager.getDegradeLevel()}`);
    return { healthy: issues.length === 0, version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, status: storeStatus, errorCount, degradeLevel: degradeManager.getDegradeLevel(), issues: issues.length > 0 ? issues : null, timestamp: Date.now() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, config: this.config, healthCheck: this.healthCheck(), snapshot: this.getSnapshot(), registry: this.getRegistry(), health: this.getHealthStatus(), scheduler: this.getSchedulerStats(), uptime: this.initTimestamp ? Date.now() - this.initTimestamp : 0, timestamp: Date.now() };
  }
  reset() {
    logger.info("Core Orchestrator reset() called");
    orchestratorStore.reset();
    moduleRegistry.clear();
    this.destroyed = false;
    return true;
  }
  async init(config = {}) {
    if (this.initialized) {
      logger.warn("Orchestrator j\xE1 inicializado");
      return this;
    }
    logger.info("Inicializando Core Orchestrator...");
    orchestratorStore.setStatus("INITIALIZING");
    this.config = { defaultPreset: config.defaultPreset || "default", healthCheckInterval: config.healthCheckInterval || 3e4, maxRetries: config.maxRetries || 3, circuitBreakerThreshold: config.circuitBreakerThreshold || 5, autoRecovery: config.autoRecovery !== false, telemetryEnabled: config.telemetryEnabled !== false };
    orchestratorBus.init();
    orchestratorTelemetry.init({ namespace: "orchestrator" });
    orchestratorScheduler.init({ mode: "ACTIVE" });
    healthMonitor.init({ interval: this.config.healthCheckInterval });
    degradeManager.init({ autoRecovery: this.config.autoRecovery });
    metricsAdapter.init();
    this._setupExternalListeners();
    orchestratorStore.setStatus("READY");
    this.initialized = true;
    this.destroyed = false;
    this.initTimestamp = Date.now();
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.INIT, { version: VERSION, moduleId: MODULE_ID, config: this.config, timestamp: Date.now() });
    orchestratorTelemetry.trackLifecycle("init", { config: this.config });
    logger.info(`Core Orchestrator inicializado (${VERSION})`);
    return this;
  }
  _setupExternalListeners() {
    const routeHandler = (data) => {
      logger.debug("Router route changed", data);
      if (data.route?.defaultHash) orchestratorTelemetry.track(ROUTER_EVENTS.CHANGED, { source: "external", ...data });
    };
    orchestratorBus.on(EXTERNAL_EVENTS.ROUTER_ROUTE_CHANGED, routeHandler);
    this.externalSubscriptions.push(() => orchestratorBus.off(EXTERNAL_EVENTS.ROUTER_ROUTE_CHANGED, routeHandler));
    const authHandler = (data) => {
      logger.info("Auth success received", data);
      orchestratorTelemetry.track("orchestrator:external:auth-success", data);
    };
    orchestratorBus.on(EXTERNAL_EVENTS.AUTH_LOGIN_SUCCESS, authHandler);
    this.externalSubscriptions.push(() => orchestratorBus.off(EXTERNAL_EVENTS.AUTH_LOGIN_SUCCESS, authHandler));
    logger.debug("External listeners configurados");
  }
  registerModule(moduleConfig) {
    const moduleId = moduleRegistry.register(moduleConfig);
    orchestratorTelemetry.track(ORCHESTRATOR_EVENTS_CATALOG.MODULE_REGISTERED, { moduleId });
    return moduleId;
  }
  unregisterModule(moduleId) {
    const result = moduleRegistry.unregister(moduleId);
    if (result) orchestratorTelemetry.track(ORCHESTRATOR_EVENTS_CATALOG.MODULE_UNREGISTERED, { moduleId });
    return result;
  }
  applyPreset(presetId, context = {}) {
    const preset = getPresetById(presetId);
    if (!preset) {
      logger.error(`Preset n\xE3o encontrado: ${presetId}`);
      orchestratorBus.emit(ORCHESTRATOR_EVENTS.PRESET_FAILED, { presetId, error: "Preset not found" });
      return null;
    }
    logger.info(`Aplicando preset: ${presetId}`, { context });
    const result = mapPresetToFinalPanels(presetId, context);
    if (result.error) {
      logger.error(`Erro ao mapear preset: ${result.error}`);
      orchestratorBus.emit(ORCHESTRATOR_EVENTS.PRESET_FAILED, { presetId, error: result.error });
      return null;
    }
    orchestratorStore.setCurrentPreset(presetId);
    orchestratorStore.setActivePanels(result.panels);
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.PRESET_APPLIED, { presetId, layoutMode: result.layoutMode, panelCount: result.panels.length, moduleId: MODULE_ID });
    orchestratorTelemetry.trackPresetChange(presetId, context);
    orchestratorTelemetry.trackLayoutChange(result.panels, result.layoutMode);
    logger.info(`Preset ${presetId} aplicado: ${result.panels.length} pain\xE9is`);
    return result;
  }
  getActivePanels() {
    return getActivePanels();
  }
  getActivePanelIds() {
    return getActivePanels().map((p) => p.panelId || p);
  }
  getLayoutMode() {
    const preset = orchestratorStore.get("currentPreset");
    if (!preset) return "grid-2";
    const presetConfig = getPresetById(preset);
    return presetConfig?.layoutMode || "grid-2";
  }
  getCurrentPreset() {
    return orchestratorStore.get("currentPreset");
  }
  async refreshModule(moduleId, options = {}) {
    logger.info(`Refresh module: ${moduleId}`);
    const module = moduleRegistry.get(moduleId);
    if (!module) {
      logger.warn(`M\xF3dulo n\xE3o encontrado: ${moduleId}`);
      return false;
    }
    try {
      await moduleLifecycle.update(moduleId, { force: true });
      orchestratorTelemetry.track("orchestrator:module:refreshed", { moduleId });
      return true;
    } catch (error) {
      logger.error(`Erro ao refresh ${moduleId}`, { error: error.message });
      orchestratorTelemetry.trackModuleError(moduleId, error);
      return false;
    }
  }
  async refreshAll(options = {}) {
    logger.info("Refresh all modules");
    const panels = this.getActivePanelIds();
    const results = [];
    for (const panelId of panels) {
      const success = await this.refreshModule(panelId, options);
      results.push({ panelId, success });
    }
    orchestratorTelemetry.track("orchestrator:refresh:all", { total: panels.length, success: results.filter((r) => r.success).length });
    return results;
  }
  pauseScheduler() {
    orchestratorScheduler.pause();
    orchestratorTelemetry.trackSchedulerMode("PAUSED");
  }
  resumeScheduler() {
    orchestratorScheduler.resume();
    orchestratorTelemetry.trackSchedulerMode("ACTIVE");
  }
  getState() {
    return orchestratorStore.toJSON();
  }
  getSnapshot() {
    return getSnapshot();
  }
  getRegistry() {
    return moduleRegistry.toJSON();
  }
  getHealthStatus() {
    return healthMonitor.getStats();
  }
  getApiStats() {
    return apiGateway.getStats();
  }
  getTelemetryStats() {
    return orchestratorTelemetry.getStats();
  }
  getSchedulerStats() {
    return orchestratorScheduler.getStats();
  }
  getFullStatus() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, config: this.config, snapshot: this.getSnapshot(), registry: this.getRegistry(), health: this.getHealthStatus(), api: this.getApiStats(), telemetry: this.getTelemetryStats(), scheduler: this.getSchedulerStats(), degrade: degradeManager.getStats(), uptime: this.initTimestamp ? Date.now() - this.initTimestamp : 0 };
  }
  on(event, handler) {
    return orchestratorBus.on(event, handler);
  }
  off(event, handler) {
    orchestratorBus.off(event, handler);
  }
  emit(event, payload) {
    orchestratorBus.emit(event, payload);
  }
  destroy() {
    if (!this.initialized) return;
    logger.info("Destruindo Core Orchestrator...");
    this.externalSubscriptions.forEach((unsub) => unsub());
    this.externalSubscriptions = [];
    orchestratorScheduler.destroy();
    healthMonitor.destroy();
    degradeManager.destroy();
    metricsAdapter.destroy();
    moduleLifecycle.abortAll();
    orchestratorBus.destroy();
    orchestratorTelemetry.destroy();
    orchestratorStore.destroy();
    moduleRegistry.clear();
    this.initialized = false;
    this.destroyed = true;
    this.config = null;
    this.initTimestamp = null;
    logger.info("Core Orchestrator destru\xEDdo");
  }
}
const coreOrchestrator = new CoreOrchestrator();
var orchestrator_default = coreOrchestrator;
export {
  CoreOrchestrator,
  MODULE_ID,
  VERSION,
  coreOrchestrator,
  orchestrator_default as default
};
