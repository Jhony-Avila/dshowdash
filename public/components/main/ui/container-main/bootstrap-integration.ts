
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (14.2.0-TOUR-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: bootstrap-integration
// PURPOSE: Bootstrap Integration - Orquestrador de inicialização integrada
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createAdaptiveKernel from ./adaptive-kernel.js
//   initComponents, initComponentsAsync from ./init-components.js
//   getEventBus from ./core/event-bridge.js
//   LIMITS from ./config.js
//   validateObject from ./utils/validator.js
//   registerLoaded from ./core/dependency-map.js
//   HOOKS from ./core/lifecycle-hooks.js
//   PLUGIN_HOOKS from ./core/plugin-system.js
//   BOOT_PHASES, createBootMetrics from ./core/boot-metrics.js
//   getEnv, ENV from ./config.js
//   BOOTSTRAP_EVENT_NAMES, KERNEL_UI_EVENT_NAMES from /core/runtime/constants/eve...
//   createPanelTransitions, getPanelTransitions, TRANSITION_TYPES from ./utils/pa...
//   createContainerStatePersistence, getContainerStatePersistence from ./utils/co...
//   createPerformanceAPI, getPerformanceAPI from ./utils/performance-api/index.js
//   createSkeletonManager, getSkeletonManager, showSkeleton, hideSkeleton, showSk...
//   createUpdateNotifier, getUpdateNotifier, checkForUpdates, hasUpdate, NOTIFIER...
//   createNavigationHistory, getNavigationHistory, pushNavigation, goBack, goForw...
//   createLoadingProgress, getLoadingProgress, startLoading, doneLoading, setLoad...
//   createSplitViewManager, getSplitViewManager, SPLIT_ORIENTATIONS, SPLIT_POSITI...
//   createExportContentManager, getExportContentManager, exportToPNG, exportToJPE...
//   createOfflineModeManager, getOfflineModeManager, cachedFetch, cacheUrl, getCa...
//   createAccessibilityManager, getAccessibilityManager, announce, setFocus, trap...
//   createKeyboardNavigationManager, getKeyboardNavigationManager, registerGroup,...
//   createZoomManager, getZoomManager, setZoom, zoomIn, zoomOut, zoomToFit, zoomT...
//   createPrintManager, getPrintManager, printFn: print, printElement, printPreview, addPa...
//   createPanelBookmarksManager, getPanelBookmarksManager, addBookmark, removeBoo...
//   createCommandPaletteManager, getCommandPaletteManager, registerCommand, regis...
//   createPanelSearchManager, getPanelSearchManager, search, nextMatch, previousM...
//   createPanelTabsManager, getPanelTabsManager, addTab, closeTab, activateTab, T...
//   createQuickActionsManager, getQuickActionsManager, addAction, removeAction, F...
//   createTourManager, getTourManager, registerTour, startTour, endTour, TOUR_STA...
//   VERSION as BASE_VERSION, MODULE_ID, BOOTSTRAP_STATES, CONFIG_SCHEMA, DEFAULT_...
//   GlobalStateAdapter from ./adapters/global-state-adapter.js
//
// PROVIDES:
//   VERSION — module constant
//   createBootstrap() — exported function
//   getBootstrap() — exported function
//   resetBootstrap() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   BOOTSTRAP_STATES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   BOOTSTRAP_EVENT_NAMES.ERROR
//   BOOTSTRAP_EVENT_NAMES.MEMORY_CRITICAL
//   BOOTSTRAP_EVENT_NAMES.MEMORY_WARNING
//   BOOTSTRAP_EVENT_NAMES.PAUSED
//   BOOTSTRAP_EVENT_NAMES.READY
//   BOOTSTRAP_EVENT_NAMES.REBOOTED
//   BOOTSTRAP_EVENT_NAMES.REBOOTING
//   BOOTSTRAP_EVENT_NAMES.RESUMED
//   BOOTSTRAP_EVENT_NAMES.SHUTDOWN
//   BOOTSTRAP_EVENT_NAMES.SHUTTING_DOWN
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.CMBootstrap
//   window.ContainerMain
// ═══════════════════════════════════════════════════════════════
// @version 14.2.0-TOUR-IMPORT-FIX
// @changelog v14.2.0-TOUR-IMPORT-FIX - Fixed TOUR_STATES import: was aliased as TOUR_TOOLTIP_POSITIONS causing ReferenceError
// @changelog v14.1.0-LOG-AAA - Log verbosity reduction
'use strict';

declare global { interface Window { CMBootstrap: unknown; ContainerMain: unknown; } }
import { createAdaptiveKernel } from './adaptive-kernel.js';
import { initComponents, initComponentsAsync } from './init-components.js';
import { getEventBus } from './core/event-bridge.js';
import { LIMITS } from './config.js';
import { validateObject } from './utils/validator.js';
import { registerLoaded } from './core/dependency-map.js';
import { HOOKS } from './core/lifecycle-hooks.js';
import { PLUGIN_HOOKS } from './core/plugin-system.js';
import { BOOT_PHASES, createBootMetrics } from './core/boot-metrics.js';
import GlobalStateAdapter from './adapters/global-state-adapter.js';
import { getEnv, ENV } from './config.js';
import { BOOTSTRAP_EVENT_NAMES, KERNEL_UI_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

import { createPanelTransitions, getPanelTransitions, TRANSITION_TYPES } from './utils/panel-transitions.js';
import { createContainerStatePersistence, getContainerStatePersistence } from './utils/container-state-persistence.js';
import { createPerformanceAPI, getPerformanceAPI } from './utils/performance-api/index.js';

import { createSkeletonManager, getSkeletonManager, showSkeleton, hideSkeleton, showSkeletonForPanel, SKELETON_TYPES, DELAY_VARIANTS } from './utils/skeleton-manager.js';
import { createUpdateNotifier, getUpdateNotifier, checkForUpdates, hasUpdate, NOTIFIER_STATES, UPDATE_TYPES } from './utils/update-notifier/index.js';

import { createNavigationHistory, getNavigationHistory, pushNavigation, goBack, goForward, canGoBack, canGoForward, NAVIGATION_TYPES } from './utils/navigation-history/index.js';
import { createLoadingProgress, getLoadingProgress, startLoading, doneLoading, setLoadingProgress, isLoading, LOADING_STATES } from './utils/loading-progress/index.js';

import { createSplitViewManager, getSplitViewManager, SPLIT_ORIENTATIONS, SPLIT_POSITIONS } from './utils/split-view-manager/index.js';
import { createExportContentManager, getExportContentManager, exportToPNG, exportToJPEG, exportToPDF, exportToSVG, exportElement, EXPORT_FORMATS, EXPORT_QUALITY } from './utils/export-content-manager/index.js';
import { createOfflineModeManager, getOfflineModeManager, cachedFetch, cacheUrl, getCached, clearCache, getCacheSize, queueRequest, OFFLINE_STATES, CACHE_STRATEGIES } from './utils/offline-mode-manager/index.js';

import { createAccessibilityManager, getAccessibilityManager, announce, setFocus, trapFocus, setContrastMode, setTextScale, enableFeature as enableA11yFeature, A11Y_FEATURES, ARIA_LIVE_REGIONS, CONTRAST_MODES } from './utils/accessibility-manager/index.js';
import { createKeyboardNavigationManager, getKeyboardNavigationManager, registerGroup, unregisterGroup, focusFirst, focusLast, focusNext, focusPrevious, registerShortcut, unregisterShortcut, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP } from './utils/keyboard-navigation-manager/index.js';
import { createZoomManager, getZoomManager, setZoom, zoomIn, zoomOut, zoomToFit, zoomToActual, resetZoom, ZOOM_PRESETS, ZOOM_ORIGINS } from './utils/zoom-manager.js';
import { createPrintManager, getPrintManager, print, printElement, printPreview, addPageBreak, markAvoidBreak, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES } from './utils/print-manager/index.js';
import { createPanelBookmarksManager, getPanelBookmarksManager, addBookmark, removeBookmark, getAllBookmarks, isBookmarked, navigateToBookmark, getRecentPanels, getMostFrequent, BOOKMARK_TYPES, SORT_MODES } from './utils/panel-bookmarks-manager/index.js';

import { createCommandPaletteManager, getCommandPaletteManager, registerCommand, registerCommands, COMMAND_TYPES, PALETTE_MODES } from './utils/command-palette-manager/index.js';
import { createPanelSearchManager, getPanelSearchManager, search, nextMatch, previousMatch, clearSearch, SEARCH_MODES, MATCH_TYPES } from './utils/panel-search-manager/index.js';
import { createPanelTabsManager, getPanelTabsManager, addTab, closeTab, activateTab, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS } from './utils/panel-tabs-manager/index.js';
import { createQuickActionsManager, getQuickActionsManager, addAction, removeAction, FAB_POSITIONS, MENU_DIRECTIONS, ACTION_TYPES } from './utils/quick-actions-manager.js';
// v14.2.0-TOUR-IMPORT-FIX: Import TOUR_STATES directly (was incorrectly aliased as TOUR_TOOLTIP_POSITIONS)
import { createTourManager, getTourManager, registerTour, startTour, endTour, TOUR_STATES } from './utils/tour-manager.js';
// Backward compat: TOUR_TOOLTIP_POSITIONS is an alias for TOUR_STATES (no separate export exists in tour-manager.js)
const TOUR_TOOLTIP_POSITIONS = TOUR_STATES;

import {
  VERSION as BASE_VERSION, MODULE_ID, BOOTSTRAP_STATES, CONFIG_SCHEMA, DEFAULT_CONFIG,
  createManagerRegistry,
  initPhase1, initPhase2, initPhase3, initPhase4, initPhase5, initPhase6, initPhase7,
  createHealthReporter,
  createGetters,
  createConvenienceMethods
} from './bootstrap-integration/index.js';

export const VERSION = '14.2.0-TOUR-IMPORT-FIX';
export { MODULE_ID, BOOTSTRAP_STATES };

let _instance: Record<string, unknown> | null = null;

export function createBootstrap(options = {}) {
  const validationResult = validateObject(options, CONFIG_SCHEMA, { allowUnknown: true });
  const config = { ...DEFAULT_CONFIG, ...validationResult.value };
  
  interface BootManagerRef {
    [key: string]: ((...args: unknown[]) => unknown) | unknown;
  }

  let _state: string = BOOTSTRAP_STATES.IDLE;
  let _kernel: BootManagerRef | null = null;
  let _eventBus: BootManagerRef | null = null;
  let _container: HTMLElement | null = null;
  let _bootMetrics: BootManagerRef | null = null;
  let _errors: unknown[] = [];

  const managers = createManagerRegistry();
  let _healthReporter: BootManagerRef | null = null;
  let _convenienceMethods: Record<string, unknown> | null = null;

  function _mgr(name: string): BootManagerRef | null {
    return managers.get(name) as BootManagerRef | null;
  }

  function _setState(newState: string) {
    const oldState = _state;
    _state = newState;
    (_mgr('logger')?.debug as ((...a: unknown[]) => void) | undefined)?.(`State: ${oldState} -> ${newState}`);
    (_bootMetrics?.milestone as ((...a: unknown[]) => void) | undefined)?.(`state_${newState}`);
    config.onStateChange?.(newState, oldState);
    (_eventBus?.emit as ((...a: unknown[]) => void) | undefined)?.(BOOTSTRAP_EVENT_NAMES.STATE_CHANGED, { state: newState, previousState: oldState });
  }

  function _handleError(error: unknown, context: string | Record<string, unknown>) {
    const errorRecord = { message: (error as Record<string, unknown>)?.message || error, context, timestamp: Date.now() };
    _errors.push(errorRecord);
    if (_errors.length > LIMITS.MAX_ERROR_LOG) _errors.shift();
    (_mgr('logger')?.error as ((...a: unknown[]) => void) | undefined)?.(`Error in ${context}:`, error);
    (_bootMetrics?.recordError as ((...a: unknown[]) => void) | undefined)?.(context, error);
    config.onError?.(error, context);
    (_eventBus?.emit as ((...a: unknown[]) => void) | undefined)?.(BOOTSTRAP_EVENT_NAMES.ERROR, errorRecord);
  }

  function _createHelpers() {
    const ctx: Record<string, unknown> = { managers, getState: () => _state, kernel: _kernel, eventBus: _eventBus, bootMetrics: _bootMetrics, errors: _errors, config };
    _healthReporter = createHealthReporter(ctx) as BootManagerRef;
    _convenienceMethods = createConvenienceMethods({ managers, kernel: _kernel }) as Record<string, unknown>;
  }

  function _exposeGlobals(bootstrapInstance: unknown) {
    if (typeof window !== 'undefined') {
      window.CMBootstrap = bootstrapInstance;
      window.ContainerMain = {
        element: _container,
        contentElement: _container?.querySelector?.('.dsd-container__content') || _container,
        id: 'container-main',
        mode: 'bootstrap',
        version: VERSION,
        
        mount: () => {},
        unmount: () => {},
        getElement: () => _container,
        getContentElement: () => _container?.querySelector?.('.dsd-container__content') || _container,
        getBootstrap: () => bootstrapInstance,
        isBootstrapped: () => true,
        
        createPanelTransitions, getPanelTransitions, TRANSITION_TYPES,
        createContainerStatePersistence, getContainerStatePersistence,
        createPerformanceAPI, getPerformanceAPI,
        
        createSkeletonManager, getSkeletonManager, showSkeleton, hideSkeleton, showSkeletonForPanel, SKELETON_TYPES, DELAY_VARIANTS,
        createUpdateNotifier, getUpdateNotifier, checkForUpdates, hasUpdate, NOTIFIER_STATES, UPDATE_TYPES,
        
        createNavigationHistory, getNavigationHistory, pushNavigation, goBack, goForward, canGoBack, canGoForward, NAVIGATION_TYPES,
        createLoadingProgress, getLoadingProgress, startLoading, doneLoading, setLoadingProgress, isLoading, LOADING_STATES,
        
        createSplitViewManager, getSplitViewManager, SPLIT_ORIENTATIONS, SPLIT_POSITIONS,
        createExportContentManager, getExportContentManager, exportToPNG, exportToJPEG, exportToPDF, exportToSVG, exportElement, EXPORT_FORMATS, EXPORT_QUALITY,
        createOfflineModeManager, getOfflineModeManager, cachedFetch, cacheUrl, getCached, clearCache, getCacheSize, queueRequest, OFFLINE_STATES, CACHE_STRATEGIES,
        
        createAccessibilityManager, getAccessibilityManager, announce, setFocus, trapFocus, setContrastMode, setTextScale, enableA11yFeature, A11Y_FEATURES, ARIA_LIVE_REGIONS, CONTRAST_MODES,
        createKeyboardNavigationManager, getKeyboardNavigationManager, registerGroup, unregisterGroup, focusFirst, focusLast, focusNext, focusPrevious, registerShortcut, unregisterShortcut, KEY_CODES, NAVIGATION_MODES, FOCUS_WRAP,
        createZoomManager, getZoomManager, setZoom, zoomIn, zoomOut, zoomToFit, zoomToActual, resetZoom, ZOOM_PRESETS, ZOOM_ORIGINS,
        createPrintManager, getPrintManager, printFn: print, printElement, printPreview, addPageBreak, markAvoidBreak, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES,
        createPanelBookmarksManager, getPanelBookmarksManager, addBookmark, removeBookmark, getAllBookmarks, isBookmarked, navigateToBookmark, getRecentPanels, getMostFrequent, BOOKMARK_TYPES, SORT_MODES,
        
        createCommandPaletteManager, getCommandPaletteManager, registerCommand, registerCommands, COMMAND_TYPES, PALETTE_MODES,
        createPanelSearchManager, getPanelSearchManager, search, nextMatch, previousMatch, clearSearch, SEARCH_MODES, MATCH_TYPES,
        createPanelTabsManager, getPanelTabsManager, addTab, closeTab, activateTab, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS,
        createQuickActionsManager, getQuickActionsManager, addAction, removeAction, FAB_POSITIONS, MENU_DIRECTIONS, ACTION_TYPES,
        createTourManager, getTourManager, registerTour, startTour, endTour, TOUR_STATES, TOUR_TOOLTIP_POSITIONS,
        
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
        print: { create: createPrintManager, get: getPrintManager, print: print as any, element: printElement, preview: printPreview, addBreak: addPageBreak, avoidBreak: markAvoidBreak, ORIENTATIONS: PRINT_ORIENTATIONS, SIZES: PRINT_SIZES, BREAKS: PAGE_BREAK_MODES },
        bookmarks: { create: createPanelBookmarksManager, get: getPanelBookmarksManager, add: addBookmark, remove: removeBookmark, getAll: getAllBookmarks, isBookmarked, navigate: navigateToBookmark, getRecent: getRecentPanels, getMostFrequent, TYPES: BOOKMARK_TYPES, SORT: SORT_MODES },
        
        commandPalette: { create: createCommandPaletteManager, get: getCommandPaletteManager, register: registerCommand, registerMany: registerCommands, TYPES: COMMAND_TYPES, MODES: PALETTE_MODES },
        panelSearch: { create: createPanelSearchManager, get: getPanelSearchManager, search, next: nextMatch, prev: previousMatch, clear: clearSearch, MODES: SEARCH_MODES, MATCH: MATCH_TYPES },
        panelTabs: { create: createPanelTabsManager, get: getPanelTabsManager, add: addTab, close: closeTab, activate: activateTab, STATES: TAB_STATES, POSITIONS: TAB_POSITIONS, CLOSE: CLOSE_BEHAVIORS },
        quickActions: { create: createQuickActionsManager, get: getQuickActionsManager, add: addAction, remove: removeAction, POSITIONS: FAB_POSITIONS, DIRECTIONS: MENU_DIRECTIONS, TYPES: ACTION_TYPES },
        tour: { create: createTourManager, get: getTourManager, register: registerTour, start: startTour, end: endTour, STATES: TOUR_STATES, TOOLTIP: TOUR_TOOLTIP_POSITIONS },
        
        info: () => ({
          version: VERSION, moduleId: MODULE_ID,
          sprint1Modules: ['PanelTransitions', 'ContainerStatePersistence', 'PerformanceAPI'],
          sprint2Modules: ['SkeletonManager', 'UpdateNotifier'],
          sprint3Modules: ['NavigationHistory', 'LoadingProgress'],
          sprint4Modules: ['SplitViewManager', 'ExportContentManager', 'OfflineModeManager'],
          sprint5Modules: ['AccessibilityManager', 'KeyboardNavigationManager', 'ZoomManager', 'PrintManager', 'PanelBookmarksManager'],
          sprint6Modules: ['CommandPaletteManager', 'PanelSearchManager', 'PanelTabsManager', 'QuickActionsManager', 'TourManager'],
          totalModules: 20, isBootstrapped: true
        })
      };
      (_mgr('logger')?.debug as ((...a: unknown[]) => void) | undefined)?.('Globals exposed: window.CMBootstrap, window.ContainerMain (with Sprint 1-6 modules)');
    }
  }

  const bootstrap = {
    async boot(container: HTMLElement | null = null) {
      if (_state !== BOOTSTRAP_STATES.IDLE && _state !== BOOTSTRAP_STATES.SHUTDOWN) {
        (_mgr('logger')?.warn as ((...a: unknown[]) => void) | undefined)?.('Already booted');
        return this;
      }
      _container = container;

      if (config.enableBootMetrics) {
        _bootMetrics = createBootMetrics({ debug: (getEnv() as string) === ENV.DEVELOPMENT }) as BootManagerRef;
        (_bootMetrics.start as () => void)();
        registerLoaded('boot-metrics');
      }

      _setState(BOOTSTRAP_STATES.BOOTING);

      try {
        (_bootMetrics?.startPhase as ((...a: unknown[]) => void) | undefined)?.(BOOT_PHASES.EVENTBUS);
        _eventBus = getEventBus({}) as BootManagerRef;
        (_eventBus.emit as (...a: unknown[]) => void)(BOOTSTRAP_EVENT_NAMES.STARTING, { version: VERSION });
        registerLoaded('event-bridge');
        (_bootMetrics?.endPhase as ((...a: unknown[]) => void) | undefined)?.(BOOT_PHASES.EVENTBUS);

        const phaseContext: Record<string, unknown> = { config, eventBus: _eventBus, bootMetrics: _bootMetrics, managers };

        const { logger } = await initPhase1(phaseContext) as Record<string, unknown>;
        (phaseContext as Record<string, unknown>).logger = logger;
        _setState(BOOTSTRAP_STATES.PHASE1_READY);

        await initPhase2(phaseContext); _setState(BOOTSTRAP_STATES.PHASE2_READY);
        await initPhase3(phaseContext); _setState(BOOTSTRAP_STATES.PHASE3_READY);
        await initPhase4(phaseContext); _setState(BOOTSTRAP_STATES.PHASE4_READY);
        await initPhase5(phaseContext); _setState(BOOTSTRAP_STATES.PHASE5_READY);
        await initPhase6(phaseContext); _setState(BOOTSTRAP_STATES.PHASE6_READY);
        await initPhase7(phaseContext); _setState(BOOTSTRAP_STATES.PHASE7_READY);

        (_mgr('debugMode')?.inject as ((...a: unknown[]) => void) | undefined)?.({ eventBus: _eventBus, bootstrap: this });
        (_mgr('stateSnapshots')?.inject as ((...a: unknown[]) => void) | undefined)?.({ bootstrap: this, eventBus: _eventBus });
        (_mgr('devToolsPanel')?.inject as ((...a: unknown[]) => void) | undefined)?.({ bootstrap: this, eventBus: _eventBus });
        (_mgr('consoleCommands')?.inject as ((...a: unknown[]) => void) | undefined)?.({ bootstrap: this, eventBus: _eventBus });
        (_mgr('telemetryDashboard')?.inject as ((...a: unknown[]) => void) | undefined)?.({ bootstrap: this, eventBus: _eventBus });
        (_mgr('eventRecorder')?.inject as ((...a: unknown[]) => void) | undefined)?.({ eventBus: _eventBus });

        (_bootMetrics?.startPhase as ((...a: unknown[]) => void) | undefined)?.(BOOT_PHASES.KERNEL);
        _kernel = createAdaptiveKernel({
          container: _container, eventBus: _eventBus,
          cleanupStrategy: config.cleanupStrategy,
          memoryWarningThreshold: config.memoryWarningThreshold,
          memoryCriticalThreshold: config.memoryCriticalThreshold,
          maxConcurrentLoads: config.maxConcurrentLoads,
          enableMetricsPersistence: config.enableMetricsPersistence,
          enableImageVirtualization: config.enableImageVirtualization,
          enableDeprecationWarnings: config.enableDeprecationWarnings,
          onStateChange: (state: unknown, prev: unknown) => { ((logger as BootManagerRef | null)?.debug as ((...a: unknown[]) => void) | undefined)?.(`Kernel: ${prev} -> ${state}`); (_eventBus!.emit as (...a: unknown[]) => void)(KERNEL_UI_EVENT_NAMES.STATE_CHANGED, { state, previousState: prev }); },
          onError: (error: unknown, ctx: unknown) => _handleError(error, `kernel:${ctx}`),
          onMemoryWarning: () => { ((logger as BootManagerRef | null)?.warn as ((...a: unknown[]) => void) | undefined)?.('Memory warning!'); (_eventBus!.emit as (...a: unknown[]) => void)(BOOTSTRAP_EVENT_NAMES.MEMORY_WARNING, {}); },
          onMemoryCritical: () => { ((logger as BootManagerRef | null)?.error as ((...a: unknown[]) => void) | undefined)?.('Memory critical!'); (_eventBus!.emit as (...a: unknown[]) => void)(BOOTSTRAP_EVENT_NAMES.MEMORY_CRITICAL, {}); }
        }) as BootManagerRef;
        await (_kernel.init as () => Promise<unknown>)();
        (_bootMetrics?.endPhase as ((...a: unknown[]) => void) | undefined)?.(BOOT_PHASES.KERNEL);
        _setState(BOOTSTRAP_STATES.KERNEL_READY);
        registerLoaded('adaptive-kernel');

        await (_mgr('lifecycleHooks')?.execute as ((...a: unknown[]) => Promise<void>) | undefined)?.(HOOKS.AFTER_KERNEL_INIT, { kernel: _kernel });

        (_bootMetrics?.startPhase as ((...a: unknown[]) => void) | undefined)?.(BOOT_PHASES.COMPONENTS);
        const componentOptions: Record<string, unknown> = { eventBus: _eventBus, lifecycleGuard: (_kernel.getManager as (...a: unknown[]) => unknown)?.('lifecycle'), metricsPersistence: (_kernel.getManager as (...a: unknown[]) => unknown)?.('metrics'), enableLazyLoading: config.enableLazyLoading };
        if (config.waitForLazyComponents) { await initComponentsAsync(componentOptions); } else { await initComponents(componentOptions); }
        (_bootMetrics?.endPhase as ((...a: unknown[]) => void) | undefined)?.(BOOT_PHASES.COMPONENTS);
        _setState(BOOTSTRAP_STATES.COMPONENTS_READY);
        registerLoaded('init-components');

        await this._initPlugins();
        _setState(BOOTSTRAP_STATES.PLUGINS_READY);

        if (config.autoStart) {
          (_kernel.start as () => void)();
          (_mgr('performanceMonitor')?.start as (() => void) | undefined)?.();
          if (_mgr('eventRecorder') && config.enableEventRecorder) (_mgr('eventRecorder')!.start as () => void)();
          if (_mgr('networkManager') && config.enableNetworkManager) (_mgr('networkManager')!.startMonitoring as () => void)();
        }

        (_bootMetrics?.end as (() => void) | undefined)?.();
        _setState(BOOTSTRAP_STATES.RUNNING);

        _exposeGlobals(this);

        await (_mgr('lifecycleHooks')?.execute as ((...a: unknown[]) => Promise<void>) | undefined)?.(HOOKS.AFTER_BOOT, { bootstrap: this });
        await (_mgr('pluginSystem')?.executeHook as ((...a: unknown[]) => Promise<void>) | undefined)?.(PLUGIN_HOOKS.AFTER_BOOT, { bootstrap: this });

        if (_mgr('stateSnapshots')) (_mgr('stateSnapshots')!.create as (...a: unknown[]) => void)('boot-complete', 'auto', { event: 'boot' });

        _createHelpers();

        (_eventBus!.emit as (...a: unknown[]) => void)(BOOTSTRAP_EVENT_NAMES.READY, { bootTime: (_bootMetrics?.getTotalTime as (() => number) | undefined)?.(), metrics: (_bootMetrics?.getReport as (() => unknown) | undefined)?.() });
        config.onReady?.(this);
        registerLoaded('bootstrap-integration');

        if ((getEnv() as string) !== ENV.PRODUCTION && _bootMetrics) (_bootMetrics.logReport as () => void)();
        ((logger as BootManagerRef | null)?.info as ((...a: unknown[]) => void) | undefined)?.(`Bootstrap complete in ${(_bootMetrics?.getTotalTime as (() => number) | undefined)?.()?.toFixed?.(2) || 'N/A'}ms`);

      } catch (error) {
        _handleError(error, 'boot');
        _setState(BOOTSTRAP_STATES.ERROR);
        throw error;
      }
      
      return this;
    },

    async _initPlugins() {
      const pluginSystem = _mgr('pluginSystem');
      const lifecycleHooks = _mgr('lifecycleHooks');
      if (!config.enablePlugins || !pluginSystem) return;

      (_bootMetrics?.startPhase as ((...a: unknown[]) => void) | undefined)?.(BOOT_PHASES.PLUGINS);
      if (config.plugins?.length > 0) { for (const plugin of config.plugins) (pluginSystem.register as (...a: unknown[]) => void)(plugin); }
      (pluginSystem.setContext as (...a: unknown[]) => void)({ bootstrap: this, kernel: _kernel, eventBus: _eventBus, logger: _mgr('logger') });
      await (lifecycleHooks?.execute as ((...a: unknown[]) => Promise<void>) | undefined)?.(HOOKS.BEFORE_BOOT, { config });
      await (pluginSystem.executeHook as (...a: unknown[]) => Promise<void>)(PLUGIN_HOOKS.BEFORE_BOOT, { config });
      const results = await (pluginSystem.initAll as () => Promise<Array<Record<string, unknown>>>)();
      (_mgr('logger')?.debug as ((...a: unknown[]) => void) | undefined)?.(`Plugins initialized: ${results.filter((r: Record<string, unknown>) => r.success).length}/${results.length}`);
      (_bootMetrics?.endPhase as ((...a: unknown[]) => void) | undefined)?.(BOOT_PHASES.PLUGINS);
    },

    async reboot(options: Record<string, unknown> = {}) {
      const { preserveState = false } = options;
      (_mgr('logger')?.debug as ((...a: unknown[]) => void) | undefined)?.('Rebooting...', { preserveState });
      await (_mgr('lifecycleHooks')?.execute as ((...a: unknown[]) => Promise<void>) | undefined)?.(HOOKS.BEFORE_SHUTDOWN, {});
      (_eventBus?.emit as ((...a: unknown[]) => void) | undefined)?.(BOOTSTRAP_EVENT_NAMES.REBOOTING, { preserveState });
      try {
        (_mgr('performanceMonitor')?.stop as (() => void) | undefined)?.();
        (_mgr('eventRecorder')?.stop as (() => void) | undefined)?.();
        (_mgr('networkManager')?.stopMonitoring as (() => void) | undefined)?.();
        if (_kernel) await (_kernel.reset as (...a: unknown[]) => Promise<void>)({ preserveSlots: preserveState, clearMetrics: !preserveState });
        (_mgr('performanceMonitor')?.start as (() => void) | undefined)?.();
        if (config.enableEventRecorder) (_mgr('eventRecorder')?.start as (() => void) | undefined)?.();
        if (config.enableNetworkManager) (_mgr('networkManager')?.startMonitoring as (() => void) | undefined)?.();
        _setState(BOOTSTRAP_STATES.RUNNING);
        (_eventBus?.emit as ((...a: unknown[]) => void) | undefined)?.(BOOTSTRAP_EVENT_NAMES.REBOOTED, {});
      } catch (error) { _handleError(error, 'reboot'); _setState(BOOTSTRAP_STATES.ERROR); throw error; }
      return this;
    },

    async shutdown() {
      if (_state === BOOTSTRAP_STATES.SHUTDOWN) return this;
      (_mgr('logger')?.debug as ((...a: unknown[]) => void) | undefined)?.('Shutting down...');
      await (_mgr('lifecycleHooks')?.execute as ((...a: unknown[]) => Promise<void>) | undefined)?.(HOOKS.BEFORE_SHUTDOWN, {});
      (_eventBus?.emit as ((...a: unknown[]) => void) | undefined)?.(BOOTSTRAP_EVENT_NAMES.SHUTTING_DOWN, {});
      try {
        managers.destroyAll();
        GlobalStateAdapter.cleanup();
        if (_kernel) { await (_kernel.destroy as () => Promise<void>)(); _kernel = null; }
        await (_mgr('lifecycleHooks')?.execute as ((...a: unknown[]) => Promise<void>) | undefined)?.(HOOKS.AFTER_SHUTDOWN, {});
        _setState(BOOTSTRAP_STATES.SHUTDOWN);
        (_eventBus?.emit as ((...a: unknown[]) => void) | undefined)?.(BOOTSTRAP_EVENT_NAMES.SHUTDOWN, {});
        _eventBus = null;
        if (typeof window !== 'undefined') { window.CMBootstrap = null; window.ContainerMain = null; }
      } catch (error) { _handleError(error, 'shutdown'); throw error; }
      return this;
    },

    pause() {
      (_kernel?.pause as (() => void) | undefined)?.();
      (_mgr('performanceMonitor')?.pause as (() => void) | undefined)?.();
      (_mgr('requestQueue')?.pause as (() => void) | undefined)?.();
      (_mgr('eventRecorder')?.pause as (() => void) | undefined)?.();
      (_mgr('networkManager')?.stopMonitoring as (() => void) | undefined)?.();
      (_eventBus?.emit as ((...a: unknown[]) => void) | undefined)?.(BOOTSTRAP_EVENT_NAMES.PAUSED, {});
      return this;
    },

    resume() {
      (_kernel?.resume as (() => void) | undefined)?.();
      (_mgr('performanceMonitor')?.resume as (() => void) | undefined)?.();
      (_mgr('requestQueue')?.resume as (() => void) | undefined)?.();
      (_mgr('eventRecorder')?.resume as (() => void) | undefined)?.();
      (_mgr('networkManager')?.startMonitoring as (() => void) | undefined)?.();
      (_eventBus?.emit as ((...a: unknown[]) => void) | undefined)?.(BOOTSTRAP_EVENT_NAMES.RESUMED, {});
      return this;
    },

    getState: () => _state,
    getKernel: () => _kernel,
    getEventBus: () => _eventBus,
    getEventBusAdapter: () => _mgr('eventBusAdapter'),
    getManager: (name: string) => (_kernel?.getManager as ((...a: unknown[]) => unknown) | undefined)?.(name) ?? null,
    getBootMetrics: () => _bootMetrics,
    getErrors: () => [..._errors],
    getLogger: () => _mgr('logger'),
    getGlobalState: () => GlobalStateAdapter,
    getConfig: () => ({ ...config }),

    getPerformanceMonitor: () => _mgr('performanceMonitor'),
    getFallbackSystem: () => _mgr('fallbackSystem'),
    getPluginSystem: () => _mgr('pluginSystem'),
    getLifecycleHooks: () => _mgr('lifecycleHooks'),
    getStateSnapshots: () => _mgr('stateSnapshots'),
    getDebugMode: () => _mgr('debugMode'),
    getConfigPersistence: () => _mgr('configPersistence'),
    getSlotPresets: () => _mgr('slotPresets'),
    getSanitizer: () => _mgr('sanitizer'),
    getRateLimiter: () => _mgr('rateLimiter'),
    getDevToolsPanel: () => _mgr('devToolsPanel'),
    getWorkerManager: () => _mgr('workerManager'),
    getConsoleCommands: () => _mgr('consoleCommands'),
    getTelemetryDashboard: () => _mgr('telemetryDashboard'),
    getRequestQueue: () => _mgr('requestQueue'),
    getCacheManager: () => _mgr('cacheManager'),
    getEventRecorder: () => _mgr('eventRecorder'),
    getNotificationManager: () => _mgr('notificationManager'),
    getFormValidator: () => _mgr('formValidator'),
    getStorageManager: () => _mgr('storageManager'),
    getClipboardManager: () => _mgr('clipboardManager'),
    getDragDropManager: () => _mgr('dragDropManager'),
    getModalManager: () => _mgr('modalManager'),
    getTooltipManager: () => _mgr('tooltipManager'),
    getContextMenuManager: () => _mgr('contextMenuManager'),
    getHotkeyManager: () => _mgr('hotkeyManager'),
    getScrollManager: () => _mgr('scrollManager'),
    getFocusManager: () => _mgr('focusManager'),
    getUndoManager: () => _mgr('undoManager'),
    getThemeManager: () => _mgr('themeManager'),
    getAnimationManager: () => _mgr('animationManager'),
    getMediaQueryManager: () => _mgr('mediaQueryManager'),
    getIntersectionManager: () => _mgr('intersectionManager'),
    getResizeManager: () => _mgr('resizeManager'),
    getMutationManager: () => _mgr('mutationManager'),
    getPermissionManager: () => _mgr('permissionManager'),
    getNetworkManager: () => _mgr('networkManager'),
    getGeolocationManager: () => _mgr('geolocationManager'),
    getDeviceManager: () => _mgr('deviceManager'),
    getBatteryManager: () => _mgr('batteryManager'),
    getFullscreenManager: () => _mgr('fullscreenManager'),
    getVisibilityManager: () => _mgr('visibilityManager'),
    getWakeLockManager: () => _mgr('wakeLockManager'),
    getShareManager: () => _mgr('shareManager'),
    
    getPanelTransitions, getContainerStatePersistence, getPerformanceAPI,
    getSkeletonManager, getUpdateNotifier,
    getNavigationHistory, getLoadingProgress,
    getSplitViewManager, getExportContentManager, getOfflineModeManager,
    getAccessibilityManager, getKeyboardNavigationManager, getZoomManager, getPrintManager, getPanelBookmarksManager,
    getCommandPaletteManager, getPanelSearchManager, getPanelTabsManager, getQuickActionsManager, getTourManager,

    registerPlugin: (plugin: Record<string, unknown>) => (_mgr('pluginSystem')?.register as ((...a: unknown[]) => void) | undefined)?.(plugin),
    onBeforeBoot: (handler: (...args: unknown[]) => void, opts: Record<string, unknown>) => (_mgr('lifecycleHooks')?.beforeBoot as ((...a: unknown[]) => void) | undefined)?.(handler, opts),
    onAfterBoot: (handler: (...args: unknown[]) => void, opts: Record<string, unknown>) => (_mgr('lifecycleHooks')?.afterBoot as ((...a: unknown[]) => void) | undefined)?.(handler, opts),
    onBeforeShutdown: (handler: (...args: unknown[]) => void, opts: Record<string, unknown>) => (_mgr('lifecycleHooks')?.beforeShutdown as ((...a: unknown[]) => void) | undefined)?.(handler, opts),
    onStateChange: (handler: (...args: unknown[]) => void, opts: Record<string, unknown>) => (_mgr('lifecycleHooks')?.onStateChange as ((...a: unknown[]) => void) | undefined)?.(handler, opts),
    onError: (handler: (...args: unknown[]) => void, opts: Record<string, unknown>) => (_mgr('lifecycleHooks')?.onError as ((...a: unknown[]) => void) | undefined)?.(handler, opts),

    get convenience() { if (!_convenienceMethods) _createHelpers(); return _convenienceMethods; },

    async healthCheck() { if (!_healthReporter) _createHelpers(); return (_healthReporter!.healthCheck as () => Promise<Record<string, unknown>>)(); },
    info() { if (!_healthReporter) _createHelpers(); return (_healthReporter!.info as () => Record<string, unknown>)(); }
  };

  return new Proxy(bootstrap, {
    get(target, prop: string | symbol) {
      const propStr = String(prop);
      if (propStr in target) return (target as Record<string, unknown>)[propStr];
      if (_convenienceMethods && propStr in _convenienceMethods) return _convenienceMethods[propStr];
      if (!_convenienceMethods) {
        _createHelpers();
        if (_convenienceMethods && propStr in _convenienceMethods) return _convenienceMethods[propStr];
      }
      return undefined;
    }
  });
}

export function getBootstrap(options = {}) {
  if (!_instance) _instance = createBootstrap(options);
  return _instance;
}

export function resetBootstrap() {
  if (_instance) { ((_instance as Record<string, (...args: unknown[]) => unknown>).shutdown() as Promise<unknown>).catch(function(err: unknown) { console.error('[bootstrap-integration] shutdown failed:', (err as Error)?.message || err); }); _instance = null; }
}

export async function boot(container: HTMLElement | null = null, options = {}) {
  return (getBootstrap(options) as Record<string, (...args: unknown[]) => unknown>).boot(container);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, modular: true, exports: ['createBootstrap', 'getBootstrap', 'boot'], states: Object.keys(BOOTSTRAP_STATES), sprint1: true, sprint2: true, sprint3: true, sprint4: true, sprint5: true, sprint6: true };
}

export function healthCheck() {
  if (_instance) return (_instance as Record<string, (...args: unknown[]) => unknown>).healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default { VERSION, MODULE_ID, BOOTSTRAP_STATES, createBootstrap, getBootstrap, resetBootstrap, boot, info, healthCheck };
