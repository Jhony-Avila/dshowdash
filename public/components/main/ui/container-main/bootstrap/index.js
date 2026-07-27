import { createAdaptiveKernel } from "../adaptive-kernel.js";
import { initComponents, initComponentsAsync } from "../init-components.js";
import { getEventBus } from "../core/event-bridge.js";
import { createBootMetrics, BOOT_PHASES } from "../core/boot-metrics.js";
import { HOOKS } from "../core/lifecycle-hooks.js";
import { PLUGIN_HOOKS } from "../core/plugin-system.js";
import { validateObject } from "../utils/validator.js";
import { LIMITS } from "../config.js";
import { registerLoaded } from "../core/dependency-map.js";
import { getEnv, ENV } from "../config.js";
import GlobalStateAdapter from "../adapters/global-state-adapter.js";
import { BOOTSTRAP_EVENT_NAMES, KERNEL_UI_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import { VERSION, MODULE_ID, BOOTSTRAP_STATES, CONFIG_SCHEMA, DEFAULT_CONFIG } from "./config/index.js";
import { initPhase1 } from "./phases/phase1-foundation.js";
import { initPhase2 } from "./phases/phase2-performance.js";
import { initPhase3 } from "./phases/phase3-core.js";
import { initPhase4 } from "./phases/phase4-plugins.js";
import { initPhase5 } from "./phases/phase5-utils.js";
import { initPhase6 } from "./phases/phase6-ui.js";
import { initPhase7 } from "./phases/phase7-device.js";
import { createGetters } from "./getters/index.js";
import { createLifecycleHelpers } from "./helpers/lifecycle.js";
import { createKernelHelpers } from "./helpers/kernel.js";
import { createUtilsHelpers } from "./helpers/utils.js";
import { createUIHelpers } from "./helpers/ui.js";
import { createDeviceHelpers } from "./helpers/device.js";
import { performHealthCheck } from "./diagnostics/health-check.js";
import { getInfo } from "./diagnostics/info.js";
let _instance = null;
function createBootstrap(options = {}) {
  const validationResult = validateObject(options, CONFIG_SCHEMA, { allowUnknown: true });
  const config = { ...DEFAULT_CONFIG, ...validationResult.value };
  const refs = {
    state: BOOTSTRAP_STATES.IDLE,
    config,
    kernel: null,
    eventBus: null,
    eventBusAdapter: null,
    container: null,
    bootMetrics: null,
    logger: null,
    errors: [],
    GlobalStateAdapter,
    performanceMonitor: null,
    fallbackSystem: null,
    pluginSystem: null,
    lifecycleHooks: null,
    stateSnapshots: null,
    debugMode: null,
    configPersistence: null,
    slotPresets: null,
    sanitizer: null,
    rateLimiter: null,
    devToolsPanel: null,
    workerManager: null,
    consoleCommands: null,
    telemetryDashboard: null,
    requestQueue: null,
    cacheManager: null,
    eventRecorder: null,
    notificationManager: null,
    formValidator: null,
    storageManager: null,
    clipboardManager: null,
    dragDropManager: null,
    modalManager: null,
    tooltipManager: null,
    contextMenuManager: null,
    hotkeyManager: null,
    scrollManager: null,
    focusManager: null,
    undoManager: null,
    themeManager: null,
    animationManager: null,
    mediaQueryManager: null,
    intersectionManager: null,
    resizeManager: null,
    mutationManager: null,
    permissionManager: null,
    networkManager: null,
    geolocationManager: null,
    deviceManager: null,
    batteryManager: null,
    fullscreenManager: null,
    visibilityManager: null,
    wakeLockManager: null,
    shareManager: null
  };
  function _setState(newState) {
    const oldState = refs.state;
    refs.state = newState;
    refs.logger?.debug(`State: ${oldState} -> ${newState}`);
    refs.bootMetrics?.milestone(`state_${newState}`);
    config.onStateChange?.(newState, oldState);
    refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.STATE_CHANGED, { state: newState, previousState: oldState });
  }
  function _handleError(error, context) {
    const errorRecord = { message: error?.message || error, context, timestamp: Date.now() };
    refs.errors.push(errorRecord);
    if (refs.errors.length > LIMITS.MAX_ERROR_LOG) refs.errors.shift();
    refs.logger?.error(`Error in ${context}:`, error);
    refs.bootMetrics?.recordError?.(context, error);
    config.onError?.(error, context);
    refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.ERROR, errorRecord);
  }
  async function _initPlugins() {
    if (!config.enablePlugins || !refs.pluginSystem) return;
    refs.bootMetrics?.startPhase(BOOT_PHASES.PLUGINS);
    if (config.plugins?.length > 0) {
      for (const plugin of config.plugins) refs.pluginSystem.register(plugin);
    }
    refs.pluginSystem.setContext({ bootstrap, kernel: refs.kernel, eventBus: refs.eventBus, logger: refs.logger });
    await refs.lifecycleHooks?.execute(HOOKS.BEFORE_BOOT, { config });
    await refs.pluginSystem.executeHook(PLUGIN_HOOKS.BEFORE_BOOT, { config });
    const results = await refs.pluginSystem.initAll();
    refs.logger?.debug(`Plugins initialized: ${results.filter((r) => r.success).length}/${results.length}`);
    refs.bootMetrics?.endPhase(BOOT_PHASES.PLUGINS);
  }
  const bootstrap = {
    async boot(container = null) {
      if (refs.state !== BOOTSTRAP_STATES.IDLE && refs.state !== BOOTSTRAP_STATES.SHUTDOWN) {
        refs.logger?.warn("Already booted");
        return this;
      }
      refs.container = container;
      if (config.enableBootMetrics) {
        refs.bootMetrics = createBootMetrics({ debug: getEnv() === ENV.DEVELOPMENT });
        refs.bootMetrics.start();
        registerLoaded("boot-metrics");
      }
      _setState(BOOTSTRAP_STATES.BOOTING);
      try {
        refs.bootMetrics?.startPhase(BOOT_PHASES.EVENTBUS);
        refs.eventBus = getEventBus({});
        refs.eventBus.emit(BOOTSTRAP_EVENT_NAMES.STARTING, { version: VERSION });
        registerLoaded("event-bridge");
        refs.bootMetrics?.endPhase(BOOT_PHASES.EVENTBUS);
        const phase1Context = { config, eventBus: refs.eventBus, bootMetrics: refs.bootMetrics, MODULE_ID };
        const phase1Result = await initPhase1(phase1Context);
        refs.logger = phase1Result.logger;
        _setState(BOOTSTRAP_STATES.PHASE1_READY);
        const phase2Context = { config, eventBus: refs.eventBus, bootMetrics: refs.bootMetrics, logger: refs.logger };
        const phase2Result = await initPhase2(phase2Context);
        Object.assign(refs, phase2Result);
        _setState(BOOTSTRAP_STATES.PHASE2_READY);
        const phase3Context = { bootMetrics: refs.bootMetrics, logger: refs.logger };
        await initPhase3(phase3Context);
        _setState(BOOTSTRAP_STATES.PHASE3_READY);
        const phase4Context = { config, eventBus: refs.eventBus, bootMetrics: refs.bootMetrics, logger: refs.logger };
        const phase4Result = await initPhase4(phase4Context);
        Object.assign(refs, phase4Result);
        _setState(BOOTSTRAP_STATES.PHASE4_READY);
        const phase5Context = { config, bootMetrics: refs.bootMetrics, logger: refs.logger };
        const phase5Result = await initPhase5(phase5Context);
        Object.assign(refs, phase5Result);
        _setState(BOOTSTRAP_STATES.PHASE5_READY);
        const phase6Context = { config, bootMetrics: refs.bootMetrics, logger: refs.logger };
        const phase6Result = await initPhase6(phase6Context);
        Object.assign(refs, phase6Result);
        _setState(BOOTSTRAP_STATES.PHASE6_READY);
        const phase7Context = { config, bootMetrics: refs.bootMetrics, logger: refs.logger };
        const phase7Result = await initPhase7(phase7Context);
        Object.assign(refs, phase7Result);
        _setState(BOOTSTRAP_STATES.PHASE7_READY);
        refs.debugMode?.inject({ eventBus: refs.eventBus, bootstrap: this });
        refs.stateSnapshots?.inject({ bootstrap: this, eventBus: refs.eventBus });
        refs.devToolsPanel?.inject({ bootstrap: this, eventBus: refs.eventBus });
        refs.consoleCommands?.inject({ bootstrap: this, eventBus: refs.eventBus });
        refs.telemetryDashboard?.inject({ bootstrap: this, eventBus: refs.eventBus });
        refs.eventRecorder?.inject({ eventBus: refs.eventBus });
        refs.bootMetrics?.startPhase(BOOT_PHASES.KERNEL);
        refs.kernel = createAdaptiveKernel({
          container: refs.container,
          eventBus: refs.eventBus,
          cleanupStrategy: config.cleanupStrategy,
          memoryWarningThreshold: config.memoryWarningThreshold,
          memoryCriticalThreshold: config.memoryCriticalThreshold,
          maxConcurrentLoads: config.maxConcurrentLoads,
          enableMetricsPersistence: config.enableMetricsPersistence,
          enableImageVirtualization: config.enableImageVirtualization,
          enableDeprecationWarnings: config.enableDeprecationWarnings,
          onStateChange: (state, prev) => {
            refs.logger?.debug(`Kernel: ${prev} -> ${state}`);
            refs.eventBus?.emit(KERNEL_UI_EVENT_NAMES.STATE_CHANGED, { state, previousState: prev });
          },
          onError: (error, ctx) => _handleError(error, ctx),
          onMemoryWarning: () => {
            refs.logger?.warn("Memory warning!");
            refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.MEMORY_WARNING, {});
          },
          onMemoryCritical: () => {
            refs.logger?.error("Memory critical!");
            refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.MEMORY_CRITICAL, {});
          }
        });
        await refs.kernel.init();
        refs.bootMetrics?.endPhase(BOOT_PHASES.KERNEL);
        _setState(BOOTSTRAP_STATES.KERNEL_READY);
        registerLoaded("adaptive-kernel");
        await refs.lifecycleHooks?.execute(HOOKS.AFTER_KERNEL_INIT, { kernel: refs.kernel });
        refs.bootMetrics?.startPhase(BOOT_PHASES.COMPONENTS);
        const componentOptions = {
          eventBus: refs.eventBus,
          lifecycleGuard: refs.kernel.getManager("lifecycle"),
          metricsPersistence: refs.kernel.getManager("metrics"),
          enableLazyLoading: config.enableLazyLoading
        };
        if (config.waitForLazyComponents) {
          await initComponentsAsync(componentOptions);
        } else {
          await initComponents(componentOptions);
        }
        refs.bootMetrics?.endPhase(BOOT_PHASES.COMPONENTS);
        _setState(BOOTSTRAP_STATES.COMPONENTS_READY);
        registerLoaded("init-components");
        await _initPlugins();
        _setState(BOOTSTRAP_STATES.PLUGINS_READY);
        if (config.autoStart) {
          refs.kernel.start();
          refs.performanceMonitor?.start();
          if (refs.eventRecorder && config.enableEventRecorder) refs.eventRecorder.start();
          if (refs.networkManager && config.enableNetworkManager) refs.networkManager.startMonitoring();
        }
        refs.bootMetrics?.end();
        _setState(BOOTSTRAP_STATES.RUNNING);
        await refs.lifecycleHooks?.execute(HOOKS.AFTER_BOOT, { bootstrap: this });
        await refs.pluginSystem?.executeHook(PLUGIN_HOOKS.AFTER_BOOT, { bootstrap: this });
        if (refs.stateSnapshots) refs.stateSnapshots.create("boot-complete", "auto", { event: "boot" });
        refs.eventBus.emit(BOOTSTRAP_EVENT_NAMES.READY, {
          bootTime: refs.bootMetrics?.getTotalTime(),
          metrics: refs.bootMetrics?.getReport()
        });
        config.onReady?.(this);
        registerLoaded("bootstrap-integration");
        if (getEnv() !== ENV.PRODUCTION && refs.bootMetrics) refs.bootMetrics.logReport();
        refs.logger.info(`\u2705 Bootstrap complete in ${refs.bootMetrics?.getTotalTime().toFixed(2) || "N/A"}ms`);
      } catch (error) {
        _handleError(error, "boot");
        _setState(BOOTSTRAP_STATES.ERROR);
        throw error;
      }
      return this;
    },
    async reboot(options2 = {}) {
      const { preserveState = false } = options2;
      refs.logger?.debug("Rebooting...", { preserveState });
      await refs.lifecycleHooks?.execute(HOOKS.BEFORE_SHUTDOWN, {});
      refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.REBOOTING, { preserveState });
      try {
        refs.performanceMonitor?.stop();
        refs.eventRecorder?.stop();
        refs.networkManager?.stopMonitoring();
        if (refs.kernel) await refs.kernel.reset({ preserveSlots: preserveState, clearMetrics: !preserveState });
        refs.performanceMonitor?.start();
        if (config.enableEventRecorder) refs.eventRecorder?.start();
        if (config.enableNetworkManager) refs.networkManager?.startMonitoring();
        _setState(BOOTSTRAP_STATES.RUNNING);
        refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.REBOOTED, {});
      } catch (error) {
        _handleError(error, "reboot");
        _setState(BOOTSTRAP_STATES.ERROR);
        throw error;
      }
      return this;
    },
    async shutdown() {
      if (refs.state === BOOTSTRAP_STATES.SHUTDOWN) return this;
      refs.logger?.debug("Shutting down...");
      await refs.lifecycleHooks?.execute(HOOKS.BEFORE_SHUTDOWN, {});
      refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.SHUTTING_DOWN, {});
      try {
        const managers = [
          "pluginSystem",
          "performanceMonitor",
          "fallbackSystem",
          "lifecycleHooks",
          "eventBusAdapter",
          "stateSnapshots",
          "debugMode",
          "configPersistence",
          "devToolsPanel",
          "workerManager",
          "telemetryDashboard",
          "requestQueue",
          "cacheManager",
          "eventRecorder",
          "notificationManager",
          "formValidator",
          "storageManager",
          "dragDropManager",
          "modalManager",
          "tooltipManager",
          "contextMenuManager",
          "hotkeyManager",
          "scrollManager",
          "focusManager",
          "undoManager",
          "themeManager",
          "animationManager",
          "mediaQueryManager",
          "intersectionManager",
          "resizeManager",
          "mutationManager",
          "permissionManager",
          "networkManager",
          "geolocationManager",
          "deviceManager",
          "batteryManager",
          "fullscreenManager",
          "visibilityManager"
        ];
        for (const m of managers) refs[m]?.destroy?.();
        refs.clipboardManager?.destroy?.();
        refs.wakeLockManager?.destroy?.();
        refs.shareManager?.destroy?.();
        GlobalStateAdapter.cleanup();
        if (refs.kernel) {
          await refs.kernel.destroy();
          refs.kernel = null;
        }
        await refs.lifecycleHooks?.execute(HOOKS.AFTER_SHUTDOWN, {});
        _setState(BOOTSTRAP_STATES.SHUTDOWN);
        refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.SHUTDOWN, {});
        refs.eventBus = null;
      } catch (error) {
        _handleError(error, "shutdown");
        throw error;
      }
      return this;
    },
    pause() {
      refs.kernel?.pause();
      refs.performanceMonitor?.pause();
      refs.requestQueue?.pause();
      refs.eventRecorder?.pause();
      refs.networkManager?.stopMonitoring();
      refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.PAUSED, {});
      return this;
    },
    resume() {
      refs.kernel?.resume();
      refs.performanceMonitor?.resume();
      refs.requestQueue?.resume();
      refs.eventRecorder?.resume();
      refs.networkManager?.startMonitoring();
      refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.RESUMED, {});
      return this;
    },
    ...createGetters(refs),
    ...createLifecycleHelpers(refs),
    ...createKernelHelpers(refs),
    ...createUtilsHelpers(refs),
    ...createUIHelpers(refs),
    ...createDeviceHelpers(refs),
    async healthCheck() {
      return performHealthCheck(refs);
    },
    info() {
      return getInfo(refs);
    }
  };
  return bootstrap;
}
function getBootstrap(options = {}) {
  if (!_instance) _instance = createBootstrap(options);
  return _instance;
}
function resetBootstrap() {
  if (_instance) {
    _instance.shutdown().catch(() => {
    });
    _instance = null;
  }
}
async function boot(container = null, options = {}) {
  return getBootstrap(options).boot(container);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["createBootstrap", "getBootstrap", "boot"], states: Object.keys(BOOTSTRAP_STATES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var bootstrap_default = { VERSION, MODULE_ID, BOOTSTRAP_STATES, createBootstrap, getBootstrap, resetBootstrap, boot, info, healthCheck };
export {
  BOOTSTRAP_STATES,
  MODULE_ID,
  VERSION,
  boot,
  createBootstrap,
  bootstrap_default as default,
  getBootstrap,
  healthCheck,
  info,
  resetBootstrap
};
