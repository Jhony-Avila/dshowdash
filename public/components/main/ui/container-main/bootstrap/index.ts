
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v13.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createAdaptiveKernel from ../adaptive-kernel.js
//   initComponents, initComponentsAsync from ../init-components.js
//   getEventBus from ../core/event-bridge.js
//   createBootMetrics, BOOT_PHASES from ../core/boot-metrics.js
//   HOOKS from ../core/lifecycle-hooks.js
//   PLUGIN_HOOKS from ../core/plugin-system.js
//   validateObject from ../utils/validator.js
//   LIMITS, getEnv, ENV from ../config.js
//   registerLoaded from ../core/dependency-map.js
//   GlobalStateAdapter from ../adapters/global-state-adapter.js
//   BOOTSTRAP_EVENT_NAMES, KERNEL_UI_EVENT_NAMES
//     from /core/runtime/constants/event-names.js
//   Phase 1-7 initializers, createGetters, helpers, diagnostics
//
// PROVIDES:
//   createBootstrap(), getBootstrap(), resetBootstrap(), boot(),
//   info(), healthCheck(),
//   VERSION, MODULE_ID, BOOTSTRAP_STATES
//
// RECEIVES (via createBootstrap options / boot container):
//   container — DOM Element
//   options — bootstrap configuration (plugins, features, etc.)
// ═══════════════════════════════════════════════════════════════
// Bootstrap Integration - Orquestrador Principal (Modularizado)
// @version 13.2.1-EVENT-CONSTANTS
// @changelog v13.2.1-EVENT-CONSTANTS - Fix: PLUGIN_HOOKS importado de plugin-system.js (não lifecycle-hooks.js)
// @changelog v13.2.0-EVENT-CONSTANTS - Migrado 13 strings hardcoded para BOOTSTRAP/KERNEL EVENT_NAMES
// @changelog v13.1.0-ENTERPRISE - Ajustado log levels para padrão enterprise
// @changelog v13.0.0 - Modularização completa em config, phases, getters, helpers, diagnostics
// @description Inicializa e conecta todos os sistemas do container-main
'use strict';

