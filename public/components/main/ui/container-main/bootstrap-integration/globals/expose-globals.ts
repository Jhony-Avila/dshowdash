// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.9.0-SPRINT6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: expose-globals
// PURPOSE: Bootstrap Integration - Expose Globals
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ../constants.js
//
// PROVIDES:
//   exposeGlobals() — exported function
//   clearGlobals() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).CMBootstrap
//   (window as any).ContainerMain
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID } from '../constants.js';
import * as SprintImports from './sprint-imports.js';

/**
 * Expõe bootstrap e container globalmente com todos os módulos
 * @param {Object} bootstrapInstance
 * @param {Object} context
 */
export function exposeGlobals(bootstrapInstance: unknown, context: Record<string, unknown>) {
  const container = context.container as HTMLElement | null;
  const managers = context.managers as import('../types.js').ManagerRef;
  
  if (typeof window === 'undefined') return;
  
  (window as any).CMBootstrap = bootstrapInstance;
  
  (window as any).ContainerMain = {
    // Core properties
    element: container,
    contentElement: container?.querySelector?.('.dsd-container__content') || container,
    id: 'container-main',
    mode: 'bootstrap',
    version: VERSION,
    
    // Core methods
    mount() {},
    unmount() {},
    getElement() { return container; },
    getContentElement() { return container?.querySelector?.('.dsd-container__content') || container; },
    getBootstrap() { return bootstrapInstance; },
    isBootstrapped() { return true; },
    
    // === SPRINT 1 ===
    createPanelTransitions: SprintImports.createPanelTransitions,
    getPanelTransitions: SprintImports.getPanelTransitions,
    TRANSITION_TYPES: SprintImports.TRANSITION_TYPES,
    createContainerStatePersistence: SprintImports.createContainerStatePersistence,
    getContainerStatePersistence: SprintImports.getContainerStatePersistence,
    createPerformanceAPI: SprintImports.createPerformanceAPI,
    getPerformanceAPI: SprintImports.getPerformanceAPI,
    
    // === SPRINT 2 ===
    createSkeletonManager: SprintImports.createSkeletonManager,
    getSkeletonManager: SprintImports.getSkeletonManager,
    showSkeleton: SprintImports.showSkeleton,
    hideSkeleton: SprintImports.hideSkeleton,
    showSkeletonForPanel: SprintImports.showSkeletonForPanel,
    SKELETON_TYPES: SprintImports.SKELETON_TYPES,
    DELAY_VARIANTS: SprintImports.DELAY_VARIANTS,
    createUpdateNotifier: SprintImports.createUpdateNotifier,
    getUpdateNotifier: SprintImports.getUpdateNotifier,
    checkForUpdates: SprintImports.checkForUpdates,
    hasUpdate: SprintImports.hasUpdate,
    NOTIFIER_STATES: SprintImports.NOTIFIER_STATES,
    UPDATE_TYPES: SprintImports.UPDATE_TYPES,
    
    // === SPRINT 3 ===
    createNavigationHistory: SprintImports.createNavigationHistory,
    getNavigationHistory: SprintImports.getNavigationHistory,
    pushNavigation: SprintImports.pushNavigation,
    goBack: SprintImports.goBack,
    goForward: SprintImports.goForward,
    canGoBack: SprintImports.canGoBack,
    canGoForward: SprintImports.canGoForward,
    NAVIGATION_TYPES: SprintImports.NAVIGATION_TYPES,
    createLoadingProgress: SprintImports.createLoadingProgress,
    getLoadingProgress: SprintImports.getLoadingProgress,
    startLoading: SprintImports.startLoading,
    doneLoading: SprintImports.doneLoading,
    setLoadingProgress: SprintImports.setLoadingProgress,
    isLoading: SprintImports.isLoading,
    LOADING_STATES: SprintImports.LOADING_STATES,
    
    // === SPRINT 4 ===
    createSplitViewManager: SprintImports.createSplitViewManager,
    getSplitViewManager: SprintImports.getSplitViewManager,
    SPLIT_ORIENTATIONS: SprintImports.SPLIT_ORIENTATIONS,
    SPLIT_POSITIONS: SprintImports.SPLIT_POSITIONS,
    createExportContentManager: SprintImports.createExportContentManager,
    getExportContentManager: SprintImports.getExportContentManager,
    exportToPNG: SprintImports.exportToPNG,
    exportToJPEG: SprintImports.exportToJPEG,
    exportToPDF: SprintImports.exportToPDF,
    exportToSVG: SprintImports.exportToSVG,
    exportElement: SprintImports.exportElement,
    EXPORT_FORMATS: SprintImports.EXPORT_FORMATS,
    EXPORT_QUALITY: SprintImports.EXPORT_QUALITY,
    createOfflineModeManager: SprintImports.createOfflineModeManager,
    getOfflineModeManager: SprintImports.getOfflineModeManager,
    cachedFetch: SprintImports.cachedFetch,
    cacheUrl: SprintImports.cacheUrl,
    getCached: SprintImports.getCached,
    clearCache: SprintImports.clearCache,
    getCacheSize: SprintImports.getCacheSize,
    queueRequest: SprintImports.queueRequest,
    OFFLINE_STATES: SprintImports.OFFLINE_STATES,
    CACHE_STRATEGIES: SprintImports.CACHE_STRATEGIES,
    
    // === SPRINT 5 ===
    createAccessibilityManager: SprintImports.createAccessibilityManager,
    getAccessibilityManager: SprintImports.getAccessibilityManager,
    announce: SprintImports.announce,
    setFocus: SprintImports.setFocus,
    trapFocus: SprintImports.trapFocus,
    setContrastMode: SprintImports.setContrastMode,
    setTextScale: SprintImports.setTextScale,
    enableA11yFeature: SprintImports.enableA11yFeature,
    A11Y_FEATURES: SprintImports.A11Y_FEATURES,
    ARIA_LIVE_REGIONS: SprintImports.ARIA_LIVE_REGIONS,
    CONTRAST_MODES: SprintImports.CONTRAST_MODES,
    createKeyboardNavigationManager: SprintImports.createKeyboardNavigationManager,
    getKeyboardNavigationManager: SprintImports.getKeyboardNavigationManager,
    registerGroup: SprintImports.registerGroup,
    unregisterGroup: SprintImports.unregisterGroup,
    focusFirst: SprintImports.focusFirst,
    focusLast: SprintImports.focusLast,
    focusNext: SprintImports.focusNext,
    focusPrevious: SprintImports.focusPrevious,
    registerShortcut: SprintImports.registerShortcut,
    unregisterShortcut: SprintImports.unregisterShortcut,
    KEY_CODES: SprintImports.KEY_CODES,
    NAVIGATION_MODES: SprintImports.NAVIGATION_MODES,
    FOCUS_WRAP: SprintImports.FOCUS_WRAP,
    createZoomManager: SprintImports.createZoomManager,
    getZoomManager: SprintImports.getZoomManager,
    setZoom: SprintImports.setZoom,
    zoomIn: SprintImports.zoomIn,
    zoomOut: SprintImports.zoomOut,
    zoomToFit: SprintImports.zoomToFit,
    zoomToActual: SprintImports.zoomToActual,
    resetZoom: SprintImports.resetZoom,
    ZOOM_PRESETS: SprintImports.ZOOM_PRESETS,
    ZOOM_ORIGINS: SprintImports.ZOOM_ORIGINS,
    createPrintManager: SprintImports.createPrintManager,
    getPrintManager: SprintImports.getPrintManager,
    print: SprintImports.print,
    printElement: SprintImports.printElement,
    printPreview: SprintImports.printPreview,
    addPageBreak: SprintImports.addPageBreak,
    markAvoidBreak: SprintImports.markAvoidBreak,
    PRINT_ORIENTATIONS: SprintImports.PRINT_ORIENTATIONS,
    PRINT_SIZES: SprintImports.PRINT_SIZES,
    PAGE_BREAK_MODES: SprintImports.PAGE_BREAK_MODES,
    createPanelBookmarksManager: SprintImports.createPanelBookmarksManager,
    getPanelBookmarksManager: SprintImports.getPanelBookmarksManager,
    addBookmark: SprintImports.addBookmark,
    removeBookmark: SprintImports.removeBookmark,
    getAllBookmarks: SprintImports.getAllBookmarks,
    isBookmarked: SprintImports.isBookmarked,
    navigateToBookmark: SprintImports.navigateToBookmark,
    getRecentPanels: SprintImports.getRecentPanels,
    getMostFrequent: SprintImports.getMostFrequent,
    BOOKMARK_TYPES: SprintImports.BOOKMARK_TYPES,
    SORT_MODES: SprintImports.SORT_MODES,
    
    // === SPRINT 6 ===
    createCommandPaletteManager: SprintImports.createCommandPaletteManager,
    getCommandPaletteManager: SprintImports.getCommandPaletteManager,
    registerCommand: SprintImports.registerCommand,
    registerCommands: SprintImports.registerCommands,
    COMMAND_TYPES: SprintImports.COMMAND_TYPES,
    PALETTE_MODES: SprintImports.PALETTE_MODES,
    createPanelSearchManager: SprintImports.createPanelSearchManager,
    getPanelSearchManager: SprintImports.getPanelSearchManager,
    search: SprintImports.search,
    nextMatch: SprintImports.nextMatch,
    previousMatch: SprintImports.previousMatch,
    clearSearch: SprintImports.clearSearch,
    SEARCH_MODES: SprintImports.SEARCH_MODES,
    MATCH_TYPES: SprintImports.MATCH_TYPES,
    createPanelTabsManager: SprintImports.createPanelTabsManager,
    getPanelTabsManager: SprintImports.getPanelTabsManager,
    addTab: SprintImports.addTab,
    closeTab: SprintImports.closeTab,
    activateTab: SprintImports.activateTab,
    TAB_STATES: SprintImports.TAB_STATES,
    TAB_POSITIONS: SprintImports.TAB_POSITIONS,
    CLOSE_BEHAVIORS: SprintImports.CLOSE_BEHAVIORS,
    createQuickActionsManager: SprintImports.createQuickActionsManager,
    getQuickActionsManager: SprintImports.getQuickActionsManager,
    addAction: SprintImports.addAction,
    removeAction: SprintImports.removeAction,
    FAB_POSITIONS: SprintImports.FAB_POSITIONS,
    MENU_DIRECTIONS: SprintImports.MENU_DIRECTIONS,
    ACTION_TYPES: SprintImports.ACTION_TYPES,
    createTourManager: SprintImports.createTourManager,
    getTourManager: SprintImports.getTourManager,
    registerTour: SprintImports.registerTour,
    startTour: SprintImports.startTour,
    endTour: SprintImports.endTour,
    TOUR_STATES: SprintImports.TOUR_STATES,
    TOUR_TOOLTIP_POSITIONS: SprintImports.TOUR_TOOLTIP_POSITIONS,
    
    // Namespaced access
    transitions: { create: SprintImports.createPanelTransitions, get: SprintImports.getPanelTransitions, TYPES: SprintImports.TRANSITION_TYPES },
    statePersistence: { create: SprintImports.createContainerStatePersistence, get: SprintImports.getContainerStatePersistence },
    performanceAPI: { create: SprintImports.createPerformanceAPI, get: SprintImports.getPerformanceAPI },
    skeletons: { create: SprintImports.createSkeletonManager, get: SprintImports.getSkeletonManager, show: SprintImports.showSkeleton, hide: SprintImports.hideSkeleton, showForPanel: SprintImports.showSkeletonForPanel, TYPES: SprintImports.SKELETON_TYPES, DELAYS: SprintImports.DELAY_VARIANTS },
    updateNotifier: { create: SprintImports.createUpdateNotifier, get: SprintImports.getUpdateNotifier, check: SprintImports.checkForUpdates, hasUpdate: SprintImports.hasUpdate, STATES: SprintImports.NOTIFIER_STATES, TYPES: SprintImports.UPDATE_TYPES },
    navigationHistory: { create: SprintImports.createNavigationHistory, get: SprintImports.getNavigationHistory, push: SprintImports.pushNavigation, back: SprintImports.goBack, forward: SprintImports.goForward, canGoBack: SprintImports.canGoBack, canGoForward: SprintImports.canGoForward, TYPES: SprintImports.NAVIGATION_TYPES },
    loadingProgress: { create: SprintImports.createLoadingProgress, get: SprintImports.getLoadingProgress, start: SprintImports.startLoading, done: SprintImports.doneLoading, set: SprintImports.setLoadingProgress, isLoading: SprintImports.isLoading, STATES: SprintImports.LOADING_STATES },
    splitView: { create: SprintImports.createSplitViewManager, get: SprintImports.getSplitViewManager, ORIENTATIONS: SprintImports.SPLIT_ORIENTATIONS, POSITIONS: SprintImports.SPLIT_POSITIONS },
    exportContent: { create: SprintImports.createExportContentManager, get: SprintImports.getExportContentManager, toPNG: SprintImports.exportToPNG, toJPEG: SprintImports.exportToJPEG, toPDF: SprintImports.exportToPDF, toSVG: SprintImports.exportToSVG, export: SprintImports.exportElement, FORMATS: SprintImports.EXPORT_FORMATS, QUALITY: SprintImports.EXPORT_QUALITY },
    offlineMode: { create: SprintImports.createOfflineModeManager, get: SprintImports.getOfflineModeManager, fetch: SprintImports.cachedFetch, cache: SprintImports.cacheUrl, getCached: SprintImports.getCached, clearCache: SprintImports.clearCache, getSize: SprintImports.getCacheSize, queue: SprintImports.queueRequest, STATES: SprintImports.OFFLINE_STATES, STRATEGIES: SprintImports.CACHE_STRATEGIES },
    accessibility: { create: SprintImports.createAccessibilityManager, get: SprintImports.getAccessibilityManager, announce: SprintImports.announce, setFocus: SprintImports.setFocus, trapFocus: SprintImports.trapFocus, setContrast: SprintImports.setContrastMode, setTextScale: SprintImports.setTextScale, enableFeature: SprintImports.enableA11yFeature, FEATURES: SprintImports.A11Y_FEATURES, LIVE: SprintImports.ARIA_LIVE_REGIONS, CONTRAST: SprintImports.CONTRAST_MODES },
    keyboardNav: { create: SprintImports.createKeyboardNavigationManager, get: SprintImports.getKeyboardNavigationManager, registerGroup: SprintImports.registerGroup, unregisterGroup: SprintImports.unregisterGroup, focusFirst: SprintImports.focusFirst, focusLast: SprintImports.focusLast, focusNext: SprintImports.focusNext, focusPrevious: SprintImports.focusPrevious, registerShortcut: SprintImports.registerShortcut, unregisterShortcut: SprintImports.unregisterShortcut, KEYS: SprintImports.KEY_CODES, MODES: SprintImports.NAVIGATION_MODES, WRAP: SprintImports.FOCUS_WRAP },
    zoom: { create: SprintImports.createZoomManager, get: SprintImports.getZoomManager, set: SprintImports.setZoom, in: SprintImports.zoomIn, out: SprintImports.zoomOut, fit: SprintImports.zoomToFit, actual: SprintImports.zoomToActual, reset: SprintImports.resetZoom, PRESETS: SprintImports.ZOOM_PRESETS, ORIGINS: SprintImports.ZOOM_ORIGINS },

    // @ts-expect-error TS migration - TS1117
    print: { create: SprintImports.createPrintManager, get: SprintImports.getPrintManager, print: SprintImports.print, element: SprintImports.printElement, preview: SprintImports.printPreview, addBreak: SprintImports.addPageBreak, avoidBreak: SprintImports.markAvoidBreak, ORIENTATIONS: SprintImports.PRINT_ORIENTATIONS, SIZES: SprintImports.PRINT_SIZES, BREAKS: SprintImports.PAGE_BREAK_MODES },
    bookmarks: { create: SprintImports.createPanelBookmarksManager, get: SprintImports.getPanelBookmarksManager, add: SprintImports.addBookmark, remove: SprintImports.removeBookmark, getAll: SprintImports.getAllBookmarks, isBookmarked: SprintImports.isBookmarked, navigate: SprintImports.navigateToBookmark, getRecent: SprintImports.getRecentPanels, getMostFrequent: SprintImports.getMostFrequent, TYPES: SprintImports.BOOKMARK_TYPES, SORT: SprintImports.SORT_MODES },
    commandPalette: { create: SprintImports.createCommandPaletteManager, get: SprintImports.getCommandPaletteManager, register: SprintImports.registerCommand, registerMany: SprintImports.registerCommands, TYPES: SprintImports.COMMAND_TYPES, MODES: SprintImports.PALETTE_MODES },
    panelSearch: { create: SprintImports.createPanelSearchManager, get: SprintImports.getPanelSearchManager, search: SprintImports.search, next: SprintImports.nextMatch, prev: SprintImports.previousMatch, clear: SprintImports.clearSearch, MODES: SprintImports.SEARCH_MODES, MATCH: SprintImports.MATCH_TYPES },
    panelTabs: { create: SprintImports.createPanelTabsManager, get: SprintImports.getPanelTabsManager, add: SprintImports.addTab, close: SprintImports.closeTab, activate: SprintImports.activateTab, STATES: SprintImports.TAB_STATES, POSITIONS: SprintImports.TAB_POSITIONS, CLOSE: SprintImports.CLOSE_BEHAVIORS },
    quickActions: { create: SprintImports.createQuickActionsManager, get: SprintImports.getQuickActionsManager, add: SprintImports.addAction, remove: SprintImports.removeAction, POSITIONS: SprintImports.FAB_POSITIONS, DIRECTIONS: SprintImports.MENU_DIRECTIONS, TYPES: SprintImports.ACTION_TYPES },
    tour: { create: SprintImports.createTourManager, get: SprintImports.getTourManager, register: SprintImports.registerTour, start: SprintImports.startTour, end: SprintImports.endTour, STATES: SprintImports.TOUR_STATES, TOOLTIP: SprintImports.TOUR_TOOLTIP_POSITIONS },
    
    // Info method
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        sprint1Modules: ['PanelTransitions', 'ContainerStatePersistence', 'PerformanceAPI'],
        sprint2Modules: ['SkeletonManager', 'UpdateNotifier'],
        sprint3Modules: ['NavigationHistory', 'LoadingProgress'],
        sprint4Modules: ['SplitViewManager', 'ExportContentManager', 'OfflineModeManager'],
        sprint5Modules: ['AccessibilityManager', 'KeyboardNavigationManager', 'ZoomManager', 'PrintManager', 'PanelBookmarksManager'],
        sprint6Modules: ['CommandPaletteManager', 'PanelSearchManager', 'PanelTabsManager', 'QuickActionsManager', 'TourManager'],
        totalModules: 20,
        isBootstrapped: true
      };
    }
  };
  
  if (managers && managers.get('logger')) {
    managers.get('logger').info('Globals exposed: (window as any).CMBootstrap, (window as any).ContainerMain (with Sprint 1-6 modules)');
  }
}

/**
 * Limpa globals na shutdown
 */
export function clearGlobals() {
  if (typeof window !== 'undefined') {
    (window as any).CMBootstrap = null;
    (window as any).ContainerMain = null;
  }
}

export default {
  exposeGlobals,
  clearGlobals
};
