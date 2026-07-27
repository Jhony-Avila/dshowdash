import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { PERMISSIONS_EVENTS } from "/core/runtime/events/catalog/permissions.events.js";
import { LAYOUT_EVENTS } from "/core/runtime/events/catalog/layout.events.js";
import coreOrchestrator from "./core/orchestrator.js";
import orchestratorStore from "./state/store.js";
import orchestratorBus from "./bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS } from "./bus/events-map.js";
import { createOrchestratorTemplate } from "./ui/template.js";
import orchestratorControls from "./ui/controls.js";
import orchestratorUIEvents from "./ui/events.js";
import orchestratorTelemetry from "./telemetry/tracker.js";
import logger from "./utils/logger.js";
import * as PermissionsAdapter from "./adapters/permissions-guard-adapter.js";
import * as ConfirmationModal from "./ui/confirmation-modal.js";
import * as AuditEmitter from "./bus/audit-emitter.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  return auth?.isAuthenticated?.() ?? false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let _accessDeniedLogged = false;
let rootElement = null;
let mounted = false;
let destroyed = false;
let styleElement = null;
let mountTimestamp = null;
let _metrics = { mountCount: 0, unmountCount: 0, presetApplyCount: 0, refreshCount: 0, errorCount: 0, lastMountAt: null, lastPresetAt: null };
let _integrationsStatus = { eventBusAvailable: false, globalStateAvailable: false, telemetryAvailable: false, coreInitialized: false, permissionsAvailable: false, layoutManagerAvailable: false };
let _debugMode = false;
let _confirmActions = true;
const _debug = () => {
  if (_debugMode) return true;
  const cfg = _getPort("config");
  return cfg?.app?.debug ?? false;
};
const _log = (level, ...args) => {
  const loggerPort = _getPort("logger");
  if (!loggerPort) return;
  if (!_debug() && level === "debug") return;
  const fn = loggerPort[level] || loggerPort.info;
  if (typeof fn === "function") fn.apply(loggerPort, [`[${MODULE_ID}]`, ...args]);
};
const _getLayoutManager = () => _getPort("layoutManager");
const _updateIntegrationsStatus = () => {
  _initPorts();
  _integrationsStatus.eventBusAvailable = !!_getPort("eventBus");
  _integrationsStatus.globalStateAvailable = !!_getPort("globalState");
  _integrationsStatus.telemetryAvailable = !!_getPort("telemetry");
  _integrationsStatus.coreInitialized = coreOrchestrator?.initialized ?? false;
  _integrationsStatus.permissionsAvailable = PermissionsAdapter.isAvailable();
  _integrationsStatus.layoutManagerAvailable = !!_getLayoutManager();
};
const getVersion = () => VERSION;
const isInitialized = () => mounted && !destroyed;
const setDebug = (enabled) => {
  _debugMode = !!enabled;
  logger.setDebug?.(_debugMode);
};
const setConfirmActions = (enabled) => {
  _confirmActions = !!enabled;
};
const healthCheck = () => {
  _updateIntegrationsStatus();
  const storeStatus = orchestratorStore.get("status");
  const permCheck = PermissionsAdapter.canAccessPanel();
  const checks = { mounted, notDestroyed: !destroyed, coreInitialized: _integrationsStatus.coreInitialized, storeOk: storeStatus !== "ERROR", eventBusAvailable: _integrationsStatus.eventBusAvailable, globalStateAvailable: _integrationsStatus.globalStateAvailable, telemetryAvailable: _integrationsStatus.telemetryAvailable, permissionsAvailable: _integrationsStatus.permissionsAvailable, layoutManagerAvailable: _integrationsStatus.layoutManagerAvailable, lowErrorRate: _metrics.errorCount < 10 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (passed < total * 0.5) status = "UNHEALTHY";
  else if (passed < total) status = "DEGRADED";
  const issues = [];
  if (!mounted) issues.push("Panel not mounted");
  if (destroyed) issues.push("Panel is destroyed");
  if (!_integrationsStatus.coreInitialized) issues.push("Core orchestrator not initialized");
  if (!_integrationsStatus.eventBusAvailable) issues.push("EventBus not available");
  if (!_integrationsStatus.globalStateAvailable) issues.push("GlobalState not available");
  if (!_integrationsStatus.layoutManagerAvailable) issues.push("LayoutManager not available");
  if (storeStatus === "ERROR") issues.push("Store in ERROR state");
  if (!permCheck.allowed) issues.push(`Access denied: ${permCheck.reason}`);
  return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, integrations: { ..._integrationsStatus }, metrics: { ..._metrics }, permissions: permCheck, issues: issues.length > 0 ? issues : null, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p22Compliant: true, isDocumentVisible: _isDocumentVisible(), timestamp: Date.now() };
};
const info = () => {
  _updateIntegrationsStatus();
  const cfg = _getPort("config");
  const env = cfg?.app?.environment ?? "unknown";
  return { moduleId: MODULE_ID, version: VERSION, status: getStatus(), healthCheck: healthCheck(), metrics: { ..._metrics }, integrations: { ..._integrationsStatus }, permissions: PermissionsAdapter.healthCheck(), config: { debug: _debug(), confirmActions: _confirmActions, environment: env }, core: coreOrchestrator?.initialized ? coreOrchestrator.getFullStatus() : null, store: orchestratorStore.toJSON(), bus: orchestratorBus.getStats?.() ?? null, telemetry: orchestratorTelemetry.getStats(), uptime: mountTimestamp ? Date.now() - mountTimestamp : 0, portsInitialized: Ports.isInitialized(), p22Compliant: true, timestamp: Date.now() };
};
const reset = () => {
  _log("info", "reset()");
  orchestratorStore.reset();
  destroyed = false;
  _accessDeniedLogged = false;
  _metrics = { mountCount: 0, unmountCount: 0, presetApplyCount: 0, refreshCount: 0, errorCount: 0, lastMountAt: null, lastPresetAt: null };
  const pa = PermissionsAdapter;
  if (pa.clearCache) pa.clearCache();
  return true;
};
const getMetrics = () => ({ ..._metrics });
const getIntegrationsStatus = () => ({ ..._integrationsStatus });
const resetMetrics = () => {
  _metrics = { mountCount: 0, unmountCount: 0, presetApplyCount: 0, refreshCount: 0, errorCount: 0, lastMountAt: null, lastPresetAt: null };
};
const loadStyles = () => {
  if (styleElement) return Promise.resolve();
  return fetch("/components/panels/panel-orchestrator/styles/index.css").then((response) => {
    if (!response.ok) throw new Error("Styles not found");
    return response.text();
  }).then((css) => {
    styleElement = document.createElement("style");
    styleElement.id = "panel-orchestrator-styles";
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    _log("info", "Styles loaded");
  }).catch((error) => {
    _log("warn", "Failed to load styles", error.message);
  });
};
const mount = (container, props = {}, scope = {}) => {
  if (!_isAuthenticated()) {
    return { success: false, moduleId: MODULE_ID, error: "not-authenticated" };
  }
  _initPorts();
  if (mounted) {
    _log("warn", "Panel Orchestrator already mounted");
    return Promise.resolve(false);
  }
  if (!container) return Promise.reject(new Error("[Panel Orchestrator] Container required"));
  const accessCheck = PermissionsAdapter.canAccessPanel();
  if (!accessCheck.allowed) {
    if (!_accessDeniedLogged) {
      _log("warn", "Access denied:", accessCheck.reason);
      orchestratorTelemetry.track(PERMISSIONS_EVENTS.ACCESS_DENIED, { reason: accessCheck.reason, userId: PermissionsAdapter.getUserContext().userId, panelId: MODULE_ID });
      AuditEmitter.emitAccessDenied(accessCheck.reason);
      _accessDeniedLogged = true;
    }
    return Promise.reject(new Error(`[Panel Orchestrator] Access denied: ${accessCheck.reason}`));
  }
  _confirmActions = props.confirmActions !== false;
  _log("info", "Mounting Panel Orchestrator...");
  const startTime = Date.now();
  _metrics.mountCount++;
  return loadStyles().then(() => coreOrchestrator.init({ defaultPreset: props.defaultPreset || "default", healthCheckInterval: props.healthCheckInterval || 3e4, telemetryEnabled: props.telemetryEnabled !== false })).then(() => {
    const initialState = { preset: coreOrchestrator.getCurrentPreset() || "default", status: orchestratorStore.get("status"), panelCount: coreOrchestrator.getActivePanels().length };
    container.innerHTML = createOrchestratorTemplate(initialState);
    rootElement = container.querySelector(".orchestrator-panel");
    if (!rootElement) throw new Error("Template not rendered correctly");
    orchestratorControls.init(rootElement);
    orchestratorUIEvents.init(rootElement);
    _setupEventHandlers();
    _setupStoreSubscription();
    _setupLayoutManagerSync();
    if (props.applyDefaultPreset !== false) coreOrchestrator.applyPreset(props.defaultPreset || "default", { permissions: scope.permissions || [], featureFlags: scope.featureFlags || [] });
    orchestratorStore.setStatus("RUNNING");
    orchestratorControls.updateStatus("RUNNING");
    mounted = true;
    destroyed = false;
    _accessDeniedLogged = false;
    mountTimestamp = Date.now();
    _metrics.lastMountAt = mountTimestamp;
    const mountTime = Date.now() - startTime;
    _updateIntegrationsStatus();
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.READY, { version: VERSION, moduleId: MODULE_ID, mountTime, timestamp: Date.now() });
    orchestratorTelemetry.trackModuleMount(MODULE_ID, mountTime);
    AuditEmitter.emitMount(mountTime);
    scope.telemetry?.trackPanelLoad?.(MODULE_ID, { ttfbMs: mountTime, renderMs: mountTime });
    _exposeGlobalAPI();
    _log("info", `Mounted (${mountTime}ms) - ${VERSION}`);
    return true;
  }).catch((error) => {
    _metrics.errorCount++;
    _log("error", "Error mounting Panel Orchestrator", error.message);
    orchestratorTelemetry.trackModuleError(MODULE_ID, error);
    AuditEmitter.emitError(error, { phase: "mount" });
    throw error;
  });
};
const _setupEventHandlers = () => {
  orchestratorUIEvents.onApplyPreset((presetId) => {
    if (!PermissionsAdapter.canApplyPreset(presetId)) {
      _log("warn", "Permission denied for applyPreset:", presetId);
      orchestratorTelemetry.track("panel-orchestrator:preset:denied", { presetId });
      AuditEmitter.emitPresetDenied(presetId, "Permission denied");
      return Promise.resolve();
    }
    const cfg = _getPort("config");
    const env = cfg?.app?.environment ?? "production";
    const confirmPromise = _confirmActions ? ConfirmationModal.confirmApplyPreset(presetId, { environment: env }) : Promise.resolve(true);
    return confirmPromise.then((confirmed) => {
      if (!confirmed) {
        _log("info", "Apply preset cancelled by user");
        return;
      }
      _log("info", `UI: Apply preset ${presetId}`);
      _metrics.presetApplyCount++;
      _metrics.lastPresetAt = Date.now();
      const result = coreOrchestrator.applyPreset(presetId);
      if (result) {
        orchestratorControls.updatePanelList(result.panels);
        orchestratorControls.updatePresetSelector(presetId);
        AuditEmitter.emitPresetApplied(presetId, { panelCount: result.panels.length });
        _syncLayoutManager(result.layoutMode);
      }
    });
  }).onRefreshAll(() => {
    const confirmPromise = _confirmActions ? ConfirmationModal.confirmRefreshAll() : Promise.resolve(true);
    return confirmPromise.then((confirmed) => {
      if (!confirmed) {
        _log("info", "Refresh all cancelled by user");
        return;
      }
      _log("info", "UI: Refresh all");
      _metrics.refreshCount++;
      const panels = coreOrchestrator.getActivePanels();
      coreOrchestrator.refreshAll();
      AuditEmitter.emitRefreshAll(panels.length);
    });
  }).onResetLayout(() => {
    const confirmPromise = _confirmActions ? ConfirmationModal.confirmResetLayout() : Promise.resolve(true);
    return confirmPromise.then((confirmed) => {
      if (!confirmed) {
        _log("info", "Reset layout cancelled by user");
        return;
      }
      _log("info", "UI: Reset layout");
      coreOrchestrator.applyPreset("default");
      orchestratorControls.updatePresetSelector("default");
      AuditEmitter.emitLayoutReset();
      _syncLayoutManager("grid-2");
    });
  }).onTogglePause(() => {
    const scheduler = coreOrchestrator.getSchedulerStats();
    const confirmPromise = _confirmActions ? ConfirmationModal.confirmPause(scheduler.paused) : Promise.resolve(true);
    return confirmPromise.then((confirmed) => {
      if (!confirmed) {
        _log("info", "Toggle pause cancelled by user");
        return;
      }
      _log("info", "UI: Toggle pause");
      if (scheduler.paused) {
        coreOrchestrator.resumeScheduler();
        AuditEmitter.emitSchedulerToggled("ACTIVE");
      } else {
        coreOrchestrator.pauseScheduler();
        AuditEmitter.emitSchedulerToggled("PAUSED");
      }
    });
  }).onTogglePanel((panelId) => {
    _log("info", `UI: Toggle panel ${panelId}`);
    AuditEmitter.emitPanelToggled(panelId, true);
  });
};
const _setupStoreSubscription = () => {
  orchestratorStore.subscribe((change) => {
    if (change.key === "activePanels") orchestratorControls.updatePanelList(change.newValue);
    if (change.key === "status") orchestratorControls.updateStatus(change.newValue);
    if (change.key === "currentPreset") orchestratorControls.updatePresetSelector(change.newValue);
  });
};
const _setupLayoutManagerSync = () => {
  const lm = _getLayoutManager();
  if (!lm) {
    _log("warn", "LayoutManager not available for sync");
    return;
  }
  lm.on?.(LAYOUT_EVENTS.STATE_CHANGED, (data) => {
    _log("info", "LayoutManager layout changed", data);
    orchestratorTelemetry.track("panel-orchestrator:layout:external-change", data);
  });
};
const _syncLayoutManager = (layoutMode) => {
  const lm = _getLayoutManager();
  if (!lm) return;
  if (lm.setMode) {
    lm.setMode(layoutMode);
    _log("info", "LayoutManager synced to mode:", layoutMode);
  }
};
const _exposeGlobalAPI = () => {
  if (typeof window === "undefined" || isStrict()) return;
  window.Orchestrator = { getVersion, healthCheck, info, isInitialized, reset, getMetrics, getIntegrationsStatus, resetMetrics, setDebug, setConfirmActions, applyPreset: (id, ctx) => {
    if (!PermissionsAdapter.canApplyPreset) {
      _log("warn", "Permission denied");
      return null;
    }
    _metrics.presetApplyCount++;
    _metrics.lastPresetAt = Date.now();
    const result = coreOrchestrator.applyPreset(id, ctx);
    if (result) AuditEmitter.emitPresetApplied(id, ctx);
    return result;
  }, getActivePanels: () => coreOrchestrator.getActivePanels(), getLayoutMode: () => coreOrchestrator.getLayoutMode(), getCurrentPreset: () => coreOrchestrator.getCurrentPreset(), refreshAll: () => {
    _metrics.refreshCount++;
    AuditEmitter.emitRefreshAll(coreOrchestrator.getActivePanels().length);
    return coreOrchestrator.refreshAll();
  }, getState: () => coreOrchestrator.getState(), getSnapshot: () => coreOrchestrator.getSnapshot(), getFullStatus: () => coreOrchestrator.getFullStatus(), on: (evt, handler) => coreOrchestrator.on(evt, handler), off: (evt, handler) => coreOrchestrator.off(evt, handler), registerModule: (config) => coreOrchestrator.registerModule(config), version: VERSION, moduleId: MODULE_ID };
  window.__dev = window.__dev || {};
  window.__dev.orchestrator = { getVersion, getStatus, healthCheck, info, isInitialized, reset, getMetrics, getIntegrationsStatus, resetMetrics, setDebug, setConfirmActions, core: coreOrchestrator, store: orchestratorStore, bus: orchestratorBus, telemetry: orchestratorTelemetry, permissions: PermissionsAdapter, confirmModal: ConfirmationModal, auditEmitter: AuditEmitter };
  _log("info", `Global API exposed: (window as any).Orchestrator (${VERSION})`);
};
const unmount = () => {
  if (!mounted) {
    _log("warn", "Panel Orchestrator not mounted");
    return;
  }
  _log("info", "Unmounting Panel Orchestrator...");
  _metrics.unmountCount++;
  AuditEmitter.emitUnmount();
  orchestratorUIEvents.destroy();
  orchestratorControls.destroy();
  coreOrchestrator.destroy();
  if (rootElement) {
    rootElement.innerHTML = "";
    rootElement = null;
  }
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
  if (typeof window !== "undefined") {
    delete window.Orchestrator;
    if (window.__dev) delete window.__dev.orchestrator;
  }
  mounted = false;
  destroyed = true;
  _accessDeniedLogged = false;
  mountTimestamp = null;
  _log("info", "Unmounted");
};
const shutdown = () => unmount();
const destroy = () => unmount();
const getStatus = () => ({ name: MODULE_ID, version: VERSION, mounted, destroyed, initialized: isInitialized(), uptime: mountTimestamp ? Date.now() - mountTimestamp : 0, metrics: { ..._metrics }, integrations: { ..._integrationsStatus }, permissions: PermissionsAdapter.healthCheck(), orchestrator: mounted ? coreOrchestrator.getFullStatus() : null, portsInitialized: Ports.isInitialized(), p22Compliant: true });
const setDebugMode = (enabled) => setDebug(enabled);
var panel_orchestrator_default = { mount, unmount, shutdown, destroy, getStatus, getVersion, healthCheck, info, isInitialized, reset, getMetrics, getIntegrationsStatus, resetMetrics, setDebug, setConfirmActions, injectPorts, getPorts, version: VERSION, moduleId: MODULE_ID, name: MODULE_ID };
export {
  AuditEmitter,
  ConfirmationModal,
  MODULE_ID,
  PermissionsAdapter,
  VERSION,
  coreOrchestrator,
  panel_orchestrator_default as default,
  destroy,
  getIntegrationsStatus,
  getMetrics,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  isInitialized,
  mount,
  orchestratorBus,
  orchestratorStore,
  reset,
  resetMetrics,
  setConfirmActions,
  setDebug,
  setDebugMode,
  shutdown,
  unmount
};