import { createAdaptiveKernel } from '../adaptive-kernel.js';
import { initComponents, initComponentsAsync } from '../init-components.js';
import { getEventBus } from '../core/event-bridge.js';
import { createBootMetrics, BOOT_PHASES } from '../core/boot-metrics.js';
import { HOOKS } from '../core/lifecycle-hooks.js';
import { PLUGIN_HOOKS } from '../core/plugin-system.js';
import { validateObject } from '../utils/validator.js';
import { LIMITS } from '../config.js';
import { registerLoaded } from '../core/dependency-map.js';
import { getEnv, ENV } from '../config.js';
import GlobalStateAdapter from '../adapters/global-state-adapter.js';
import { BOOTSTRAP_EVENT_NAMES, KERNEL_UI_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

import { VERSION, MODULE_ID, BOOTSTRAP_STATES, CONFIG_SCHEMA, DEFAULT_CONFIG } from './config/index.js';

import { initPhase1 } from './phases/phase1-foundation.js';
import { initPhase2 } from './phases/phase2-performance.js';
import { initPhase3 } from './phases/phase3-core.js';
import { initPhase4 } from './phases/phase4-plugins.js';
import { initPhase5 } from './phases/phase5-utils.js';
import { initPhase6 } from './phases/phase6-ui.js';
import { initPhase7 } from './phases/phase7-device.js';

import { createGetters } from './getters/index.js';

import { createLifecycleHelpers } from './helpers/lifecycle.js';
import { createKernelHelpers } from './helpers/kernel.js';
import { createUtilsHelpers } from './helpers/utils.js';
import { createUIHelpers } from './helpers/ui.js';
import { createDeviceHelpers } from './helpers/device.js';

import { performHealthCheck } from './diagnostics/health-check.js';
import { getInfo } from './diagnostics/info.js';

export { VERSION, MODULE_ID, BOOTSTRAP_STATES };

import type { ManagerRef } from './types.js';

let _instance: ManagerRef | null = null;

export function createBootstrap(options = {}) {
  const validationResult = validateObject(options, CONFIG_SCHEMA, { allowUnknown: true });
  const config = { ...DEFAULT_CONFIG, ...validationResult.value };
  
  const refs = {
    state: BOOTSTRAP_STATES.IDLE as string,
    config,
    kernel: null as ManagerRef | null,
    eventBus: null as ManagerRef | null,
    eventBusAdapter: null as ManagerRef | null,
    container: null as HTMLElement | null,
    bootMetrics: null as ManagerRef | null,
    logger: null as ManagerRef | null,
    errors: [] as unknown[],
    GlobalStateAdapter: GlobalStateAdapter as unknown as ManagerRef,
    performanceMonitor: null as ManagerRef | null,
    fallbackSystem: null as ManagerRef | null,
    pluginSystem: null as ManagerRef | null,
    lifecycleHooks: null as ManagerRef | null,
    stateSnapshots: null as ManagerRef | null,
    debugMode: null as ManagerRef | null,
    configPersistence: null as ManagerRef | null,
    slotPresets: null as ManagerRef | null,
    sanitizer: null as ManagerRef | null,
    rateLimiter: null as ManagerRef | null,
    devToolsPanel: null as ManagerRef | null,
    workerManager: null as ManagerRef | null,
    consoleCommands: null as ManagerRef | null,
    telemetryDashboard: null as ManagerRef | null,
    requestQueue: null as ManagerRef | null,
    cacheManager: null as ManagerRef | null,
    eventRecorder: null as ManagerRef | null,
    notificationManager: null as ManagerRef | null,
    formValidator: null as ManagerRef | null,
    storageManager: null as ManagerRef | null,
    clipboardManager: null as ManagerRef | null,
    dragDropManager: null as ManagerRef | null,
    modalManager: null as ManagerRef | null,
    tooltipManager: null as ManagerRef | null,
    contextMenuManager: null as ManagerRef | null,
    hotkeyManager: null as ManagerRef | null,
    scrollManager: null as ManagerRef | null,
    focusManager: null as ManagerRef | null,
    undoManager: null as ManagerRef | null,
    themeManager: null as ManagerRef | null,
    animationManager: null as ManagerRef | null,
    mediaQueryManager: null as ManagerRef | null,
    intersectionManager: null as ManagerRef | null,
    resizeManager: null as ManagerRef | null,
    mutationManager: null as ManagerRef | null,
    permissionManager: null as ManagerRef | null,
    networkManager: null as ManagerRef | null,
    geolocationManager: null as ManagerRef | null,
    deviceManager: null as ManagerRef | null,
    batteryManager: null as ManagerRef | null,
    fullscreenManager: null as ManagerRef | null,
    visibilityManager: null as ManagerRef | null,
    wakeLockManager: null as ManagerRef | null,
    shareManager: null as ManagerRef | null
  };

  function _setState(newState: string) {
    const oldState = refs.state;
    refs.state = newState;
    refs.logger?.debug(`State: ${oldState} -> ${newState}`);
    refs.bootMetrics?.milestone(`state_${newState}`);
    config.onStateChange?.(newState, oldState);
    refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.STATE_CHANGED, { state: newState, previousState: oldState });
  }

  function _handleError(error: unknown, context: string) {
    const errorRecord = { message: (error as Record<string, unknown>)?.message || error, context, timestamp: Date.now() };
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
    refs.logger?.debug(`Plugins initialized: ${results.filter((r: Record<string, unknown>) => r.success).length}/${results.length}`);
    refs.bootMetrics?.endPhase(BOOT_PHASES.PLUGINS);
  }

  const bootstrap = {
    async boot(container: HTMLElement | null = null) {
      if (refs.state !== BOOTSTRAP_STATES.IDLE && refs.state !== BOOTSTRAP_STATES.SHUTDOWN) {
        refs.logger?.warn('Already booted');
        return this;
      }
      refs.container = container;
      
      if (config.enableBootMetrics) {
        refs.bootMetrics = createBootMetrics({ debug: getEnv() === ENV.DEVELOPMENT }) as unknown as ManagerRef;
        refs.bootMetrics.start();
        registerLoaded('boot-metrics');
      }
      
      _setState(BOOTSTRAP_STATES.BOOTING);
      
      try {
        refs.bootMetrics?.startPhase(BOOT_PHASES.EVENTBUS);
        refs.eventBus = getEventBus({}) as unknown as ManagerRef;
        refs.eventBus.emit(BOOTSTRAP_EVENT_NAMES.STARTING, { version: VERSION });
        registerLoaded('event-bridge');
        refs.bootMetrics?.endPhase(BOOT_PHASES.EVENTBUS);
        
        const phase1Context = { config, eventBus: refs.eventBus, bootMetrics: refs.bootMetrics, MODULE_ID };
        const phase1Result = await initPhase1(phase1Context);
        refs.logger = phase1Result.logger as unknown as ManagerRef;
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
          onStateChange: (state: Record<string, unknown>, prev: unknown) => {
            refs.logger?.debug(`Kernel: ${prev} -> ${state}`);
            refs.eventBus?.emit(KERNEL_UI_EVENT_NAMES.STATE_CHANGED, { state, previousState: prev });
          },
          onError: (error: Record<string, unknown>, ctx: string) => _handleError(error, ctx),
          onMemoryWarning: () => {
            refs.logger?.warn('Memory warning!');
            refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.MEMORY_WARNING, {});
          },
          onMemoryCritical: () => {
            refs.logger?.error('Memory critical!');
            refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.MEMORY_CRITICAL, {});
          }
        }) as unknown as ManagerRef;
        await refs.kernel.init();
        refs.bootMetrics?.endPhase(BOOT_PHASES.KERNEL);
        _setState(BOOTSTRAP_STATES.KERNEL_READY);
        registerLoaded('adaptive-kernel');
        
        await refs.lifecycleHooks?.execute(HOOKS.AFTER_KERNEL_INIT, { kernel: refs.kernel });
        
        refs.bootMetrics?.startPhase(BOOT_PHASES.COMPONENTS);
        const componentOptions = {
          eventBus: refs.eventBus,
          lifecycleGuard: refs.kernel.getManager('lifecycle'),
          metricsPersistence: refs.kernel.getManager('metrics'),
          enableLazyLoading: config.enableLazyLoading
        };
        if (config.waitForLazyComponents) { await initComponentsAsync(componentOptions); }
        else { await initComponents(componentOptions); }
        refs.bootMetrics?.endPhase(BOOT_PHASES.COMPONENTS);
        _setState(BOOTSTRAP_STATES.COMPONENTS_READY);
        registerLoaded('init-components');
        
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
        
        if (refs.stateSnapshots) refs.stateSnapshots.create('boot-complete', 'auto', { event: 'boot' });
        
        refs.eventBus.emit(BOOTSTRAP_EVENT_NAMES.READY, {
          bootTime: refs.bootMetrics?.getTotalTime(),
          metrics: refs.bootMetrics?.getReport()
        });
        
        config.onReady?.(this);
        registerLoaded('bootstrap-integration');
        
        if (getEnv() !== ENV.PRODUCTION && refs.bootMetrics) refs.bootMetrics.logReport();
        refs.logger.info(`✅ Bootstrap complete in ${refs.bootMetrics?.getTotalTime().toFixed(2) || 'N/A'}ms`);
        
      } catch (error) {
        _handleError(error, 'boot');
        _setState(BOOTSTRAP_STATES.ERROR);
        throw error;
      }
      
      return this;
    },

    async reboot(options: Record<string, unknown> = {}) {
      const { preserveState = false } = options;
      refs.logger?.debug('Rebooting...', { preserveState });
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
        _handleError(error, 'reboot');
        _setState(BOOTSTRAP_STATES.ERROR);
        throw error;
      }
      return this;
    },

    async shutdown() {
      if ((refs.state as string) === BOOTSTRAP_STATES.SHUTDOWN) return this;
      refs.logger?.debug('Shutting down...');
      await refs.lifecycleHooks?.execute(HOOKS.BEFORE_SHUTDOWN, {});
      refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.SHUTTING_DOWN, {});
      try {
        const managers = [
          'pluginSystem', 'performanceMonitor', 'fallbackSystem', 'lifecycleHooks',
          'eventBusAdapter', 'stateSnapshots', 'debugMode', 'configPersistence',
          'devToolsPanel', 'workerManager', 'telemetryDashboard',
          'requestQueue', 'cacheManager', 'eventRecorder',
          'notificationManager', 'formValidator', 'storageManager',
          'dragDropManager', 'modalManager',
          'tooltipManager', 'contextMenuManager', 'hotkeyManager',
          'scrollManager', 'focusManager', 'undoManager',
          'themeManager', 'animationManager', 'mediaQueryManager',
          'intersectionManager', 'resizeManager', 'mutationManager',
          'permissionManager', 'networkManager', 'geolocationManager',
          'deviceManager', 'batteryManager', 'fullscreenManager',
          'visibilityManager'
        ];
        for (const m of managers) ((refs as unknown as Record<string, ManagerRef | null>)[m])?.destroy?.();
        refs.clipboardManager?.destroy?.();
        refs.wakeLockManager?.destroy?.();
        refs.shareManager?.destroy?.();
        GlobalStateAdapter.cleanup();
        if (refs.kernel) { await refs.kernel.destroy(); refs.kernel = null; }
        await refs.lifecycleHooks?.execute(HOOKS.AFTER_SHUTDOWN, {});
        _setState(BOOTSTRAP_STATES.SHUTDOWN);
        refs.eventBus?.emit(BOOTSTRAP_EVENT_NAMES.SHUTDOWN, {});
        refs.eventBus = null;
      } catch (error) {
        _handleError(error, 'shutdown');
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

    async healthCheck() { return performHealthCheck(refs); },
    info() { return getInfo(refs); }
  };

  return bootstrap;
}

export function getBootstrap(options = {}) {
  if (!_instance) _instance = createBootstrap(options) as unknown as ManagerRef;
  return _instance;
}

export function resetBootstrap() {
  if (_instance) { _instance.shutdown().catch(() => {}); _instance = null; }
}

export async function boot(container: HTMLElement | null = null, options = {}) {
  return getBootstrap(options).boot(container);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ['createBootstrap', 'getBootstrap', 'boot'], states: Object.keys(BOOTSTRAP_STATES) };
}

export function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default { VERSION, MODULE_ID, BOOTSTRAP_STATES, createBootstrap, getBootstrap, resetBootstrap, boot, info, healthCheck };
