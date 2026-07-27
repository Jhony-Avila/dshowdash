import { createAdaptiveKernel } from "./adaptive-kernel.js";
import { initComponents, initComponentsAsync } from "./init-components.js";
import { getEventBus } from "./core/event-bridge.js";
import { LIMITS } from "./config.js";
import { validateObject } from "./utils/validator.js";
import { registerLoaded } from "./core/dependency-map.js";
import { HOOKS } from "./core/lifecycle-hooks.js";
import { PLUGIN_HOOKS } from "./core/plugin-system.js";
import { BOOT_PHASES, createBootMetrics } from "./core/boot-metrics.js";
import GlobalStateAdapter from "./adapters/global-state-adapter.js";
import { getEnv, ENV } from "./config.js";
import { BOOTSTRAP_EVENT_NAMES, KERNEL_UI_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import { createPanelTransitions, getPanelTransitions, TRANSITION_TYPES } from "./utils/panel-transitions.js";
import { createContainerStatePersistence, getContainerStatePersistence } from "./utils/container-state-persistence.js";
import { createPerformanceAPI, getPerformanceAPI } from "./utils/performance-api/index.js";
import { createSkeletonManager, getSkeletonManager, showSkeleton, hideSkeleton, showSkeletonForPanel, SKELETON_TYPES, DELAY_VARIANTS } from "./utils/skeleton-manager.js";
import { createUpdateNotifier, getUpdateNotifier, checkForUpdates, hasUpdate, NOTIFIER_STATES, UPDATE_TYPES } from "./utils/update-notifier/index.js";
import { createNavigationHistory, getNavigationHistory, pushNavigation, goBack, goForward, canGoBack, canGoForward, NAVIGATION_TYPES } from "./utils/navigation-history/index.js";
import { createLoadingProgress, getLoadingProgress, startLoading, doneLoading, setLoadingProgress, isLoading, LOADING_STATES } from "./utils/loading-progress/index.js";
import { createSplitViewManager, getSplitViewManager, SPLIT_ORIENTATIONS, SPLIT_POSITIONS } from "./utils/split-view-manager/index.js";
import { createExportContentManager, getExportContentManager, exportToPNG, exportToJPEG, exportToPDF, exportToSVG, exportElement, EXPORT_FORMATS, EXPORT_QUALITY } from "./utils/export-content-manager/index.js";
import { createOfflineModeManager, getOfflineModeManager, cachedFetch, cacheUrl, getCached, clearCache, getCacheSize, queueRequest, OFFLINE_STATES, CACHE_STRATEGIES } from "./utils/offline-mode-manager/index.js";
import { createAccessibilityManager, getAccessibilityManager, announce, setFocus, trapFocus, setContrastMode, setTextScale, enableFeature as enableA11yFeature, A11Y_FEATURES, ARIA_LIVE_REGIONS, CONTRAST_MODES } from "./utils/accessibility-manager/index.js";
import { createKeyboardNavigationManager, getKeyboardNavigationManager, registerGroup, unregisterGroup, focusFirst, focusLast, focusNext, focusPrevious, registerShortcut, unregisterShortcut, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP } from "./utils/keyboard-navigation-manager/index.js";
import { createZoomManager, getZoomManager, setZoom, zoomIn, zoomOut, zoomToFit, zoomToActual, resetZoom, ZOOM_PRESETS, ZOOM_ORIGINS } from "./utils/zoom-manager.js";
import { createPrintManager, getPrintManager, print, printElement, printPreview, addPageBreak, markAvoidBreak, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES } from "./utils/print-manager/index.js";
import { createPanelBookmarksManager, getPanelBookmarksManager, addBookmark, removeBookmark, getAllBookmarks, isBookmarked, navigateToBookmark, getRecentPanels, getMostFrequent, BOOKMARK_TYPES, SORT_MODES } from "./utils/panel-bookmarks-manager/index.js";
import { createCommandPaletteManager, getCommandPaletteManager, registerCommand, registerCommands, COMMAND_TYPES, PALETTE_MODES } from "./utils/command-palette-manager/index.js";
import { createPanelSearchManager, getPanelSearchManager, search, nextMatch, previousMatch, clearSearch, SEARCH_MODES, MATCH_TYPES } from "./utils/panel-search-manager/index.js";
import { createPanelTabsManager, getPanelTabsManager, addTab, closeTab, activateTab, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS } from "./utils/panel-tabs-manager/index.js";
import { createQuickActionsManager, getQuickActionsManager, addAction, removeAction, FAB_POSITIONS, MENU_DIRECTIONS, ACTION_TYPES } from "./utils/quick-actions-manager.js";
import { createTourManager, getTourManager, registerTour, startTour, endTour, TOUR_STATES } from "./utils/tour-manager.js";
const TOUR_TOOLTIP_POSITIONS = TOUR_STATES;
import {
  MODULE_ID,
  BOOTSTRAP_STATES,
  CONFIG_SCHEMA,
  DEFAULT_CONFIG,
  createManagerRegistry,
  initPhase1,
  initPhase2,
  initPhase3,
  initPhase4,
  initPhase5,
  initPhase6,
  initPhase7,
  createHealthReporter,
  createConvenienceMethods
} from "./bootstrap-integration/index.js";
const VERSION = "14.2.0-TOUR-IMPORT-FIX";
let _instance = null;
function createBootstrap(options = {}) {
  const validationResult = validateObject(options, CONFIG_SCHEMA, { allowUnknown: true });
  const config = { ...DEFAULT_CONFIG, ...validationResult.value };
  let _state = BOOTSTRAP_STATES.IDLE;
  let _kernel = null;
  let _eventBus = null;
  let _container = null;
  let _bootMetrics = null;
  let _errors = [];
  const managers = createManagerRegistry();
  let _healthReporter = null;
  let _convenienceMethods = null;
  function _mgr(name) {
    return managers.get(name);
  }
  function _setState(newState) {
    const oldState = _state;
    _state = newState;
    _mgr("logger")?.debug?.(`State: ${oldState} -> ${newState}`);
    _bootMetrics?.milestone?.(`state_${newState}`);
    config.onStateChange?.(newState, oldState);
    _eventBus?.emit?.(BOOTSTRAP_EVENT_NAMES.STATE_CHANGED, { state: newState, previousState: oldState });
  }
  function _handleError(error, context) {
    const errorRecord = { message: error?.message || error, context, timestamp: Date.now() };
    _errors.push(errorRecord);
    if (_errors.length > LIMITS.MAX_ERROR_LOG) _errors.shift();
    _mgr("logger")?.error?.(`Error in ${context}:`, error);
    _bootMetrics?.recordError?.(context, error);
    config.onError?.(error, context);
    _eventBus?.emit?.(BOOTSTRAP_EVENT_NAMES.ERROR, errorRecord);
  }
  function _createHelpers() {
    const ctx = { managers, getState: () => _state, kernel: _kernel, eventBus: _eventBus, bootMetrics: _bootMetrics, errors: _errors, config };
    _healthReporter = createHealthReporter(ctx);
    _convenienceMethods = createConvenienceMethods({ managers, kernel: _kernel });
  }
  function _exposeGlobals(bootstrapInstance) {
    if (typeof window !== "undefined") {
      window.CMBootstrap = bootstrapInstance;
      window.ContainerMain = {
        element: _container,
        contentElement: _container?.querySelector?.(".dsd-container__content") || _container,
        id: "container-main",
        mode: "bootstrap",
        version: VERSION,
        mount: () => {
        },
        unmount: () => {
        },
        getElement: () => _container,
        getContentElement: () => _container?.querySelector?.(".dsd-container__content") || _container,
        getBootstrap: () => bootstrapInstance,
        isBootstrapped: () => true,
        createPanelTransitions,
        getPanelTransitions,
        TRANSITION_TYPES,
        createContainerStatePersistence,
        getContainerStatePersistence,
        createPerformanceAPI,
        getPerformanceAPI,
        createSkeletonManager,
        getSkeletonManager,
        showSkeleton,
        hideSkeleton,
        showSkeletonForPanel,
        SKELETON_TYPES,
        DELAY_VARIANTS,
        createUpdateNotifier,
        getUpdateNotifier,
        checkForUpdates,
        hasUpdate,
        NOTIFIER_STATES,
        UPDATE_TYPES,
        createNavigationHistory,
        getNavigationHistory,
        pushNavigation,
        goBack,
        goForward,
        canGoBack,
        canGoForward,
        NAVIGATION_TYPES,
        createLoadingProgress,
        getLoadingProgress,
        startLoading,
        doneLoading,
        setLoadingProgress,
        isLoading,
        LOADING_STATES,
        createSplitViewManager,
        getSplitViewManager,
        SPLIT_ORIENTATIONS,
        SPLIT_POSITIONS,
        createExportContentManager,
        getExportContentManager,
        exportToPNG,
        exportToJPEG,
        exportToPDF,
        exportToSVG,
        exportElement,
        EXPORT_FORMATS,
        EXPORT_QUALITY,
        createOfflineModeManager,
        getOfflineModeManager,
        cachedFetch,
        cacheUrl,
        getCached,
        clearCache,
        getCacheSize,
        queueRequest,
        OFFLINE_STATES,
        CACHE_STRATEGIES,
        createAccessibilityManager,
        getAccessibilityManager,
        announce,
        setFocus,
        trapFocus,
        setContrastMode,
        setTextScale,
        enableA11yFeature,
        A11Y_FEATURES,
        ARIA_LIVE_REGIONS,
        CONTRAST_MODES,
        createKeyboardNavigationManager,
        getKeyboardNavigationManager,
        registerGroup,
        unregisterGroup,
        focusFirst,
        focusLast,
        focusNext,
        focusPrevious,
        registerShortcut,
        unregisterShortcut,
        KEY_CODES,
        NAVIGATION_MODES,
        FOCUS_WRAP,
        createZoomManager,
        getZoomManager,
        setZoom,
        zoomIn,
        zoomOut,
        zoomToFit,
        zoomToActual,
        resetZoom,
        ZOOM_PRESETS,
        ZOOM_ORIGINS,
        createPrintManager,
        getPrintManager,
        printFn: print,
        printElement,
        printPreview,
        addPageBreak,
        markAvoidBreak,
        PRINT_ORIENTATIONS,
        PRINT_SIZES,
        PAGE_BREAK_MODES,
        createPanelBookmarksManager,
        getPanelBookmarksManager,
        addBookmark,
        removeBookmark,
        getAllBookmarks,
        isBookmarked,
        navigateToBookmark,
        getRecentPanels,
        getMostFrequent,
        BOOKMARK_TYPES,
        SORT_MODES,
        createCommandPaletteManager,
        getCommandPaletteManager,
        registerCommand,
        registerCommands,
        COMMAND_TYPES,
        PALETTE_MODES,
        createPanelSearchManager,
        getPanelSearchManager,
        search,
        nextMatch,
        previousMatch,
        clearSearch,
        SEARCH_MODES,
        MATCH_TYPES,
        createPanelTabsManager,
        getPanelTabsManager,
        addTab,
        closeTab,
        activateTab,
        TAB_STATES,
        TAB_POSITIONS,
        CLOSE_BEHAVIORS,
        createQuickActionsManager,
        getQuickActionsManager,
        addAction,
        removeAction,
        FAB_POSITIONS,
        MENU_DIRECTIONS,
        ACTION_TYPES,
        createTourManager,
        getTourManager,
        registerTour,
        startTour,
        endTour,
        TOUR_STATES,
        TOUR_TOOLTIP_POSITIONS,
        transitions: { create: createPanelTransitions, get: getPanelTransitions, TYPES: TRANSITION_TYPES },
        statePersistence: { create: createContainerStatePersistence, get: getContainerStatePersistence },
        performanceAPI: { create: createPerformanceAPI, get: getPerformanceAPI },
        skeletons: { create: createSkeletonManager, get: getSkeletonManager, show: showSkeleton, hide: hideSkeleton, showForPanel: showSkeletonForPanel, TYPES: SKELETON_TYPES, DELAYS: DELAY_VARIANTS },
        updateNotifier: { create: createUpdateNotifier, get: getUpdateNotifier, check: checkForUpdates, hasUpdate, STATES: NOTIFIER_STATES, TYPES: UPDATE_TYPES },
        navigationHistory: { create: createNavigationHistory, get: getNavigationHistory, push: pushNavigation, back: goBack, forward: goForward, canGoBack, canGoForward, TYPES: NAVIGATION_TYPES },
        loadingProgress: { create: createLoadingProgress, get: getLoadingProgress, start: startLoading, done: doneLoading, set: setLoadingProgress, isLoading, STATES: LOADING_STATES },
        splitView: { create: createSplitViewManager, get: getSplitViewManager, ORIENTATIONS: SPLIT_ORIENTATIONS, POSITIONS: SPLIT_POSITIONS },
        exportContent: { create: createExportContentManager, get: getExportContentManager, toPNG: exportToPNG, toJPEG: exportToJPEG, toPDF: exportToPDF, toSVG: exportToSVG, export: exportElement, FORMATS: EXPORT_FORMATS, QUALITY: EXPORT_QUALITY },
        offlineMode: { create: createOfflineModeManager, get: getOfflineModeManager, fetch: cachedFetch, cache: cacheUrl, getCached, clearCache, getSize: getCacheSize, queue: queueRequest, STATES: OFFLINE_STATES, STRATEGIES: CACHE_STRATEGIES },
        accessibility: { create: createAccessibilityManager, get: getAccessibilityManager, announce, setFocus, trapFocus, setContrast: setContrastMode, setTextScale, enableFeature: enableA11yFeature, FEATURES: A11Y_FEATURES, LIVE: ARIA_LIVE_REGIONS, CONTRAST: CONTRAST_MODES },
        keyboardNav: { create: createKeyboardNavigationManager, get: getKeyboardNavigationManager, registerGroup, unregisterGroup, focusFirst, focusLast, focusNext, focusPrevious, registerShortcut, unregisterShortcut, KEYS: KEY_CODES, MODES: NAVIGATION_MODES, WRAP: FOCUS_WRAP },
        zoom: { create: createZoomManager, get: getZoomManager, set: setZoom, in: zoomIn, out: zoomOut, fit: zoomToFit, actual: zoomToActual, reset: resetZoom, PRESETS: ZOOM_PRESETS, ORIGINS: ZOOM_ORIGINS },
        print: { create: createPrintManager, get: getPrintManager, print, element: printElement, preview: printPreview, addBreak: addPageBreak, avoidBreak: markAvoidBreak, ORIENTATIONS: PRINT_ORIENTATIONS, SIZES: PRINT_SIZES, BREAKS: PAGE_BREAK_MODES },
        bookmarks: { create: createPanelBookmarksManager, get: getPanelBookmarksManager, add: addBookmark, remove: removeBookmark, getAll: getAllBookmarks, isBookmarked, navigate: navigateToBookmark, getRecent: getRecentPanels, getMostFrequent, TYPES: BOOKMARK_TYPES, SORT: SORT_MODES },
        commandPalette: { create: createCommandPaletteManager, get: getCommandPaletteManager, register: registerCommand, registerMany: registerCommands, TYPES: COMMAND_TYPES, MODES: PALETTE_MODES },
        panelSearch: { create: createPanelSearchManager, get: getPanelSearchManager, search, next: nextMatch, prev: previousMatch, clear: clearSearch, MODES: SEARCH_MODES, MATCH: MATCH_TYPES },
        panelTabs: { create: createPanelTabsManager, get: getPanelTabsManager, add: addTab, close: closeTab, activate: activateTab, STATES: TAB_STATES, POSITIONS: TAB_POSITIONS, CLOSE: CLOSE_BEHAVIORS },
        quickActions: { create: createQuickActionsManager, get: getQuickActionsManager, add: addAction, remove: removeAction, POSITIONS: FAB_POSITIONS, DIRECTIONS: MENU_DIRECTIONS, TYPES: ACTION_TYPES },
        tour: { create: createTourManager, get: getTourManager, register: registerTour, start: startTour, end: endTour, STATES: TOUR_STATES, TOOLTIP: TOUR_TOOLTIP_POSITIONS },
        info: () => ({
          version: VERSION,
          moduleId: MODULE_ID,
          sprint1Modules: ["PanelTransitions", "ContainerStatePersistence", "PerformanceAPI"],
          sprint2Modules: ["SkeletonManager", "UpdateNotifier"],
          sprint3Modules: ["NavigationHistory", "LoadingProgress"],
          sprint4Modules: ["SplitViewManager", "ExportContentManager", "OfflineModeManager"],
          sprint5Modules: ["AccessibilityManager", "KeyboardNavigationManager", "ZoomManager", "PrintManager", "PanelBookmarksManager"],
          sprint6Modules: ["CommandPaletteManager", "PanelSearchManager", "PanelTabsManager", "QuickActionsManager", "TourManager"],
          totalModules: 20,
          isBootstrapped: true
        })
      };
      _mgr("logger")?.debug?.("Globals exposed: window.CMBootstrap, window.ContainerMain (with Sprint 1-6 modules)");
    }
  }
  const bootstrap = {
    async boot(container = null) {
      if (_state !== BOOTSTRAP_STATES.IDLE && _state !== BOOTSTRAP_STATES.SHUTDOWN) {
        _mgr("logger")?.warn?.("Already booted");
        return this;
      }
      _container = container;
      if (config.enableBootMetrics) {
        _bootMetrics = createBootMetrics({ debug: getEnv() === ENV.DEVELOPMENT });
        _bootMetrics.start();
        registerLoaded("boot-metrics");
      }
      _setState(BOOTSTRAP_STATES.BOOTING);
      try {
        _bootMetrics?.startPhase?.(BOOT_PHASES.EVENTBUS);
        _eventBus = getEventBus({});
        _eventBus.emit(BOOTSTRAP_EVENT_NAMES.STARTING, { version: VERSION });
        registerLoaded("event-bridge");
        _bootMetrics?.endPhase?.(BOOT_PHASES.EVENTBUS);
        const phaseContext = { config, eventBus: _eventBus, bootMetrics: _bootMetrics, managers };
        const { logger } = await initPhase1(phaseContext);
        phaseContext.logger = logger;
        _setState(BOOTSTRAP_STATES.PHASE1_READY);
        await initPhase2(phaseContext);
        _setState(BOOTSTRAP_STATES.PHASE2_READY);
        await initPhase3(phaseContext);
        _setState(BOOTSTRAP_STATES.PHASE3_READY);
        await initPhase4(phaseContext);
        _setState(BOOTSTRAP_STATES.PHASE4_READY);
        await initPhase5(phaseContext);
        _setState(BOOTSTRAP_STATES.PHASE5_READY);
        await initPhase6(phaseContext);
        _setState(BOOTSTRAP_STATES.PHASE6_READY);
        await initPhase7(phaseContext);
        _setState(BOOTSTRAP_STATES.PHASE7_READY);
        _mgr("debugMode")?.inject?.({ eventBus: _eventBus, bootstrap: this });
        _mgr("stateSnapshots")?.inject?.({ bootstrap: this, eventBus: _eventBus });
        _mgr("devToolsPanel")?.inject?.({ bootstrap: this, eventBus: _eventBus });
        _mgr("consoleCommands")?.inject?.({ bootstrap: this, eventBus: _eventBus });
        _mgr("telemetryDashboard")?.inject?.({ bootstrap: this, eventBus: _eventBus });
        _mgr("eventRecorder")?.inject?.({ eventBus: _eventBus });
        _bootMetrics?.startPhase?.(BOOT_PHASES.KERNEL);
        _kernel = createAdaptiveKernel({
          container: _container,
          eventBus: _eventBus,
          cleanupStrategy: config.cleanupStrategy,
          memoryWarningThreshold: config.memoryWarningThreshold,
          memoryCriticalThreshold: config.memoryCriticalThreshold,
          maxConcurrentLoads: config.maxConcurrentLoads,
          enableMetricsPersistence: config.enableMetricsPersistence,
          enableImageVirtualization: config.enableImageVirtualization,
          enableDeprecationWarnings: config.enableDeprecationWarnings,
          onStateChange: (state, prev) => {
            logger?.debug?.(`Kernel: ${prev} -> ${state}`);
            _eventBus.emit(KERNEL_UI_EVENT_NAMES.STATE_CHANGED, { state, previousState: prev });
          },
          onError: (error, ctx) => _handleError(error, `kernel:${ctx}`),
          onMemoryWarning: () => {
            logger?.warn?.("Memory warning!");
            _eventBus.emit(BOOTSTRAP_EVENT_NAMES.MEMORY_WARNING, {});
          },
          onMemoryCritical: () => {
            logger?.error?.("Memory critical!");
            _eventBus.emit(BOOTSTRAP_EVENT_NAMES.MEMORY_CRITICAL, {});
          }
        });
        await _kernel.init();
        _bootMetrics?.endPhase?.(BOOT_PHASES.KERNEL);
        _setState(BOOTSTRAP_STATES.KERNEL_READY);
        registerLoaded("adaptive-kernel");
        await _mgr("lifecycleHooks")?.execute?.(HOOKS.AFTER_KERNEL_INIT, { kernel: _kernel });
        _bootMetrics?.startPhase?.(BOOT_PHASES.COMPONENTS);
        const componentOptions = { eventBus: _eventBus, lifecycleGuard: _kernel.getManager?.("lifecycle"), metricsPersistence: _kernel.getManager?.("metrics"), enableLazyLoading: config.enableLazyLoading };
        if (config.waitForLazyComponents) {
          await initComponentsAsync(componentOptions);
        } else {
          await initComponents(componentOptions);
        }
        _bootMetrics?.endPhase?.(BOOT_PHASES.COMPONENTS);
        _setState(BOOTSTRAP_STATES.COMPONENTS_READY);
        registerLoaded("init-components");
        await this._initPlugins();
        _setState(BOOTSTRAP_STATES.PLUGINS_READY);
        if (config.autoStart) {
          _kernel.start();
          _mgr("performanceMonitor")?.start?.();
          if (_mgr("eventRecorder") && config.enableEventRecorder) _mgr("eventRecorder").start();
          if (_mgr("networkManager") && config.enableNetworkManager) _mgr("networkManager").startMonitoring();
        }
        _bootMetrics?.end?.();
        _setState(BOOTSTRAP_STATES.RUNNING);
        _exposeGlobals(this);
        await _mgr("lifecycleHooks")?.execute?.(HOOKS.AFTER_BOOT, { bootstrap: this });
        await _mgr("pluginSystem")?.executeHook?.(PLUGIN_HOOKS.AFTER_BOOT, { bootstrap: this });
        if (_mgr("stateSnapshots")) _mgr("stateSnapshots").create("boot-complete", "auto", { event: "boot" });
        _createHelpers();
        _eventBus.emit(BOOTSTRAP_EVENT_NAMES.READY, { bootTime: _bootMetrics?.getTotalTime?.(), metrics: _bootMetrics?.getReport?.() });
        config.onReady?.(this);
        registerLoaded("bootstrap-integration");
        if (getEnv() !== ENV.PRODUCTION && _bootMetrics) _bootMetrics.logReport();
        logger?.info?.(`Bootstrap complete in ${_bootMetrics?.getTotalTime?.()?.toFixed?.(2) || "N/A"}ms`);
      } catch (error) {
        _handleError(error, "boot");
        _setState(BOOTSTRAP_STATES.ERROR);
        throw error;
      }
      return this;
    },
    async _initPlugins() {
      const pluginSystem = _mgr("pluginSystem");
      const lifecycleHooks = _mgr("lifecycleHooks");
      if (!config.enablePlugins || !pluginSystem) return;
      _bootMetrics?.startPhase?.(BOOT_PHASES.PLUGINS);
      if (config.plugins?.length > 0) {
        for (const plugin of config.plugins) pluginSystem.register(plugin);
      }
      pluginSystem.setContext({ bootstrap: this, kernel: _kernel, eventBus: _eventBus, logger: _mgr("logger") });
      await lifecycleHooks?.execute?.(HOOKS.BEFORE_BOOT, { config });
      await pluginSystem.executeHook(PLUGIN_HOOKS.BEFORE_BOOT, { config });
      const results = await pluginSystem.initAll();
      _mgr("logger")?.debug?.(`Plugins initialized: ${results.filter((r) => r.success).length}/${results.length}`);
      _bootMetrics?.endPhase?.(BOOT_PHASES.PLUGINS);
    },
    async reboot(options2 = {}) {
      const { preserveState = false } = options2;
      _mgr("logger")?.debug?.("Rebooting...", { preserveState });
      await _mgr("lifecycleHooks")?.execute?.(HOOKS.BEFORE_SHUTDOWN, {});
      _eventBus?.emit?.(BOOTSTRAP_EVENT_NAMES.REBOOTING, { preserveState });
      try {
        _mgr("performanceMonitor")?.stop?.();
        _mgr("eventRecorder")?.stop?.();
        _mgr("networkManager")?.stopMonitoring?.();
        if (_kernel) await _kernel.reset({ preserveSlots: preserveState, clearMetrics: !preserveState });
        _mgr("performanceMonitor")?.start?.();
        if (config.enableEventRecorder) _mgr("eventRecorder")?.start?.();
        if (config.enableNetworkManager) _mgr("networkManager")?.startMonitoring?.();
        _setState(BOOTSTRAP_STATES.RUNNING);
        _eventBus?.emit?.(BOOTSTRAP_EVENT_NAMES.REBOOTED, {});
      } catch (error) {
        _handleError(error, "reboot");
        _setState(BOOTSTRAP_STATES.ERROR);
        throw error;
      }
      return this;
    },
    async shutdown() {
      if (_state === BOOTSTRAP_STATES.SHUTDOWN) return this;
      _mgr("logger")?.debug?.("Shutting down...");
      await _mgr("lifecycleHooks")?.execute?.(HOOKS.BEFORE_SHUTDOWN, {});
      _eventBus?.emit?.(BOOTSTRAP_EVENT_NAMES.SHUTTING_DOWN, {});
      try {
        managers.destroyAll();
        GlobalStateAdapter.cleanup();
        if (_kernel) {
          await _kernel.destroy();
          _kernel = null;
        }
        await _mgr("lifecycleHooks")?.execute?.(HOOKS.AFTER_SHUTDOWN, {});
        _setState(BOOTSTRAP_STATES.SHUTDOWN);
        _eventBus?.emit?.(BOOTSTRAP_EVENT_NAMES.SHUTDOWN, {});
        _eventBus = null;
        if (typeof window !== "undefined") {
          window.CMBootstrap = null;
          window.ContainerMain = null;
        }
      } catch (error) {
        _handleError(error, "shutdown");
        throw error;
      }
      return this;
    },
    pause() {
      _kernel?.pause?.();
      _mgr("performanceMonitor")?.pause?.();
      _mgr("requestQueue")?.pause?.();
      _mgr("eventRecorder")?.pause?.();
      _mgr("networkManager")?.stopMonitoring?.();
      _eventBus?.emit?.(BOOTSTRAP_EVENT_NAMES.PAUSED, {});
      return this;
    },
    resume() {
      _kernel?.resume?.();
      _mgr("performanceMonitor")?.resume?.();
      _mgr("requestQueue")?.resume?.();
      _mgr("eventRecorder")?.resume?.();
      _mgr("networkManager")?.startMonitoring?.();
      _eventBus?.emit?.(BOOTSTRAP_EVENT_NAMES.RESUMED, {});
      return this;
    },
    getState: () => _state,
    getKernel: () => _kernel,
    getEventBus: () => _eventBus,
    getEventBusAdapter: () => _mgr("eventBusAdapter"),
    getManager: (name) => _kernel?.getManager?.(name) ?? null,
    getBootMetrics: () => _bootMetrics,
    getErrors: () => [..._errors],
    getLogger: () => _mgr("logger"),
    getGlobalState: () => GlobalStateAdapter,
    getConfig: () => ({ ...config }),
    getPerformanceMonitor: () => _mgr("performanceMonitor"),
    getFallbackSystem: () => _mgr("fallbackSystem"),
    getPluginSystem: () => _mgr("pluginSystem"),
    getLifecycleHooks: () => _mgr("lifecycleHooks"),
    getStateSnapshots: () => _mgr("stateSnapshots"),
    getDebugMode: () => _mgr("debugMode"),
    getConfigPersistence: () => _mgr("configPersistence"),
    getSlotPresets: () => _mgr("slotPresets"),
    getSanitizer: () => _mgr("sanitizer"),
    getRateLimiter: () => _mgr("rateLimiter"),
    getDevToolsPanel: () => _mgr("devToolsPanel"),
    getWorkerManager: () => _mgr("workerManager"),
    getConsoleCommands: () => _mgr("consoleCommands"),
    getTelemetryDashboard: () => _mgr("telemetryDashboard"),
    getRequestQueue: () => _mgr("requestQueue"),
    getCacheManager: () => _mgr("cacheManager"),
    getEventRecorder: () => _mgr("eventRecorder"),
    getNotificationManager: () => _mgr("notificationManager"),
    getFormValidator: () => _mgr("formValidator"),
    getStorageManager: () => _mgr("storageManager"),
    getClipboardManager: () => _mgr("clipboardManager"),
    getDragDropManager: () => _mgr("dragDropManager"),
    getModalManager: () => _mgr("modalManager"),
    getTooltipManager: () => _mgr("tooltipManager"),
    getContextMenuManager: () => _mgr("contextMenuManager"),
    getHotkeyManager: () => _mgr("hotkeyManager"),
    getScrollManager: () => _mgr("scrollManager"),
    getFocusManager: () => _mgr("focusManager"),
    getUndoManager: () => _mgr("undoManager"),
    getThemeManager: () => _mgr("themeManager"),
    getAnimationManager: () => _mgr("animationManager"),
    getMediaQueryManager: () => _mgr("mediaQueryManager"),
    getIntersectionManager: () => _mgr("intersectionManager"),
    getResizeManager: () => _mgr("resizeManager"),
    getMutationManager: () => _mgr("mutationManager"),
    getPermissionManager: () => _mgr("permissionManager"),
    getNetworkManager: () => _mgr("networkManager"),
    getGeolocationManager: () => _mgr("geolocationManager"),
    getDeviceManager: () => _mgr("deviceManager"),
    getBatteryManager: () => _mgr("batteryManager"),
    getFullscreenManager: () => _mgr("fullscreenManager"),
    getVisibilityManager: () => _mgr("visibilityManager"),
    getWakeLockManager: () => _mgr("wakeLockManager"),
    getShareManager: () => _mgr("shareManager"),
    getPanelTransitions,
    getContainerStatePersistence,
    getPerformanceAPI,
    getSkeletonManager,
    getUpdateNotifier,
    getNavigationHistory,
    getLoadingProgress,
    getSplitViewManager,
    getExportContentManager,
    getOfflineModeManager,
    getAccessibilityManager,
    getKeyboardNavigationManager,
    getZoomManager,
    getPrintManager,
    getPanelBookmarksManager,
    getCommandPaletteManager,
    getPanelSearchManager,
    getPanelTabsManager,
    getQuickActionsManager,
    getTourManager,
    registerPlugin: (plugin) => _mgr("pluginSystem")?.register?.(plugin),
    onBeforeBoot: (handler, opts) => _mgr("lifecycleHooks")?.beforeBoot?.(handler, opts),
    onAfterBoot: (handler, opts) => _mgr("lifecycleHooks")?.afterBoot?.(handler, opts),
    onBeforeShutdown: (handler, opts) => _mgr("lifecycleHooks")?.beforeShutdown?.(handler, opts),
    onStateChange: (handler, opts) => _mgr("lifecycleHooks")?.onStateChange?.(handler, opts),
    onError: (handler, opts) => _mgr("lifecycleHooks")?.onError?.(handler, opts),
    get convenience() {
      if (!_convenienceMethods) _createHelpers();
      return _convenienceMethods;
    },
    async healthCheck() {
      if (!_healthReporter) _createHelpers();
      return _healthReporter.healthCheck();
    },
    info() {
      if (!_healthReporter) _createHelpers();
      return _healthReporter.info();
    }
  };
  return new Proxy(bootstrap, {
    get(target, prop) {
      const propStr = String(prop);
      if (propStr in target) return target[propStr];
      if (_convenienceMethods && propStr in _convenienceMethods) return _convenienceMethods[propStr];
      if (!_convenienceMethods) {
        _createHelpers();
        if (_convenienceMethods && propStr in _convenienceMethods) return _convenienceMethods[propStr];
      }
      return void 0;
    }
  });
}
function getBootstrap(options = {}) {
  if (!_instance) _instance = createBootstrap(options);
  return _instance;
}
function resetBootstrap() {
  if (_instance) {
    _instance.shutdown().catch(function(err) {
      console.error("[bootstrap-integration] shutdown failed:", err?.message || err);
    });
    _instance = null;
  }
}
async function boot(container = null, options = {}) {
  return getBootstrap(options).boot(container);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modular: true, exports: ["createBootstrap", "getBootstrap", "boot"], states: Object.keys(BOOTSTRAP_STATES), sprint1: true, sprint2: true, sprint3: true, sprint4: true, sprint5: true, sprint6: true };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var bootstrap_integration_default = { VERSION, MODULE_ID, BOOTSTRAP_STATES, createBootstrap, getBootstrap, resetBootstrap, boot, info, healthCheck };
export {
  BOOTSTRAP_STATES,
  MODULE_ID,
  VERSION,
  boot,
  createBootstrap,
  bootstrap_integration_default as default,
  getBootstrap,
  healthCheck,
  info,
  resetBootstrap
};
