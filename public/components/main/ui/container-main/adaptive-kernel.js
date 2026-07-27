import { createEventBridge, getEventBus } from "./core/event-bridge.js";
import { resetCircuitBreaker } from "./resources/circuit-breaker.js";
import { KERNEL_UI_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import {
  VERSION,
  MODULE_ID,
  KERNEL_STATES,
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
} from "./kernel/index.js";
function createAdaptiveKernel(options = {}) {
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
  let _eventBus = null;
  let _eventBridge = null;
  let _contentEl = null;
  let _initOptions = null;
  let _resetCount = 0;
  let _initialized = false;
  let _registry = null;
  let _stateMachine = null;
  let _errorHandler = null;
  let _healthReporter = null;
  let _facades = {};
  function _safeGetState() {
    return _stateMachine?.getState() ?? KERNEL_STATES.IDLE;
  }
  function _getContentElement() {
    if (_contentEl) return _contentEl;
    if (container) {
      const _container = container;
      _contentEl = _container.querySelector?.(".dsd-container__content") || _container.querySelector?.('[data-slot="content"]') || container;
    }
    return _contentEl;
  }
  function _initFacades() {
    _facades = {
      // @ts-expect-error strict migration — TS2322
      slot: createSlotFacade(_registry, _healthReporter),
      // @ts-expect-error strict migration — TS2322
      capability: createCapabilityFacade(_registry),
      // @ts-expect-error strict migration — TS2322
      layout: createLayoutFacade(_registry),
      // @ts-expect-error strict migration — TS2322
      listener: createListenerFacade(_registry),
      // @ts-expect-error strict migration — TS2322
      metrics: createMetricsFacade(_registry),
      // @ts-expect-error strict migration — TS2322
      image: createImageFacade(_registry),
      // @ts-expect-error strict migration — TS2322
      resource: createResourceFacade(_registry),
      // @ts-expect-error strict migration — TS2322
      deprecation: createDeprecationFacade(_registry)
    };
  }
  const kernel = {
    // Inicializa o kernel
    async init() {
      if (_initialized) {
        return this;
      }
      _eventBus = eventBus || getEventBus({});
      _eventBridge = createEventBridge(_eventBus);
      _registry = createManagerRegistry();
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
      });
      _stateMachine.setState(KERNEL_STATES.INITIALIZING);
      _healthReporter.setStartTime(Date.now());
      try {
        _initOptions = {
          cleanupStrategy,
          memoryWarningThreshold,
          memoryCriticalThreshold,
          maxConcurrentLoads,
          enableMetricsPersistence,
          enableImageVirtualization,
          enableDeprecationWarnings
        };
        await initializeSubsystems(_registry, {
          eventBus: _eventBus,
          eventBridge: _eventBridge,
          contentElement: _getContentElement(),
          errorHandler: _errorHandler,
          onSlotChange: (slotId, slot) => {
            _healthReporter.incrementSlotActivations();
            onSlotChange?.(slotId, slot);
          },
          onMemoryWarning,
          onMemoryCritical,
          ..._initOptions
        });
        const metricsManager = _registry.get("metrics");
        _errorHandler = createErrorHandler({ metricsManager, eventBridge: _eventBridge, onError });
        _stateMachine = createStateMachine({ metricsManager, eventBridge: _eventBridge, onStateChange });
        _initFacades();
        _stateMachine.setState(KERNEL_STATES.READY);
        _initialized = true;
        _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.INITIALIZED, {
          version: VERSION,
          managers: _registry.listActive().map((m) => m.name)
        });
      } catch (error) {
        _errorHandler?.handle(error, "init");
        _stateMachine?.setState(KERNEL_STATES.ERROR);
        throw error;
      }
      return this;
    },
    // Reseta o kernel
    async reset(options2 = {}) {
      const { preserveSlots = false, clearErrors = true, clearMetrics = false } = options2;
      const currentState = _safeGetState();
      if (currentState === KERNEL_STATES.DESTROYED) {
        throw new Error("Cannot reset destroyed kernel");
      }
      const previousState = currentState;
      _stateMachine?.setState(KERNEL_STATES.RESETTING);
      _resetCount++;
      _healthReporter?.incrementResets();
      _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.RESETTING, { resetCount: _resetCount, preserveSlots });
      try {
        const savedSlots = preserveSlots ? _facades.slot?.list() : [];
        const savedMetricsData = !clearMetrics ? _facades.metrics?.export("object") : null;
        await _registry?.cleanup();
        resetCircuitBreaker("resource-manager");
        resetCircuitBreaker("default");
        if (clearErrors) _errorHandler?.clearErrors();
        await initializeSubsystems(_registry, {
          eventBus: _eventBus,
          eventBridge: _eventBridge,
          contentElement: _getContentElement(),
          errorHandler: _errorHandler,
          onSlotChange,
          onMemoryWarning,
          onMemoryCritical,
          ..._initOptions
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
        onReset?.(_resetCount);
        _eventBridge?.emit(KERNEL_UI_EVENT_NAMES.RESET, { resetCount: _resetCount, preserveSlots, restoredSlots: savedSlots.length });
      } catch (error) {
        _errorHandler?.handle(error, "reset");
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
        _errorHandler?.handle(error, "recover");
        throw error;
      }
      return this;
    },
    // === SLOT MANAGEMENT ===
    registerSlot: (config, factory) => _facades.slot?.register(config, factory),
    unregisterSlot: (id) => _facades.slot?.unregister(id),
    activateSlot: (id) => _facades.slot?.activate(id),
    getSlot: (id) => _facades.slot?.get(id),
    getActiveSlot: () => _facades.slot?.getActive(),
    listSlots: () => _facades.slot?.list() || [],
    // === CAPABILITY MANAGEMENT ===
    requestCapability: (panelId, cap) => _facades.capability?.request(panelId, cap),
    revokeCapability: (panelId, cap) => _facades.capability?.revoke(panelId, cap),
    hasCapability: (panelId, cap) => _facades.capability?.has(panelId, cap),
    // === LAYOUT MANAGEMENT ===
    registerLayout: (panelId, panel, el, opts) => _facades.layout?.register(panelId, panel, el, opts),
    resizePanel: (panelId, w, h, opts) => _facades.layout?.resize(panelId, w, h, opts),
    movePanel: (panelId, x, y, opts) => _facades.layout?.move(panelId, x, y, opts),
    dockPanel: (panelId, zone) => _facades.layout?.dock(panelId, zone),
    toggleFullscreen: (panelId) => _facades.layout?.toggleFullscreen(panelId),
    // === LISTENER MANAGEMENT ===
    trackListener: (panelId, type, target, event, handler, opts) => _facades.listener?.trackDOM(panelId, target, event, handler, opts),
    trackEventBusListener: (panelId, event, handler) => _facades.listener?.trackEventBus(panelId, event, handler),
    cleanupPanelListeners: (panelId) => _facades.listener?.cleanupPanel(panelId),
    // === METRICS MANAGEMENT ===
    recordMetric: (panelId, name, value, opts) => _facades.metrics?.record(panelId, name, value, opts),
    getMetrics: (panelId, opts) => _facades.metrics?.get(panelId, opts),
    getMetricStats: (panelId, name, opts) => _facades.metrics?.getStats(panelId, name, opts),
    // === IMAGE VIRTUALIZATION ===
    virtualizeImage: (el, src, opts) => _facades.image?.virtualize(el, src, opts),
    loadImageNow: (id) => _facades.image?.loadNow(id),
    // === RESOURCE MANAGEMENT ===
    scheduleCleanup: (id, fn, priority) => _facades.resource?.scheduleCleanup(id, fn, priority),
    cancelCleanup: (id) => _facades.resource?.cancelCleanup(id),
    executeProtected: (fn, breaker) => _facades.resource?.executeProtected(fn, breaker),
    // === DEPRECATION ===
    deprecate: (id, config) => _facades.deprecation?.register(id, config),
    checkDeprecation: (id, ctx) => _facades.deprecation?.check(id, ctx),
    // === STATE & INFO ===
    getState: () => _safeGetState(),
    isInitialized: () => _initialized,
    canReset: () => {
      const state = _safeGetState();
      return state !== KERNEL_STATES.DESTROYED && state !== KERNEL_STATES.RESETTING;
    },
    getResetCount: () => _resetCount,
    getManager: (name) => _registry?.get(name) ?? null,
    listManagers: () => _registry?.listActive() ?? [],
    getKernelMetrics: () => _healthReporter?.getKernelMetrics() ?? {},
    healthCheck: () => _healthReporter?.healthCheck() ?? { status: "NOT_INITIALIZED", version: VERSION },
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
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(KERNEL_STATES),
    exports: ["createAdaptiveKernel", "KERNEL_STATES"],
    fullyIntegrated: true,
    modular: true,
    managers: [
      "slot",
      "resource",
      "cleanup",
      "capability",
      "listener",
      "lifecycle",
      "layout",
      "metrics",
      "image",
      "deprecation",
      "compat"
    ]
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    fullyIntegrated: true,
    modular: true
  };
}
var adaptive_kernel_default = {
  VERSION,
  MODULE_ID,
  KERNEL_STATES,
  createAdaptiveKernel,
  info,
  healthCheck
};
export {
  KERNEL_STATES,
  MODULE_ID,
  VERSION,
  createAdaptiveKernel,
  adaptive_kernel_default as default,
  healthCheck,
  info
};
