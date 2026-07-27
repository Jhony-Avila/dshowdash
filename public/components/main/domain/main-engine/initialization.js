import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { STATES } from "../state-machine.js";
import { createNavigationController } from "../navigation-controller/index.js";
import { createPanelLifecycleController } from "../panel-lifecycle-controller.js";
import { createErrorSupervisor } from "../error-supervisor.js";
import { createManifestController } from "../manifest-controller.js";
import { createLayoutController } from "../layout-controller.js";
import { createCanvasControllerEnterprise } from "../canvas-controller-enterprise.js";
import { createTimelineController } from "../timeline-controller.js";
import { createOrchestratorController } from "../orchestrator-controller.js";
import { createGlobalStateControllerV2 } from "../globalstate-controller-v2.js";
import { createMultiContainerOrchestrator } from "../multi-container-orchestrator.js";
import { createObservabilityModule } from "../observability/index.js";
import { createAuditModule } from "../audit/index.js";
import { createPersistenceAdapter } from "../persistence/index.js";
import { VERSION } from "./constants.js";
import { boot as bootContainerMain, getBootstrap } from "../../ui/container-main/index.js";
import { initMainKernel } from "./kernel-integration.js";
const MODULE_ID = "main-engine-initialization";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return console;
}
function _log(level, ...args) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](...args);
}
function createSubsystems(engine) {
  const ports = engine._ports;
  const adapters = engine._adapters;
  const events = engine._events;
  engine._errorSupervisor = createErrorSupervisor(ports.telemetry);
  engine._manifestController = createManifestController({ ports: { ...ports, events } });
  engine._layoutController = createLayoutController({ ports: { ...ports, events } });
  engine._canvasController = createCanvasControllerEnterprise({ ports: { ...ports, events }, adapters });
  engine._timelineController = createTimelineController({ ports: { ...ports, events } });
  engine._globalStateV2 = createGlobalStateControllerV2({ ports: { ...ports, events } });
  engine._panelLifecycle = createPanelLifecycleController(ports.panel, adapters.dom, ports.container, ports.telemetry || {});
  engine._navigationController = createNavigationController(
    engine._panelLifecycle,
    engine._stateMachine,
    ports.telemetry,
    engine._manifestController
    // CRITICAL: This was missing!
  );
  engine._orchestrator = createOrchestratorController({
    ports: { ...ports, events },
    manifestController: engine._manifestController,
    layoutController: engine._layoutController,
    errorSupervisor: engine._errorSupervisor
  });
  engine._multiContainerOrchestrator = createMultiContainerOrchestrator({ ports: { ...ports, events } });
  engine._auditModule = createAuditModule({ ports: { events, telemetry: ports?.telemetry } });
  engine._persistenceAdapter = createPersistenceAdapter({ ports: { events, telemetry: ports?.telemetry } });
  engine._observabilityModule = createObservabilityModule({
    ports: { events, telemetry: ports?.telemetry },
    modules: {
      actionHub: null,
      audit: engine._auditModule,
      persistence: engine._persistenceAdapter,
      mainEngine: engine,
      multiContainer: engine._multiContainerOrchestrator
    }
  });
}
async function initializeSubsystems(engine) {
  await engine._manifestController.loadManifest();
  engine._layoutController.syncFromStatePort();
  engine._canvasController?.init?.();
  engine._timelineController?.startRecording?.();
}
function _findSafeContainerElement() {
  const shellMain = document.querySelector('#shell-main-region, [data-region="main"], #main');
  if (!shellMain) {
    _log("warn", "[main-engine] shell-main-region not found - cannot boot container-main safely");
    return null;
  }
  const existingContainer = shellMain.querySelector("#container-main") || shellMain.querySelector(".dsd-container") || shellMain.querySelector('[data-container-main="true"]');
  if (existingContainer) {
    return existingContainer;
  }
  return shellMain;
}
async function bootContainerMainPlatform(engine) {
  const startTime = performance.now();
  const enginePorts = engine._ports;
  try {
    const containerEl = _findSafeContainerElement();
    _log("info", "[main-engine] bootContainerMainPlatform: containerEl =", containerEl?.id || containerEl?.tagName || "null");
    if (!containerEl) {
      _log("warn", "[main-engine] Skipping container-main boot - shell not ready, _findSafeContainerElement() returned null");
      enginePorts.telemetry?.track?.("main:container-main-boot-skipped", { reason: "shell-not-ready" });
      return null;
    }
    const bootstrap = await bootContainerMain(containerEl, {
      autoStart: true,
      enableLazyLoading: true,
      waitForLazyComponents: false,
      // FASE 2
      enablePerformanceMonitor: true,
      enableFallbackSystem: true,
      // FASE 4
      enablePlugins: true,
      enableLifecycleHooks: true,
      enableBootMetrics: true,
      enableEventBusAdapter: true,
      enableStateSnapshots: true,
      enableDebugMode: false,
      enableConfigPersistence: true,
      enableSlotPresets: true,
      // FASE 5 Core
      enableSanitizer: true,
      enableRateLimiter: true,
      enableDevToolsPanel: false,
      enableWorkerManager: true,
      enableConsoleCommands: false,
      enableTelemetryDashboard: false,
      // FASE 5 Extended
      enableRequestQueue: true,
      enableCacheManager: true,
      enableEventRecorder: false,
      // FASE 6 UI/UX Core
      enableNotificationManager: true,
      enableFormValidator: true,
      enableStorageManager: true,
      enableClipboardManager: true,
      enableDragDropManager: true,
      enableModalManager: true,
      // FASE 6 UI/UX Extended
      enableTooltipManager: true,
      enableContextMenuManager: true,
      enableHotkeyManager: true,
      enableScrollManager: true,
      enableFocusManager: true,
      enableUndoManager: true,
      // FASE 6 Advanced
      enableThemeManager: true,
      enableAnimationManager: true,
      enableMediaQueryManager: true,
      enableIntersectionManager: true,
      enableResizeManager: true,
      enableMutationManager: true,
      // FASE 7 Device & Browser APIs
      enablePermissionManager: true,
      enableNetworkManager: true,
      enableGeolocationManager: false,
      enableDeviceManager: true,
      enableBatteryManager: true,
      enableFullscreenManager: true,
      enableVisibilityManager: true,
      enableWakeLockManager: false,
      enableShareManager: true,
      // Callbacks
      onReady: (bs) => {
        enginePorts.telemetry?.track?.("container-main:ready", {
          bootTime: performance.now() - startTime,
          managersActive: bs.info().managersActive
        });
      },
      onError: (error, context) => {
        enginePorts.telemetry?.track?.("container-main:error", { error: error.message, context });
        engine._errorSupervisor?.capture?.(error, { phase: "container-main-boot", context });
      }
    });
    engine._containerMainBootstrap = bootstrap;
    enginePorts.ui = createUIPortFromBootstrap(bootstrap);
    if (typeof window !== "undefined") {
      window.CMBootstrap = bootstrap;
    }
    const bootTime = Math.round(performance.now() - startTime);
    _log("info", "[main-engine] container-main booted successfully", { bootTime });
    const bsTyped = bootstrap;
    enginePorts.telemetry?.track?.("main:container-main-booted", {
      version: bsTyped.info().version,
      state: bsTyped.getState(),
      managersActive: bsTyped.info().managersActive || 0,
      bootTime
    });
    return bootstrap;
  } catch (error) {
    const err = error;
    _log("error", "[main-engine] bootContainerMainPlatform FAILED:", err.message, err.stack);
    enginePorts.telemetry?.track?.("main:container-main-boot-failed", { error: err.message, stack: err.stack });
    engine._errorSupervisor?.capture?.(error, { phase: "container-main-boot" });
    return null;
  }
}
function createUIPortFromBootstrap(bootstrap) {
  if (!bootstrap) return null;
  const bs = bootstrap;
  return {
    // Notifications
    notify: (msg, opts) => bs.notify?.(msg, opts),
    notifySuccess: (msg, opts) => bs.notifySuccess?.(msg, opts),
    notifyError: (msg, opts) => bs.notifyError?.(msg, opts),
    // Modals
    openModal: (config) => bs.openModal?.(config),
    closeModal: (id, result) => bs.closeModal?.(id, result),
    modalAlert: (msg, opts) => bs.modalAlert?.(msg, opts),
    modalConfirm: (msg, opts) => bs.modalConfirm?.(msg, opts),
    // Theme
    setTheme: (theme) => bs.setTheme?.(theme),
    toggleTheme: () => bs.toggleTheme?.(),
    isDarkMode: () => bs.isDarkMode?.() ?? false,
    // Hotkeys
    registerHotkey: (combo, handler, opts) => bs.registerHotkey?.(combo, handler, opts),
    // Storage
    storageGet: (key, opts) => bs.storageGet?.(key, opts),
    storageSet: (key, value, opts) => bs.storageSet?.(key, value, opts),
    // Clipboard
    copyToClipboard: (text, opts) => bs.copyToClipboard?.(text, opts),
    // Scroll
    scrollTo: (target, opts) => bs.scrollTo?.(target, opts),
    scrollToTop: (opts) => bs.scrollToTop?.(),
    // Undo/Redo
    recordAction: (action) => bs.recordAction?.(action),
    undo: () => bs.undo?.(),
    redo: () => bs.redo?.(),
    canUndo: () => bs.canUndo?.() ?? false,
    canRedo: () => bs.canRedo?.() ?? false,
    // Network
    isOnline: () => bs.isOnline?.() ?? navigator.onLine,
    isOffline: () => bs.isOffline?.() ?? !navigator.onLine,
    // Device
    isMobile: () => bs.isMobile?.() ?? false,
    isTouch: () => bs.isTouch?.() ?? false,
    getDeviceType: () => bs.getDeviceType?.(),
    // Fullscreen
    enterFullscreen: (el) => bs.enterFullscreen?.(el),
    exitFullscreen: () => bs.exitFullscreen?.(),
    toggleFullscreen: (el) => bs.toggleFullscreen?.(el),
    isFullscreen: () => bs.isFullscreen?.() ?? false,
    // Visibility
    isPageVisible: () => bs.isPageVisible?.() ?? true,
    // Animation
    animate: (el, props, opts) => bs.animate?.(el, props, opts),
    fadeIn: (el, duration) => bs.fadeIn?.(el, duration),
    fadeOut: (el, duration) => bs.fadeOut?.(el, duration),
    // Intersection
    lazyLoad: (selector, opts) => bs.lazyLoad?.(selector, opts),
    // Cache
    cacheGet: (key, defaultValue) => bs.cacheGet?.(key, defaultValue),
    cacheSet: (key, value, opts) => bs.cacheSet?.(key, value, opts),
    // Rate Limiter
    checkRateLimit: (key) => bs.checkRateLimit?.(key),
    // Sanitizer
    sanitize: (type, input) => bs.sanitize?.(type, input),
    escapeHtml: (input) => bs.escapeHtml?.(input),
    // Bootstrap reference
    getBootstrap: () => bs,
    // Health
    healthCheck: () => bs.healthCheck?.(),
    info: () => bs.info?.()
  };
}
async function tryRestoreSnapshot(engine) {
  try {
    const restored = await engine._multiContainerOrchestrator?.restore?.();
    if (restored) {
      engine._ports.telemetry?.track?.("main:snapshot-restored-on-init", {});
    }
  } catch (e) {
    engine._ports.telemetry?.track?.("main:snapshot-restore-failed", { error: e.message });
  }
}
async function performInit(engine) {
  if (engine._initialized) return engine;
  if (engine._destroyed) throw new Error("Cannot init destroyed engine - create new instance");
  engine._initTimestamp = Date.now();
  const sm = engine._stateMachine;
  sm.transition(STATES.INITIALIZING);
  try {
    createSubsystems(engine);
    await initializeSubsystems(engine);
    await initMainKernel(engine);
    await bootContainerMainPlatform(engine);
    await tryRestoreSnapshot(engine);
    engine._initialized = true;
    sm.transition(STATES.READY);
    const initPorts = engine._ports;
    initPorts.telemetry?.track?.("main:init", {
      version: VERSION,
      containerMainIntegrated: !!engine._containerMainBootstrap,
      hasManifestController: !!engine._manifestController,
      hasNavigationController: !!engine._navigationController
    });
    engine._emit(MAIN_EVENTS.READY, {
      version: VERSION,
      containerMainIntegrated: !!engine._containerMainBootstrap
    });
    return engine;
  } catch (error) {
    sm.transition(STATES.ERROR);
    engine._errorSupervisor?.capture?.(error, { phase: "init" });
    throw error;
  }
}
function healthCheck() {
  const bootstrap = getBootstrap();
  return {
    status: _portsInitialized ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    strictMode: isStrict(),
    containerMainIntegrated: !!bootstrap,
    containerMainState: bootstrap?.getState?.() || "NOT_INITIALIZED"
  };
}
var initialization_default = {
  createSubsystems,
  initializeSubsystems,
  bootContainerMainPlatform,
  tryRestoreSnapshot,
  performInit,
  healthCheck,
  MODULE_ID
};
export {
  MODULE_ID,
  bootContainerMainPlatform,
  createSubsystems,
  initialization_default as default,
  getPorts,
  healthCheck,
  initializeSubsystems,
  injectPorts,
  performInit,
  tryRestoreSnapshot
};
