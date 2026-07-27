import { saveFocus, restoreFocus, focusMain, focusRegion, announce } from "../ui/template.js";
import { getTransitionState } from "../ui/transitions.js";
import { getRegionsHealth, validateRegions, clearCache, getAccessCounts, getCacheConfig, setCacheConfig, getCacheStats, invalidateCache, setCacheTTL, getCacheTTL } from "../core/dom-regions/index.js";
import { getState, getPhaseTimings, getTransitionHistory } from "../state/store.js";
import { getLifecycleInfo } from "../core/lifecycle.js";
import { getReadinessInfo } from "../core/readiness.js";
import { getSystemPagesInfo } from "../utils/system-pages.js";
import { collectAdapterInfos, getConnectedAdaptersList, ResponsiveAdapter } from "../adapters/adapter-manager.js";
import RegionVisibility from "../core/region-visibility.js";
import RegionEvents, { REGION_EVENTS } from "../core/region-events/index.js";
import RegionSlots, { SLOT_POSITIONS } from "../core/region-slots.js";
import MaintenanceMode, { MAINTENANCE_TYPES, SEVERITY as MAINTENANCE_SEVERITY } from "../core/maintenance-mode/index.js";
import LayoutPersistence from "../state/layout-persistence.js";
import SlotPersistence from "../state/slot-persistence.js";
import RegionLoading from "../ui/region-loading.js";
import KeyboardNavigation from "../ui/keyboard-navigation/index.js";
import RegionResize from "../ui/region-resize/index.js";
import LayoutPresets, { PRESETS as LAYOUT_PRESETS } from "../ui/layout-presets.js";
import SkeletonLoader, { TEMPLATES as SKELETON_TEMPLATES } from "../ui/skeleton-loader/index.js";
import FocusManager, { FOCUS_STRATEGIES } from "../ui/focus-manager/index.js";
import AccessibilityPresets, { PRESETS as A11Y_PRESETS } from "../ui/accessibility-presets/index.js";
import AnimationAPI, { ANIMATIONS, EASINGS } from "../ui/animation-api/index.js";
import ContentVirtualizer, { SCROLL_DIRECTION } from "../ui/content-virtualizer.js";
import NotificationCenter, { NOTIFICATION_TYPES, NOTIFICATION_POSITIONS, NOTIFICATION_PRIORITIES } from "../ui/notification-center/index.js";
import KeyboardShortcuts, { MODIFIER_KEYS, SHORTCUT_SCOPES } from "../ui/keyboard-shortcuts/index.js";
import GestureHandler, { GESTURES, DIRECTIONS as GESTURE_DIRECTIONS } from "../ui/gesture-handler/index.js";
import CommandPalette, { COMMAND_TYPES } from "../ui/command-palette.js";
import Icons from "../ui/icons.js";
import ThemeIntegration, { THEMES } from "../adapters/theme-integration.js";
import DebugPanel from "../devtools/debug-panel.js";
import PerformanceMetrics from "../devtools/performance-metrics.js";
import AutoHealthCheck from "../devtools/auto-health-check.js";
import APIUsageMetrics from "../devtools/api-usage-metrics.js";
import MemoryLeakDetector from "../devtools/memory-leak-detector.js";
import AnalyticsExporter from "../devtools/analytics-exporter.js";
import BundleAnalyzer from "../devtools/bundle-analyzer.js";
import DebugPresets, { PRESETS as DEBUG_PRESETS } from "../devtools/debug-presets.js";
import RegionMetrics, { METRIC_TYPES } from "../devtools/region-metrics.js";
import StateSnapshots from "../devtools/state-snapshots.js";
import Logger, { LOG_LEVELS } from "../utils/logger.js";
import RateLimiter from "../utils/rate-limiter.js";
import ConfigValidator from "../utils/config-validator.js";
import CircuitBreaker, { STATES as CB_STATES } from "../utils/circuit-breaker.js";
import LazyLoader, { LOAD_STATES } from "../utils/lazy-loader.js";
import ServiceWorkerManager, { SW_STATES, UPDATE_STRATEGIES } from "../utils/service-worker-manager/index.js";
import OfflineManager, { CONNECTION_STATUS, SYNC_STATUS } from "../utils/offline-manager/index.js";
import ConfigExporter, { EXPORT_FORMATS, EXPORT_SCOPES } from "../utils/config-exporter.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell/api/namespaces";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
function buildNamespaces(ctx) {
  return {
    focus: Object.freeze({ save: saveFocus, restore: restoreFocus, main: focusMain, region: focusRegion, announce }),
    theme: Object.freeze({
      getTheme: ThemeIntegration.getTheme,
      getResolvedTheme: ThemeIntegration.getResolvedTheme,
      setTheme: ThemeIntegration.setTheme,
      toggleTheme: ThemeIntegration.toggleTheme,
      useSystemTheme: ThemeIntegration.useSystemTheme,
      isDarkMode: ThemeIntegration.isDarkMode,
      isLightMode: ThemeIntegration.isLightMode,
      isSystemTheme: ThemeIntegration.isSystemTheme,
      getSystemPreference: ThemeIntegration.getSystemPreference,
      setRegionTheme: ThemeIntegration.setRegionTheme,
      clearRegionTheme: ThemeIntegration.clearRegionTheme,
      getRegionTheme: ThemeIntegration.getRegionTheme,
      getRegionThemes: ThemeIntegration.getRegionThemes,
      getThemeVariable: ThemeIntegration.getThemeVariable,
      setThemeVariable: ThemeIntegration.setThemeVariable,
      getThemeVariables: ThemeIntegration.getThemeVariables,
      THEMES,
      subscribe: ThemeIntegration.subscribe,
      healthCheck: ThemeIntegration.healthCheck,
      info: ThemeIntegration.info
    }),
    events: Object.freeze({
      emit: RegionEvents.emit,
      on: RegionEvents.on,
      off: RegionEvents.off,
      onAny: RegionEvents.onAny,
      onGlobal: RegionEvents.onGlobal,
      once: RegionEvents.once,
      waitFor: RegionEvents.waitFor,
      getHistory: RegionEvents.getHistory,
      clearHistory: RegionEvents.clearHistory,
      setHistoryLimit: RegionEvents.setHistoryLimit,
      getListenerCounts: RegionEvents.getListenerCounts,
      EVENTS: REGION_EVENTS,
      healthCheck: RegionEvents.healthCheck,
      info: RegionEvents.info
    }),
    slots: Object.freeze({
      registerSlot: RegionSlots.registerSlot,
      unregisterSlot: RegionSlots.unregisterSlot,
      injectContent: RegionSlots.injectContent,
      clearSlot: RegionSlots.clearSlot,
      clearRegionSlots: RegionSlots.clearRegionSlots,
      updateSlot: RegionSlots.updateSlot,
      getSlot: RegionSlots.getSlot,
      getRegionSlots: RegionSlots.getRegionSlots,
      getSlotContent: RegionSlots.getSlotContent,
      hasContent: RegionSlots.hasContent,
      findSlotsByName: RegionSlots.findSlotsByName,
      inject: RegionSlots.inject,
      createPersistentSlot: RegionSlots.createPersistentSlot,
      POSITIONS: SLOT_POSITIONS,
      subscribe: RegionSlots.subscribe,
      healthCheck: RegionSlots.healthCheck,
      info: RegionSlots.info
    }),
    perf: Object.freeze({
      mark: PerformanceMetrics.mark,
      measure: PerformanceMetrics.measure,
      clearMarks: PerformanceMetrics.clearMarks,
      clearMeasures: PerformanceMetrics.clearMeasures,
      getMetrics: PerformanceMetrics.getMetrics,
      getMarks: PerformanceMetrics.getMarks,
      getMeasures: PerformanceMetrics.getMeasures,
      getSampleHistory: PerformanceMetrics.getSampleHistory,
      getWebVitals: PerformanceMetrics.getWebVitals,
      getResourceBreakdown: PerformanceMetrics.getResourceBreakdown,
      subscribe: PerformanceMetrics.subscribe,
      healthCheck: PerformanceMetrics.healthCheck,
      info: PerformanceMetrics.info
    }),
    debugPanel: Object.freeze({ open: DebugPanel.open, close: DebugPanel.close, toggle: DebugPanel.toggle, isOpen: DebugPanel.isOpen, setActiveTab: DebugPanel.setActiveTab, refresh: DebugPanel.refresh, healthCheck: DebugPanel.healthCheck, info: DebugPanel.info }),
    autoHealthCheck: Object.freeze({ start: AutoHealthCheck.start, stop: AutoHealthCheck.stop, checkNow: AutoHealthCheck.checkNow, isRunning: AutoHealthCheck.isRunning, getLastStatus: AutoHealthCheck.getLastStatus, getLastCheckTime: AutoHealthCheck.getLastCheckTime, getStatusHistory: AutoHealthCheck.getStatusHistory, configure: AutoHealthCheck.configure, getConfig: AutoHealthCheck.getConfig, setInterval: AutoHealthCheck.setInterval, subscribe: AutoHealthCheck.subscribe, healthCheck: AutoHealthCheck.healthCheck, info: AutoHealthCheck.info }),
    logger: Object.freeze({ debug: Logger.debug, info: Logger.logInfo, warn: Logger.warn, error: Logger.error, createLogger: Logger.createLogger, setLevel: Logger.setLevel, getLevel: Logger.getLevel, getLevelName: Logger.getLevelName, enableModule: Logger.enableModule, disableModule: Logger.disableModule, enableOnlyModules: Logger.enableOnlyModules, enableAllModules: Logger.enableAllModules, configure: Logger.configure, getConfig: Logger.getConfig, getHistory: Logger.getHistory, clearHistory: Logger.clearHistory, subscribe: Logger.subscribe, LOG_LEVELS, healthCheck: Logger.healthCheck, getInfo: Logger.getInfo }),
    rateLimiter: Object.freeze({ throttle: RateLimiter.throttle, debounce: RateLimiter.debounce, rafThrottle: RateLimiter.rafThrottle, getThrottled: RateLimiter.getThrottled, getDebounced: RateLimiter.getDebounced, removeThrottled: RateLimiter.removeThrottled, removeDebounced: RateLimiter.removeDebounced, clearAll: RateLimiter.clearAll, throttleWithPreset: RateLimiter.throttleWithPreset, debounceWithPreset: RateLimiter.debounceWithPreset, PRESETS: RateLimiter.PRESETS, healthCheck: RateLimiter.healthCheck, info: RateLimiter.info }),
    configValidator: Object.freeze({ validate: ConfigValidator.validate, validateAndNormalize: ConfigValidator.validateAndNormalize, validateInitOptions: ConfigValidator.validateInitOptions, createSchema: ConfigValidator.createSchema, formatErrors: ConfigValidator.formatErrors, getLastValidation: ConfigValidator.getLastValidation, getInitSchema: ConfigValidator.getInitSchema, healthCheck: ConfigValidator.healthCheck, info: ConfigValidator.info }),
    cache: Object.freeze({ clear: clearCache, invalidate: invalidateCache, setTTL: setCacheTTL, getTTL: getCacheTTL, setConfig: setCacheConfig, getConfig: getCacheConfig, getStats: getCacheStats }),
    apiMetrics: Object.freeze({ trackCall: APIUsageMetrics.trackCall, wrapMethod: APIUsageMetrics.wrapMethod, getMetrics: APIUsageMetrics.getMetrics, getAllMetrics: APIUsageMetrics.getAllMetrics, getTopAPIs: APIUsageMetrics.getTopAPIs, getUnusedAPIs: APIUsageMetrics.getUnusedAPIs, getAPIsWithErrors: APIUsageMetrics.getAPIsWithErrors, getSummaryByNamespace: APIUsageMetrics.getSummaryByNamespace, enable: APIUsageMetrics.enable, disable: APIUsageMetrics.disable, isEnabled: APIUsageMetrics.isEnabled, configure: APIUsageMetrics.configure, getConfig: APIUsageMetrics.getConfig, reset: APIUsageMetrics.reset, healthCheck: APIUsageMetrics.healthCheck, info: APIUsageMetrics.info }),
    memoryLeaks: Object.freeze({ enable: MemoryLeakDetector.enable, disable: MemoryLeakDetector.disable, isEnabled: MemoryLeakDetector.isEnabled, checkNow: MemoryLeakDetector.checkNow, getTrackedListeners: MemoryLeakDetector.getTrackedListeners, getTrackedIntervals: MemoryLeakDetector.getTrackedIntervals, getTrackedTimeouts: MemoryLeakDetector.getTrackedTimeouts, getLeakReports: MemoryLeakDetector.getLeakReports, getLastReport: MemoryLeakDetector.getLastReport, clearReports: MemoryLeakDetector.clearReports, trackReference: MemoryLeakDetector.trackReference, untrackReference: MemoryLeakDetector.untrackReference, configure: MemoryLeakDetector.configure, getConfig: MemoryLeakDetector.getConfig, getMetrics: MemoryLeakDetector.getMetrics, healthCheck: MemoryLeakDetector.healthCheck, info: MemoryLeakDetector.info }),
    analytics: Object.freeze({ track: AnalyticsExporter.track, trackPerformance: AnalyticsExporter.trackPerformance, trackError: AnalyticsExporter.trackError, trackHealthCheck: AnalyticsExporter.trackHealthCheck, registerAdapter: AnalyticsExporter.registerAdapter, unregisterAdapter: AnalyticsExporter.unregisterAdapter, enableAdapter: AnalyticsExporter.enableAdapter, disableAdapter: AnalyticsExporter.disableAdapter, getAdapters: AnalyticsExporter.getAdapters, useBuiltInAdapter: AnalyticsExporter.useBuiltInAdapter, flush: AnalyticsExporter.flush, flushAll: AnalyticsExporter.flushAll, enable: AnalyticsExporter.enable, disable: AnalyticsExporter.disable, isEnabled: AnalyticsExporter.isEnabled, getQueueSize: AnalyticsExporter.getQueueSize, clearQueue: AnalyticsExporter.clearQueue, configure: AnalyticsExporter.configure, getConfig: AnalyticsExporter.getConfig, getMetrics: AnalyticsExporter.getMetrics, healthCheck: AnalyticsExporter.healthCheck, info: AnalyticsExporter.info }),
    circuitBreaker: Object.freeze({ create: CircuitBreaker.create, get: CircuitBreaker.get, remove: CircuitBreaker.remove, execute: CircuitBreaker.execute, wrap: CircuitBreaker.wrap, wrapWithFallback: CircuitBreaker.wrapWithFallback, getState: CircuitBreaker.getState, isOpen: CircuitBreaker.isOpen, isClosed: CircuitBreaker.isClosed, reset: CircuitBreaker.reset, resetAll: CircuitBreaker.resetAll, getAll: CircuitBreaker.getAll, getOpenCircuits: CircuitBreaker.getOpenCircuits, setDefaultConfig: CircuitBreaker.setDefaultConfig, getDefaultConfig: CircuitBreaker.getDefaultConfig, subscribe: CircuitBreaker.subscribe, STATES: CB_STATES, getMetrics: CircuitBreaker.getMetrics, healthCheck: CircuitBreaker.healthCheck, info: CircuitBreaker.info }),
    lazyLoader: Object.freeze({ register: LazyLoader.register, unregister: LazyLoader.unregister, load: LazyLoader.load, loadMany: LazyLoader.loadMany, preload: LazyLoader.preload, isLoaded: LazyLoader.isLoaded, getState: LazyLoader.getState, getModule: LazyLoader.getModule, getModuleInfo: LazyLoader.getModuleInfo, listModules: LazyLoader.listModules, invalidate: LazyLoader.invalidate, invalidateAll: LazyLoader.invalidateAll, configure: LazyLoader.configure, getConfig: LazyLoader.getConfig, subscribe: LazyLoader.subscribe, LOAD_STATES, getMetrics: LazyLoader.getMetrics, healthCheck: LazyLoader.healthCheck, info: LazyLoader.info }),
    bundleAnalyzer: Object.freeze({ registerModule: BundleAnalyzer.registerModule, updateModule: BundleAnalyzer.updateModule, unregisterModule: BundleAnalyzer.unregisterModule, analyze: BundleAnalyzer.analyze, findCircularDependencies: BundleAnalyzer.findCircularDependencies, getDependencyTree: BundleAnalyzer.getDependencyTree, getResourceStats: BundleAnalyzer.getResourceStats, getLastAnalysis: BundleAnalyzer.getLastAnalysis, configure: BundleAnalyzer.configure, getConfig: BundleAnalyzer.getConfig, healthCheck: BundleAnalyzer.healthCheck, info: BundleAnalyzer.info }),
    layoutPresets: Object.freeze({ apply: LayoutPresets.apply, getCurrent: LayoutPresets.getCurrent, getPrevious: LayoutPresets.getPrevious, revert: LayoutPresets.revert, getConfig: LayoutPresets.getConfig, listPresets: LayoutPresets.listPresets, createPreset: LayoutPresets.createPreset, deletePreset: LayoutPresets.deletePreset, clonePreset: LayoutPresets.clonePreset, setTransitionDuration: LayoutPresets.setTransitionDuration, getTransitionDuration: LayoutPresets.getTransitionDuration, subscribe: LayoutPresets.subscribe, PRESETS: LAYOUT_PRESETS, getMetrics: LayoutPresets.getMetrics, healthCheck: LayoutPresets.healthCheck, info: LayoutPresets.info }),
    slotPersistence: Object.freeze({ saveSlotState: SlotPersistence.saveSlotState, getSlotState: SlotPersistence.getSlotState, removeSlotState: SlotPersistence.removeSlotState, getRegionSlots: SlotPersistence.getRegionSlots, saveMultiple: SlotPersistence.saveMultiple, persist: SlotPersistence.persist, load: SlotPersistence.load, restore: SlotPersistence.restore, clear: SlotPersistence.clear, configure: SlotPersistence.configure, getConfig: SlotPersistence.getConfig, enable: SlotPersistence.enable, disable: SlotPersistence.disable, isEnabled: SlotPersistence.isEnabled, subscribe: SlotPersistence.subscribe, getMetrics: SlotPersistence.getMetrics, healthCheck: SlotPersistence.healthCheck, info: SlotPersistence.info }),
    skeleton: Object.freeze({ create: SkeletonLoader.create, destroy: SkeletonLoader.destroy, destroyIn: SkeletonLoader.destroyIn, destroyAll: SkeletonLoader.destroyAll, hasActive: SkeletonLoader.hasActive, listTemplates: SkeletonLoader.listTemplates, registerTemplate: SkeletonLoader.registerTemplate, unregisterTemplate: SkeletonLoader.unregisterTemplate, configure: SkeletonLoader.configure, getConfig: SkeletonLoader.getConfig, TEMPLATES: SKELETON_TEMPLATES, getMetrics: SkeletonLoader.getMetrics, healthCheck: SkeletonLoader.healthCheck, info: SkeletonLoader.info }),
    maintenance: Object.freeze({ activate: MaintenanceMode.activate, deactivate: MaintenanceMode.deactivate, isActive: MaintenanceMode.isActive, getState: MaintenanceMode.getState, isRegionAffected: MaintenanceMode.isRegionAffected, isFeatureAffected: MaintenanceMode.isFeatureAffected, canBypass: MaintenanceMode.canBypass, schedule: MaintenanceMode.schedule, cancelScheduled: MaintenanceMode.cancelScheduled, getScheduled: MaintenanceMode.getScheduled, configure: MaintenanceMode.configure, getConfig: MaintenanceMode.getConfig, subscribe: MaintenanceMode.subscribe, TYPES: MAINTENANCE_TYPES, SEVERITY: MAINTENANCE_SEVERITY, getMetrics: MaintenanceMode.getMetrics, healthCheck: MaintenanceMode.healthCheck, info: MaintenanceMode.info }),
    focusManager: Object.freeze({ focusElement: FocusManager.focusElement, focusRegion: FocusManager.focusRegion, focusNext: FocusManager.focusNext, focusPrevious: FocusManager.focusPrevious, saveFocus: FocusManager.saveFocus, restoreFocus: FocusManager.restoreFocus, clearSavedFocus: FocusManager.clearSavedFocus, getSavedFocusKeys: FocusManager.getSavedFocusKeys, createTrap: FocusManager.createTrap, releaseTrap: FocusManager.releaseTrap, hasTrap: FocusManager.hasTrap, getActiveTraps: FocusManager.getActiveTraps, createGuard: FocusManager.createGuard, removeGuard: FocusManager.removeGuard, getHistory: FocusManager.getHistory, goBack: FocusManager.goBack, clearHistory: FocusManager.clearHistory, getCurrentFocus: FocusManager.getCurrentFocus, isFocused: FocusManager.isFocused, getFocusableIn: FocusManager.getFocusableIn, announce: FocusManager.announce, configure: FocusManager.configure, getConfig: FocusManager.getConfig, subscribe: FocusManager.subscribe, STRATEGIES: FOCUS_STRATEGIES, getMetrics: FocusManager.getMetrics, healthCheck: FocusManager.healthCheck, info: FocusManager.info }),
    a11y: Object.freeze({ enable: AccessibilityPresets.enable, disable: AccessibilityPresets.disable, toggle: AccessibilityPresets.toggle, enableMultiple: AccessibilityPresets.enableMultiple, reset: AccessibilityPresets.reset, isEnabled: AccessibilityPresets.isEnabled, getActivePresets: AccessibilityPresets.getActivePresets, listPresets: AccessibilityPresets.listPresets, getPresetConfig: AccessibilityPresets.getPresetConfig, setSetting: AccessibilityPresets.setSetting, getSetting: AccessibilityPresets.getSetting, getAllSettings: AccessibilityPresets.getAllSettings, removeSetting: AccessibilityPresets.removeSetting, detectSystemPreferences: AccessibilityPresets.detectSystemPreferences, applySystemPreferences: AccessibilityPresets.applySystemPreferences, configure: AccessibilityPresets.configure, getConfig: AccessibilityPresets.getConfig, subscribe: AccessibilityPresets.subscribe, PRESETS: A11Y_PRESETS, getMetrics: AccessibilityPresets.getMetrics, healthCheck: AccessibilityPresets.healthCheck, info: AccessibilityPresets.info }),
    animations: Object.freeze({ animate: AnimationAPI.animate, sequence: AnimationAPI.sequence, parallel: AnimationAPI.parallel, stagger: AnimationAPI.stagger, transitionIn: AnimationAPI.transitionIn, transitionOut: AnimationAPI.transitionOut, crossfade: AnimationAPI.crossfade, cancel: AnimationAPI.cancel, cancelAll: AnimationAPI.cancelAll, pause: AnimationAPI.pause, resume: AnimationAPI.resume, pauseAll: AnimationAPI.pauseAll, resumeAll: AnimationAPI.resumeAll, getActive: AnimationAPI.getActive, registerAnimation: AnimationAPI.registerAnimation, unregisterAnimation: AnimationAPI.unregisterAnimation, listAnimations: AnimationAPI.listAnimations, configure: AnimationAPI.configure, getConfig: AnimationAPI.getConfig, subscribe: AnimationAPI.subscribe, ANIMATIONS, EASINGS, getMetrics: AnimationAPI.getMetrics, healthCheck: AnimationAPI.healthCheck, info: AnimationAPI.info }),
    serviceWorker: Object.freeze({ register: ServiceWorkerManager.register, unregister: ServiceWorkerManager.unregister, checkForUpdates: ServiceWorkerManager.checkForUpdates, applyUpdate: ServiceWorkerManager.applyUpdate, skipWaiting: ServiceWorkerManager.skipWaiting, hasUpdate: ServiceWorkerManager.hasUpdate, postMessage: ServiceWorkerManager.postMessage, onMessage: ServiceWorkerManager.onMessage, clearCache: ServiceWorkerManager.clearCache, precache: ServiceWorkerManager.precache, getCacheNames: ServiceWorkerManager.getCacheNames, getCacheSize: ServiceWorkerManager.getCacheSize, registerSync: ServiceWorkerManager.registerSync, getSyncTags: ServiceWorkerManager.getSyncTags, requestPushPermission: ServiceWorkerManager.requestPushPermission, getPushSubscription: ServiceWorkerManager.getPushSubscription, subscribePush: ServiceWorkerManager.subscribePush, isSupported: ServiceWorkerManager.isSupported, isRegistered: ServiceWorkerManager.isRegistered, isControlling: ServiceWorkerManager.isControlling, getState: ServiceWorkerManager.getState, getRegistration: ServiceWorkerManager.getRegistration, startPeriodicCheck: ServiceWorkerManager.startPeriodicCheck, stopPeriodicCheck: ServiceWorkerManager.stopPeriodicCheck, configure: ServiceWorkerManager.configure, getConfig: ServiceWorkerManager.getConfig, subscribe: ServiceWorkerManager.subscribe, SW_STATES, UPDATE_STRATEGIES, getMetrics: ServiceWorkerManager.getMetrics, healthCheck: ServiceWorkerManager.healthCheck, info: ServiceWorkerManager.info }),
    virtualizer: Object.freeze({ create: ContentVirtualizer.create, get: ContentVirtualizer.get, destroy: ContentVirtualizer.destroy, destroyAll: ContentVirtualizer.destroyAll, listInstances: ContentVirtualizer.listInstances, SCROLL_DIRECTION, getMetrics: ContentVirtualizer.getMetrics, healthCheck: ContentVirtualizer.healthCheck, info: ContentVirtualizer.info }),
    offline: Object.freeze({ isOnline: OfflineManager.isOnline, isOffline: OfflineManager.isOffline, getConnectionStatus: OfflineManager.getConnectionStatus, getConnectionInfo: OfflineManager.getConnectionInfo, getState: OfflineManager.getState, queueAction: OfflineManager.queueAction, removeAction: OfflineManager.removeAction, getPendingActions: OfflineManager.getPendingActions, getPendingCount: OfflineManager.getPendingCount, clearPending: OfflineManager.clearPending, syncPending: OfflineManager.syncPending, getSyncStatus: OfflineManager.getSyncStatus, ping: OfflineManager.ping, configure: OfflineManager.configure, getConfig: OfflineManager.getConfig, subscribe: OfflineManager.subscribe, destroy: OfflineManager.destroy, CONNECTION_STATUS, SYNC_STATUS, getMetrics: OfflineManager.getMetrics, healthCheck: OfflineManager.healthCheck, info: OfflineManager.info }),
    notify: Object.freeze({
      show: NotificationCenter.show,
      dismiss: NotificationCenter.dismiss,
      dismissAll: NotificationCenter.dismissAll,
      update: NotificationCenter.update,
      info: (msg, opts) => NotificationCenter.show(Object.assign({ type: "info", message: msg }, opts || {})),
      success: (msg, opts) => NotificationCenter.show(Object.assign({ type: "success", message: msg }, opts || {})),
      warning: (msg, opts) => NotificationCenter.show(Object.assign({ type: "warning", message: msg }, opts || {})),
      error: (msg, opts) => NotificationCenter.show(Object.assign({ type: "error", message: msg, duration: 0 }, opts || {})),
      loading: (msg, opts) => NotificationCenter.show(Object.assign({ type: "loading", message: msg, duration: 0, dismissible: false }, opts || {})),
      promise: NotificationCenter.promise,
      get: NotificationCenter.get,
      getAll: NotificationCenter.getAll,
      getByType: NotificationCenter.getByType,
      getQueueSize: NotificationCenter.getQueueSize,
      configure: NotificationCenter.configure,
      getConfig: NotificationCenter.getConfig,
      setPosition: NotificationCenter.setPosition,
      subscribe: NotificationCenter.subscribe,
      TYPES: NOTIFICATION_TYPES,
      POSITIONS: NOTIFICATION_POSITIONS,
      PRIORITIES: NOTIFICATION_PRIORITIES,
      getMetrics: NotificationCenter.getMetrics,
      healthCheck: NotificationCenter.healthCheck
    }),
    shortcuts: Object.freeze({
      register: KeyboardShortcuts.register,
      unregister: KeyboardShortcuts.unregister,
      unregisterGroup: KeyboardShortcuts.unregisterGroup,
      registerMany: KeyboardShortcuts.registerMany,
      setScope: KeyboardShortcuts.setScope,
      restoreScope: KeyboardShortcuts.restoreScope,
      getScope: KeyboardShortcuts.getScope,
      enable: KeyboardShortcuts.enable,
      disable: KeyboardShortcuts.disable,
      isEnabled: KeyboardShortcuts.isEnabled,
      setEnabled: KeyboardShortcuts.setEnabled,
      get: KeyboardShortcuts.get,
      getAll: KeyboardShortcuts.getAll,
      getByGroup: KeyboardShortcuts.getByGroup,
      getGroups: KeyboardShortcuts.getGroups,
      isRegistered: KeyboardShortcuts.isRegistered,
      trigger: KeyboardShortcuts.trigger,
      showHelp: KeyboardShortcuts.showHelp,
      hideHelp: KeyboardShortcuts.hideHelp,
      configure: KeyboardShortcuts.configure,
      getConfig: KeyboardShortcuts.getConfig,
      subscribe: KeyboardShortcuts.subscribe,
      destroy: KeyboardShortcuts.destroy,
      MODIFIER_KEYS,
      SCOPES: SHORTCUT_SCOPES,
      getMetrics: KeyboardShortcuts.getMetrics,
      healthCheck: KeyboardShortcuts.healthCheck,
      info: KeyboardShortcuts.info
    }),
    gestures: Object.freeze({
      on: GestureHandler.on,
      off: GestureHandler.off,
      once: GestureHandler.once,
      offAll: GestureHandler.offAll,
      addToElement: GestureHandler.addToElement,
      removeFromElement: GestureHandler.removeFromElement,
      onSwipe: GestureHandler.onSwipe,
      onSwipeLeft: GestureHandler.onSwipeLeft,
      onSwipeRight: GestureHandler.onSwipeRight,
      onSwipeUp: GestureHandler.onSwipeUp,
      onSwipeDown: GestureHandler.onSwipeDown,
      onTap: GestureHandler.onTap,
      onDoubleTap: GestureHandler.onDoubleTap,
      onLongPress: GestureHandler.onLongPress,
      onPinch: GestureHandler.onPinch,
      onPan: GestureHandler.onPan,
      enable: GestureHandler.enable,
      disable: GestureHandler.disable,
      isEnabled: GestureHandler.isEnabled,
      configure: GestureHandler.configure,
      getConfig: GestureHandler.getConfig,
      subscribe: GestureHandler.subscribe,
      destroy: GestureHandler.destroy,
      GESTURES,
      DIRECTIONS: GESTURE_DIRECTIONS,
      getMetrics: GestureHandler.getMetrics,
      healthCheck: GestureHandler.healthCheck,
      info: GestureHandler.info
    }),
    debugPresets: Object.freeze({
      apply: DebugPresets.apply,
      applyCustom: DebugPresets.applyCustom,
      disable: DebugPresets.disable,
      revert: DebugPresets.revert,
      getCurrent: DebugPresets.getCurrent,
      getCurrentConfig: DebugPresets.getCurrentConfig,
      getPrevious: DebugPresets.getPrevious,
      isEnabled: DebugPresets.isEnabled,
      getPresetConfig: DebugPresets.getPresetConfig,
      listPresets: DebugPresets.listPresets,
      getHistory: DebugPresets.getHistory,
      configure: DebugPresets.configure,
      getConfig: DebugPresets.getConfig,
      subscribe: DebugPresets.subscribe,
      minimal: DebugPresets.minimal,
      standard: DebugPresets.standard,
      verbose: DebugPresets.verbose,
      performance: DebugPresets.performance,
      network: DebugPresets.network,
      memory: DebugPresets.memory,
      events: DebugPresets.events,
      regions: DebugPresets.regions,
      PRESETS: DEBUG_PRESETS,
      getMetrics: DebugPresets.getMetrics,
      healthCheck: DebugPresets.healthCheck,
      info: DebugPresets.info
    }),
    configExporter: Object.freeze({
      exportConfig: ConfigExporter.exportConfig,
      exportToFile: ConfigExporter.exportToFile,
      exportToClipboard: ConfigExporter.exportToClipboard,
      importConfig: ConfigExporter.importConfig,
      importFromFile: ConfigExporter.importFromFile,
      importFromClipboard: ConfigExporter.importFromClipboard,
      getLastExport: ConfigExporter.getLastExport,
      getLastImport: ConfigExporter.getLastImport,
      configure: ConfigExporter.configure,
      getConfig: ConfigExporter.getConfig,
      subscribe: ConfigExporter.subscribe,
      FORMATS: EXPORT_FORMATS,
      SCOPES: EXPORT_SCOPES,
      getMetrics: ConfigExporter.getMetrics,
      healthCheck: ConfigExporter.healthCheck,
      info: ConfigExporter.info
    }),
    regionMetrics: Object.freeze({
      trackRender: RegionMetrics.trackRender,
      trackUpdate: RegionMetrics.trackUpdate,
      trackVisibility: RegionMetrics.trackVisibility,
      trackInteraction: RegionMetrics.trackInteraction,
      trackError: RegionMetrics.trackError,
      trackLoad: RegionMetrics.trackLoad,
      startTimer: RegionMetrics.startTimer,
      endTimer: RegionMetrics.endTimer,
      getRegionMetrics: RegionMetrics.getRegionMetrics,
      getAllMetrics: RegionMetrics.getAllMetrics,
      getPerformanceSummary: RegionMetrics.getPerformanceSummary,
      getProblematicRegions: RegionMetrics.getProblematicRegions,
      enable: RegionMetrics.enable,
      disable: RegionMetrics.disable,
      isEnabled: RegionMetrics.isEnabled,
      reset: RegionMetrics.reset,
      resetRegion: RegionMetrics.resetRegion,
      configure: RegionMetrics.configure,
      getConfig: RegionMetrics.getConfig,
      subscribe: RegionMetrics.subscribe,
      METRIC_TYPES,
      getMetrics: RegionMetrics.getMetrics,
      healthCheck: RegionMetrics.healthCheck,
      info: RegionMetrics.info
    }),
    commandPalette: Object.freeze({
      show: CommandPalette.show,
      hide: CommandPalette.hide,
      toggle: CommandPalette.toggle,
      isVisible: CommandPalette.isVisible,
      register: CommandPalette.register,
      registerMany: CommandPalette.registerMany,
      unregister: CommandPalette.unregister,
      execute: CommandPalette.execute,
      getCommand: CommandPalette.getCommand,
      getAllCommands: CommandPalette.getAllCommands,
      getCommandsByType: CommandPalette.getCommandsByType,
      getRecentCommands: CommandPalette.getRecentCommands,
      clearRecent: CommandPalette.clearRecent,
      configure: CommandPalette.configure,
      getConfig: CommandPalette.getConfig,
      subscribe: CommandPalette.subscribe,
      TYPES: COMMAND_TYPES,
      getMetrics: CommandPalette.getMetrics,
      healthCheck: CommandPalette.healthCheck,
      info: CommandPalette.info
    }),
    stateSnapshots: Object.freeze({
      capture: StateSnapshots.capture,
      restore: StateSnapshots.restore,
      compare: StateSnapshots.compare,
      get: StateSnapshots.get,
      getAll: StateSnapshots.getAll,
      getLatest: StateSnapshots.getLatest,
      getByLabel: StateSnapshots.getByLabel,
      count: StateSnapshots.count,
      remove: StateSnapshots.remove,
      clear: StateSnapshots.clear,
      exportSnapshot: StateSnapshots.exportSnapshot,
      exportAll: StateSnapshots.exportAll,
      importSnapshot: StateSnapshots.importSnapshot,
      startAutoSnapshot: StateSnapshots.startAutoSnapshot,
      stopAutoSnapshot: StateSnapshots.stopAutoSnapshot,
      isAutoSnapshotRunning: StateSnapshots.isAutoSnapshotRunning,
      configure: StateSnapshots.configure,
      getConfig: StateSnapshots.getConfig,
      subscribe: StateSnapshots.subscribe,
      getMetrics: StateSnapshots.getMetrics,
      healthCheck: StateSnapshots.healthCheck,
      info: StateSnapshots.info
    }),
    docs: Object.freeze({
      show: () => {
        DebugPanel.open();
        DebugPanel.setActiveTab("docs");
        return true;
      },
      hide: () => {
        DebugPanel.close();
        return true;
      },
      toggle: () => {
        if (DebugPanel.isOpen()) {
          DebugPanel.close();
        } else {
          DebugPanel.open();
          DebugPanel.setActiveTab("docs");
        }
        return true;
      },
      isVisible: () => DebugPanel.isOpen(),
      goToSection: (section) => {
        DebugPanel.open();
        DebugPanel.setActiveTab("docs");
        return true;
      },
      getSections: () => ["overview", "regions", "theme", "notifications", "shortcuts", "devtools"],
      configure: () => {
      },
      getConfig: () => ({ integratedInDebugPanel: true, version: "3.0.0-INTEGRATED" }),
      subscribe: () => () => {
      },
      getMetrics: () => ({ redirectsToDebugPanel: true }),
      healthCheck: () => ({ status: "HEALTHY", note: "Integrated into Debug Panel v3.0.0" }),
      info: () => ({ moduleId: "interactive-docs", version: "3.0.0-INTEGRATED", integratedInDebugPanel: true, debugPanelTab: "docs" })
    }),
    icons: Object.freeze({
      get: Icons.icon,
      getSpan: Icons.iconSpan,
      list: () => Object.keys(Icons.ICONS),
      ICONS: Icons.ICONS,
      healthCheck: Icons.healthCheck,
      info: Icons.info
    }),
    resize: Object.freeze({ getSize: RegionResize.getSize, getSizes: RegionResize.getSizes, setSize: RegionResize.setSize, resetSize: RegionResize.resetSize, resetAllSizes: RegionResize.resetAllSizes, getConfig: RegionResize.getConfig, isResizable: RegionResize.isResizable, getResizableRegions: RegionResize.getResizableRegions, startDragResize: RegionResize.startDragResize, isDragging: RegionResize.isDragging, getDraggingRegion: RegionResize.getDraggingRegion, subscribe: RegionResize.subscribe, healthCheck: RegionResize.healthCheck, info: RegionResize.info }),
    keyboard: Object.freeze({ navigateToRegion: KeyboardNavigation.navigateToRegion, navigateNext: KeyboardNavigation.navigateNext, navigatePrevious: KeyboardNavigation.navigatePrevious, navigateToMain: KeyboardNavigation.navigateToMain, getCurrentRegion: KeyboardNavigation.getCurrentRegion, getNavigationOrder: KeyboardNavigation.getNavigationOrder, setNavigationOrder: KeyboardNavigation.setNavigationOrder, setTabTrap: KeyboardNavigation.setTabTrap, releaseTabTrap: KeyboardNavigation.releaseTabTrap, isTabTrapped: KeyboardNavigation.isTabTrapped, getTabTrapRegion: KeyboardNavigation.getTabTrapRegion, enable: KeyboardNavigation.enable, disable: KeyboardNavigation.disable, isEnabled: KeyboardNavigation.isEnabled, subscribe: KeyboardNavigation.subscribe, healthCheck: KeyboardNavigation.healthCheck, info: KeyboardNavigation.info }),
    loading: Object.freeze({ isLoading: RegionLoading.isLoading, setLoading: RegionLoading.setLoading, startLoading: RegionLoading.startLoading, endLoading: RegionLoading.endLoading, setSkeleton: RegionLoading.setSkeleton, setMultipleLoading: RegionLoading.setMultipleLoading, endAllLoading: RegionLoading.endAllLoading, getLoadingState: RegionLoading.getLoadingState, getLoadingRegions: RegionLoading.getLoadingRegions, isAnyLoading: RegionLoading.isAnyLoading, subscribe: RegionLoading.subscribe, healthCheck: RegionLoading.healthCheck, info: RegionLoading.info }),
    responsive: Object.freeze({ getCurrentBreakpoint: ResponsiveAdapter.getCurrentBreakpoint, getBreakpointInfo: ResponsiveAdapter.getBreakpointInfo, getBreakpoints: ResponsiveAdapter.getBreakpoints, getCurrentPolicy: ResponsiveAdapter.getCurrentPolicy, isMobile: ResponsiveAdapter.isMobile, isTablet: ResponsiveAdapter.isTablet, isDesktop: ResponsiveAdapter.isDesktop, enable: ResponsiveAdapter.enable, disable: ResponsiveAdapter.disable, isEnabled: ResponsiveAdapter.isEnabled, reapplyPolicy: ResponsiveAdapter.reapplyPolicy, setAutoApply: ResponsiveAdapter.setAutoApply, setUserOverride: ResponsiveAdapter.setUserOverride, clearUserOverride: ResponsiveAdapter.clearUserOverride, clearAllOverrides: ResponsiveAdapter.clearAllOverrides, getUserOverrides: ResponsiveAdapter.getUserOverrides, subscribe: ResponsiveAdapter.subscribe, healthCheck: ResponsiveAdapter.healthCheck, info: ResponsiveAdapter.info }),
    visibility: Object.freeze({ isVisible: RegionVisibility.isVisible, show: RegionVisibility.show, hide: RegionVisibility.hide, toggle: RegionVisibility.toggle, setVisibility: RegionVisibility.setVisibility, getState: RegionVisibility.getVisibilityState, reset: RegionVisibility.resetVisibility, enterFullscreen: RegionVisibility.enterFullscreen, exitFullscreen: RegionVisibility.exitFullscreen, toggleFullscreen: RegionVisibility.toggleFullscreen, isFullscreen: RegionVisibility.isFullscreenMode, subscribe: RegionVisibility.subscribe, healthCheck: RegionVisibility.healthCheck, info: RegionVisibility.info }),
    layoutPrefs: Object.freeze({ get: LayoutPersistence.get, getPreference: LayoutPersistence.getPreference, setPreference: LayoutPersistence.setPreference, setPreferences: LayoutPersistence.setPreferences, reset: LayoutPersistence.reset, subscribe: LayoutPersistence.subscribe, isSidebarCollapsed: LayoutPersistence.isSidebarCollapsed, setSidebarCollapsed: LayoutPersistence.setSidebarCollapsed, toggleSidebar: LayoutPersistence.toggleSidebar, getSidebarWidth: LayoutPersistence.getSidebarWidth, setSidebarWidth: LayoutPersistence.setSidebarWidth, getLayoutMode: LayoutPersistence.getLayoutMode, setLayoutMode: LayoutPersistence.setLayoutMode, isFullscreen: LayoutPersistence.isFullscreen, getThemeMode: LayoutPersistence.getThemeMode, setThemeMode: LayoutPersistence.setThemeMode, healthCheck: LayoutPersistence.healthCheck, info: LayoutPersistence.info })
  };
}
function buildDebugNamespace(ctx) {
  return Object.freeze({
    store: getState,
    lifecycle: getLifecycleInfo,
    readiness: getReadinessInfo,
    regions: getRegionsHealth,
    transitions: getTransitionState,
    systemPages: getSystemPagesInfo,
    adapters: collectAdapterInfos,
    metrics: () => ({ ...ctx.metrics, connectedAdapters: getConnectedAdaptersList() }),
    validateRegions,
    transitionHistory: getTransitionHistory,
    phaseTimings: getPhaseTimings,
    accessCounts: getAccessCounts,
    layoutPrefs: LayoutPersistence.info,
    visibility: RegionVisibility.info,
    responsive: ResponsiveAdapter.info,
    keyboard: KeyboardNavigation.info,
    resize: RegionResize.info,
    loading: RegionLoading.info,
    theme: ThemeIntegration.info,
    events: RegionEvents.info,
    slots: RegionSlots.info,
    performance: PerformanceMetrics.info,
    debugPanel: DebugPanel.info,
    autoHealthCheck: AutoHealthCheck.info,
    logger: Logger.getInfo,
    rateLimiter: RateLimiter.info,
    configValidator: ConfigValidator.info,
    cacheStats: getCacheStats,
    apiMetrics: APIUsageMetrics.info,
    memoryLeaks: MemoryLeakDetector.info,
    analytics: AnalyticsExporter.info,
    circuitBreaker: CircuitBreaker.info,
    lazyLoader: LazyLoader.info,
    bundleAnalyzer: BundleAnalyzer.info,
    layoutPresets: LayoutPresets.info,
    slotPersistence: SlotPersistence.info,
    skeleton: SkeletonLoader.info,
    maintenance: MaintenanceMode.info,
    focusManager: FocusManager.info,
    a11y: AccessibilityPresets.info,
    animations: AnimationAPI.info,
    serviceWorker: ServiceWorkerManager.info,
    virtualizer: ContentVirtualizer.info,
    offline: OfflineManager.info,
    notifications: NotificationCenter.info,
    shortcuts: KeyboardShortcuts.info,
    gestures: GestureHandler.info,
    debugPresets: DebugPresets.info,
    configExporter: ConfigExporter.info,
    regionMetrics: RegionMetrics.info,
    commandPalette: CommandPalette.info,
    stateSnapshots: StateSnapshots.info,
    icons: Icons.info
  });
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
export {
  MODULE_ID,
  VERSION,
  buildDebugNamespace,
  buildNamespaces,
  getLogs,
  setDebug
};
