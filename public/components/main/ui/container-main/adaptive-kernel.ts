// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: adaptive-kernel
// PURPOSE: Adaptive Kernel - Núcleo adaptativo do Container-Main
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createEventBridge, getEventBus from ./core/event-bridge.js
//   resetCircuitBreaker from ./resources/circuit-breaker.js
//   KERNEL_UI_EVENT_NAMES from /core/runtime/constants/event-names.js
//   VERSION, MODULE_ID, KERNEL_STATES, createStateMachine, createErrorHandler, cr...
//
// PROVIDES:
//   createAdaptiveKernel() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   KERNEL_STATES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   KERNEL_UI_EVENT_NAMES.DESTROYED
//   KERNEL_UI_EVENT_NAMES.INITIALIZED
//   KERNEL_UI_EVENT_NAMES.PAUSED
//   KERNEL_UI_EVENT_NAMES.RECOVERED
//   KERNEL_UI_EVENT_NAMES.RECOVERING
//   KERNEL_UI_EVENT_NAMES.RESET
//   KERNEL_UI_EVENT_NAMES.RESETTING
//   KERNEL_UI_EVENT_NAMES.RESUMED
//   KERNEL_UI_EVENT_NAMES.STARTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';


import { createEventBridge, getEventBus } from './core/event-bridge.js';
import { resetCircuitBreaker } from './resources/circuit-breaker.js';
import { KERNEL_UI_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

// Imports do kernel modular
import {
  VERSION, MODULE_ID, KERNEL_STATES,
  createStateMachine,
  createErrorHandler,
  createManagerRegistry,
  initializeSubsystems,
  createHealthReporter,
  createSlotFacade,
  createCapabilityFacade,
  createLayoutFacade,
  createListenerFacade,
  createMetricsFacade,
  createImageFacade,
  createResourceFacade,
  createDeprecationFacade,
  CLEANUP_STRATEGIES,
  MEMORY_LIMITS
} from './kernel/index.js';

export { VERSION, MODULE_ID, KERNEL_STATES };

// Cria instância do Adaptive Kernel
interface KernelManagerRegistry {
  get: (name: string) => Record<string, (...args: unknown[]) => unknown>;
  listActive: () => Array<{ name: string }>;
  cleanup: () => Promise<void>;
}

interface StateMachine {
  getState: () => string;
  setState: (state: string) => void;
}

interface ErrorHandlerRef {
  handle: (error: unknown, context: string) => void;
  clearErrors: () => void;
}

interface HealthReporterRef {
  setStartTime: (time: number) => void;
  incrementSlotActivations: () => void;
  incrementResets: () => void;
  getKernelMetrics: () => Record<string, unknown>;
  healthCheck: () => Record<string, unknown>;
  info: (opts: Record<string, unknown>) => Record<string, unknown>;
}

interface EventBridgeRef {
  emit: (event: string, data: Record<string, unknown>) => void;
}

export function createAdaptiveKernel(options: Record<string, unknown> = {}) {
  const {
    container,
    eventBus,
    cleanupStrategy = CLEANUP_STRATEGIES.BALANCED,
    memoryWarningThreshold = MEMORY_LIMITS.WARNING,
    memoryCriticalThreshold = MEMORY_LIMITS.CRITICAL,
    maxConcurrentLoads = 3,
    enableMetricsPersistence = true,
    enableImageVirtualization = true,
    enableDeprecationWarnings = true,
    onStateChange,
    onSlotChange,
    onError,
    onMemoryWarning,
    onMemoryCritical,
    onReset
  } = options;

  let _eventBus: Record<string, unknown> | null = null;
  let _eventBridge: EventBridgeRef | null = null;
  let _contentEl: HTMLElement | null = null;
  let _initOptions: Record<string, unknown> | null = null;
  let _resetCount = 0;
  let _initialized = false;

  // Componentes modulares
  let _registry: KernelManagerRegistry | null = null;
  let _stateMachine: StateMachine | null = null;
  let _errorHandler: ErrorHandlerRef | null = null;
  let _healthReporter: HealthReporterRef | null = null;

  // Facades
  let _facades: Record<string, Record<string, (...args: unknown[]) => unknown>> = {};

  // Helper para obter estado de forma segura
  function _safeGetState() {
    return _stateMachine?.getState() ?? KERNEL_STATES.IDLE;
  }

  // Obtém ou cria elemento de conteúdo
  function _getContentElement() {
    if (_contentEl) return _contentEl;
    if (container) {
      const _container = container as any;
      _contentEl = _container.querySelector?.('.dsd-container__content') ||
                   _container.querySelector?.('[data-slot="content"]') ||
                   container;
    }
    return _contentEl;
  }

  // Inicializa facades
  function _initFacades() {
    _facades = {
      // @ts-expect-error strict migration — TS2322
      slot: createSlotFacade(_registry as unknown as { get: (name: string) => Record<string, (...args: unknown[]) => unknown> }, _healthReporter),
      // @ts-expect-error strict migration — TS2322
      capability: createCapabilityFacade(_registry as unknown as { get: (name: string) => Record<string, (...args: unknown[]) => unknown> }),
      // @ts-expect-error strict migration — TS2322
      layout: createLayoutFacade(_registry as unknown as { get: (name: string) => Record<string, (...args: unknown[]) => unknown> }),
      // @ts-expect-error strict migration — TS2322
      listener: createListenerFacade(_registry as unknown as { get: (name: string) => Record<string, (...args: unknown[]) => unknown> }),
      // @ts-expect-error strict migration — TS2322
      metrics: createMetricsFacade(_registry as unknown as { get: (name: string) => Record<string, (...args: unknown[]) => unknown> }),
      // @ts-expect-error strict migration — TS2322
      image: createImageFacade(_registry as unknown as { get: (name: string) => Record<string, (...args: unknown[]) => unknown> }),
      // @ts-expect-error strict migration — TS2322
      resource: createResourceFacade(_registry as unknown as { get: (name: string) => Record<string, (...args: unknown[]) => unknown> }),
      // @ts-expect-error strict migration — TS2322
      deprecation: createDeprecationFacade(_registry as unknown as { get: (name: string) => Record<string, (...args: unknown[]) => unknown> })
    };
  }

  const kernel = {
    // Inicializa o kernel
    async init() {
      if (_initialized) {
        return this;
      }
      
      // Cria EventBridge
      _eventBus = eventBus || getEventBus({});
      _eventBridge = createEventBridge(_eventBus);

      // Cria componentes modulares
      _registry = createManagerRegistry() as unknown as KernelManagerRegistry;
      // @ts-expect-error strict migration — TS2322
      _errorHandler = createErrorHandler({
        metricsManager: null,
        eventBridge: _eventBridge,
        onError
      });
      _stateMachine = createStateMachine({
        metricsManager: null,
        eventBridge: _eventBridge,
        onStateChange
      });
      _healthReporter = createHealthReporter({
        registry: _registry,
        stateMachine: _stateMachine,
        errorHandler: _errorHandler,
        getResetCount: () => _resetCount
      }) as unknown as HealthReporterRef;

      _stateMachine.setState(KERNEL_STATES.INITIALIZING);
      _healthReporter.setStartTime(Date.now());

      try {
        _initOptions = {
          cleanupStrategy, memoryWarningThreshold, memoryCriticalThreshold,
          maxConcurrentLoads, enableMetricsPersistence, enableImageVirtualization,
          enableDeprecationWarnings
        };

        await initializeSubsystems(_registry as unknown as Parameters<typeof initializeSubsystems>[0], {
          eventBus: _eventBus,
          eventBridge: _eventBridge,
          contentElement: _getContentElement(),
          errorHandler: _errorHandler,
          onSlotChange: (slotId: string, slot: HTMLElement) => {
            _healthReporter!.incrementSlotActivations();
            (onSlotChange as ((...a: unknown[]) => void) | undefined)?.(slotId, slot);
          },
          onMemoryWarning,
          onMemoryCritical,
          ...(_initOptions as Record<string, unknown>)
        });

        // Atualiza referência de metrics nos handlers
        const metricsManager = _registry!.get('metrics');
        _errorHandler = createErrorHandler({ metricsManager, eventBridge: _eventBridge, onError }) as unknown as ErrorHandlerRef;
        _stateMachine = createStateMachine({ metricsManager, eventBridge: _eventBridge, onStateChange }) as unknown as StateMachine;

        _initFacades();

        _stateMachine.setState(KERNEL_STATES.READY);
        _initialized = true;
        
        _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.INITIALIZED, {
          version: VERSION,
          managers: _registry!.listActive().map((m: { name: string }) => m.name)
        });

      } catch (error) {
        _errorHandler?.handle(error, 'init');
        _stateMachine?.setState(KERNEL_STATES.ERROR);
        throw error;
      }

      return this;
    },

    // Reseta o kernel
    async reset(options: Record<string, any> = {}) {
      const { preserveSlots = false, clearErrors = true, clearMetrics = false } = options;
      
      const currentState = _safeGetState();
      if (currentState === KERNEL_STATES.DESTROYED) {
        throw new Error('Cannot reset destroyed kernel');
      }

      const previousState = currentState;
      _stateMachine?.setState(KERNEL_STATES.RESETTING);
      _resetCount++;
      _healthReporter?.incrementResets();

      _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.RESETTING, { resetCount: _resetCount, preserveSlots });

      try {
        const savedSlots = (preserveSlots ? _facades.slot?.list() : []) as Array<Record<string, unknown>>;
        const savedMetricsData = !clearMetrics ? _facades.metrics?.export('object') : null;

        await _registry?.cleanup();
        resetCircuitBreaker('resource-manager');
        resetCircuitBreaker('default');

        if (clearErrors) _errorHandler?.clearErrors();

        await initializeSubsystems(_registry as unknown as Parameters<typeof initializeSubsystems>[0], {
          eventBus: _eventBus,
          eventBridge: _eventBridge,
          contentElement: _getContentElement(),
          errorHandler: _errorHandler,
          onSlotChange,
          onMemoryWarning,
          onMemoryCritical,
          ...(_initOptions as Record<string, unknown>)
        });

        _initFacades();

        if (savedMetricsData) _facades.metrics?.import(savedMetricsData, { merge: true });
        if (preserveSlots && savedSlots.length > 0) {
          for (const slotInfo of savedSlots) {
            if (slotInfo.config && slotInfo.contentFactory) {
              _facades.slot.register(slotInfo.config, slotInfo.contentFactory);
            }
          }
        }

        _stateMachine?.setState(KERNEL_STATES.READY);
        if (previousState === KERNEL_STATES.RUNNING) this.start();

        (onReset as ((...a: unknown[]) => void) | undefined)?.(_resetCount);
        _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.RESET, { resetCount: _resetCount, preserveSlots, restoredSlots: savedSlots.length });

      } catch (error) {
        _errorHandler?.handle(error, 'reset');
        _stateMachine?.setState(KERNEL_STATES.ERROR);
        throw error;
      }

      return this;
    },

    // Controle de estado
    start() {
      const state = _safeGetState();
      if (state !== KERNEL_STATES.READY && state !== KERNEL_STATES.PAUSED) {
        return this;
      }
      _facades.resource?.start();
      _stateMachine?.setState(KERNEL_STATES.RUNNING);
      _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.STARTED, {});
      return this;
    },

    pause() {
      const state = _safeGetState();
      if (state !== KERNEL_STATES.RUNNING) return this;
      _facades.slot?.pauseAll();
      _facades.resource?.pauseAll();
      _facades.resource?.stop();
      _facades.image?.pause();
      _stateMachine?.setState(KERNEL_STATES.PAUSED);
      _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.PAUSED, {});
      return this;
    },

    resume() {
      const state = _safeGetState();
      if (state !== KERNEL_STATES.PAUSED) return this;
      _facades.slot?.resumeActive();
      _facades.resource?.resumeAll();
      _facades.resource?.start();
      _facades.image?.resume();
      _stateMachine?.setState(KERNEL_STATES.RUNNING);
      _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.RESUMED, {});
      return this;
    },

    async recover() {
      const state = _safeGetState();
      if (state !== KERNEL_STATES.ERROR) return this;
      _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.RECOVERING, {});
      try {
        await this.reset({ clearErrors: true });
        _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.RECOVERED, {});
      } catch (error) {
        _errorHandler?.handle(error, 'recover');
        throw error;
      }
      return this;
    },

    // === SLOT MANAGEMENT ===
    registerSlot: (config: Record<string, unknown>, factory: (...args: unknown[]) => void) => _facades.slot?.register(config, factory),
    unregisterSlot: (id: string) => _facades.slot?.unregister(id),
    activateSlot: (id: string) => _facades.slot?.activate(id),
    getSlot: (id: string) => _facades.slot?.get(id),
    getActiveSlot: () => _facades.slot?.getActive(),
    listSlots: () => _facades.slot?.list() || [],

    // === CAPABILITY MANAGEMENT ===
    requestCapability: (panelId: string, cap: unknown) => _facades.capability?.request(panelId, cap),
    revokeCapability: (panelId: string, cap: unknown) => _facades.capability?.revoke(panelId, cap),
    hasCapability: (panelId: string, cap: unknown) => _facades.capability?.has(panelId, cap),

    // === LAYOUT MANAGEMENT ===
    registerLayout: (panelId: string, panel: HTMLElement, el: HTMLElement, opts: Record<string, unknown>) => _facades.layout?.register(panelId, panel, el, opts),
    resizePanel: (panelId: string, w: unknown, h: unknown, opts: Record<string, unknown>) => _facades.layout?.resize(panelId, w, h, opts),
    movePanel: (panelId: string, x: number, y: number, opts: Record<string, unknown>) => _facades.layout?.move(panelId, x, y, opts),
    dockPanel: (panelId: string, zone: Record<string, unknown>) => _facades.layout?.dock(panelId, zone),
    toggleFullscreen: (panelId: string) => _facades.layout?.toggleFullscreen(panelId),

    // === LISTENER MANAGEMENT ===
    trackListener: (panelId: string, type: string, target: HTMLElement, event: Event, handler: (...args: unknown[]) => void, opts: Record<string, unknown>) => _facades.listener?.trackDOM(panelId, target, event, handler, opts),
    trackEventBusListener: (panelId: string, event: Event, handler: (...args: unknown[]) => void) => _facades.listener?.trackEventBus(panelId, event, handler),
    cleanupPanelListeners: (panelId: string) => _facades.listener?.cleanupPanel(panelId),

    // === METRICS MANAGEMENT ===
    recordMetric: (panelId: string, name: string, value: unknown, opts: Record<string, unknown>) => _facades.metrics?.record(panelId, name, value, opts),
    getMetrics: (panelId: string, opts: Record<string, unknown>) => _facades.metrics?.get(panelId, opts),
    getMetricStats: (panelId: string, name: string, opts: Record<string, unknown>) => _facades.metrics?.getStats(panelId, name, opts),

    // === IMAGE VIRTUALIZATION ===
    virtualizeImage: (el: HTMLElement, src: string, opts: Record<string, unknown>) => _facades.image?.virtualize(el, src, opts),
    loadImageNow: (id: string) => _facades.image?.loadNow(id),

    // === RESOURCE MANAGEMENT ===
    scheduleCleanup: (id: string, fn: (...args: unknown[]) => void, priority: number) => _facades.resource?.scheduleCleanup(id, fn, priority),
    cancelCleanup: (id: string) => _facades.resource?.cancelCleanup(id),
    executeProtected: (fn: (...args: unknown[]) => void, breaker: unknown) => _facades.resource?.executeProtected(fn, breaker),

    // === DEPRECATION ===
    deprecate: (id: string, config: Record<string, unknown>) => _facades.deprecation?.register(id, config),
    checkDeprecation: (id: string, ctx: Record<string, unknown>) => _facades.deprecation?.check(id, ctx),

    // === STATE & INFO ===
    getState: () => _safeGetState(),
    isInitialized: () => _initialized,
    canReset: () => {
      const state = _safeGetState();
      return state !== KERNEL_STATES.DESTROYED && state !== KERNEL_STATES.RESETTING;
    },
    getResetCount: () => _resetCount,
    getManager: (name: string) => _registry?.get(name) ?? null,
    listManagers: () => _registry?.listActive() ?? [],
    getKernelMetrics: () => _healthReporter?.getKernelMetrics() ?? {},
    healthCheck: () => _healthReporter?.healthCheck() ?? { status: 'NOT_INITIALIZED', version: VERSION },
    info: () => _healthReporter?.info({
      metricsPersistence: enableMetricsPersistence,
      imageVirtualization: enableImageVirtualization,
      deprecationWarnings: enableDeprecationWarnings
    }) || { moduleId: MODULE_ID, version: VERSION, initialized: _initialized },

    // Destroy
    async destroy() {
      if (_safeGetState() === KERNEL_STATES.DESTROYED) return;
      _stateMachine?.setState(KERNEL_STATES.DESTROYED);
      await _registry?.cleanup();
      _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.DESTROYED, {});
      _eventBridge = null;
      _eventBus = null;
      _contentEl = null;
      _initOptions = null;
      _facades = {};
      _initialized = false;
    }
  };

  return kernel;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(KERNEL_STATES),
    exports: ['createAdaptiveKernel', 'KERNEL_STATES'],
    fullyIntegrated: true,
    modular: true,
    managers: [
      'slot', 'resource', 'cleanup', 'capability', 'listener',
      'lifecycle', 'layout', 'metrics', 'image', 'deprecation', 'compat'
    ]
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    fullyIntegrated: true,
    modular: true
  };
}

export default {
  VERSION, MODULE_ID,
  KERNEL_STATES,
  createAdaptiveKernel,
  info, healthCheck
};
