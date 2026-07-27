// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.9.0-SPRINT6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sprint-imports
// PURPOSE: Bootstrap Integration - Sprint Imports
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createPanelTransitions — exported value
//   getPanelTransitions — exported value
//   TRANSITION_TYPES — exported value
//   createContainerStatePersistence — exported value
//   getContainerStatePersistence — exported value
//   createPerformanceAPI — exported value
//   getPerformanceAPI — exported value
//   createSkeletonManager — exported value
//   getSkeletonManager — exported value
//   showSkeleton — exported value
//   hideSkeleton — exported value
//   showSkeletonForPanel — exported value
//   SKELETON_TYPES — exported value
//   DELAY_VARIANTS — exported value
//   createUpdateNotifier — exported value
//   getUpdateNotifier — exported value
//   checkForUpdates — exported value
//   hasUpdate — exported value
//   NOTIFIER_STATES — exported value
//   UPDATE_TYPES — exported value
//   ... and 129 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap-integration.globals.sprint-imports';

// Sprint 1 imports
export {
  createPanelTransitions,
  getPanelTransitions,
  TRANSITION_TYPES
} from '../../utils/panel-transitions.js';

export {
  createContainerStatePersistence,
  getContainerStatePersistence
} from '../../utils/container-state-persistence.js';

export {
  createPerformanceAPI,
  getPerformanceAPI
} from '../../utils/performance-api/index.js';

// Sprint 2 imports
export {
  createSkeletonManager,
  getSkeletonManager,
  showSkeleton,
  hideSkeleton,
  showSkeletonForPanel,
  SKELETON_TYPES,
  DELAY_VARIANTS
} from '../../utils/skeleton-manager.js';

export {
  createUpdateNotifier,
  getUpdateNotifier,
  checkForUpdates,
  hasUpdate,
  NOTIFIER_STATES,
  UPDATE_TYPES
} from '../../utils/update-notifier/index.js';

// Sprint 3 imports
export {
  createNavigationHistory,
  getNavigationHistory,
  pushNavigation,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  NAVIGATION_TYPES
} from '../../utils/navigation-history/index.js';

export {
  createLoadingProgress,
  getLoadingProgress,
  startLoading,
  doneLoading,
  setLoadingProgress,
  isLoading,
  LOADING_STATES
} from '../../utils/loading-progress/index.js';

// Sprint 4 imports
export {
  createSplitViewManager,
  getSplitViewManager,
  SPLIT_ORIENTATIONS,
  SPLIT_POSITIONS
} from '../../utils/split-view-manager/index.js';

export {
  createExportContentManager,
  getExportContentManager,
  exportToPNG,
  exportToJPEG,
  exportToPDF,
  exportToSVG,
  exportElement,
  EXPORT_FORMATS,
  EXPORT_QUALITY
} from '../../utils/export-content-manager/index.js';

export {
  createOfflineModeManager,
  getOfflineModeManager,
  cachedFetch,
  cacheUrl,
  getCached,
  clearCache,
  getCacheSize,
  queueRequest,
  OFFLINE_STATES,
  CACHE_STRATEGIES
} from '../../utils/offline-mode-manager/index.js';

// Sprint 5 imports
export {
  createAccessibilityManager,
  getAccessibilityManager,
  announce,
  setFocus,
  trapFocus,
  setContrastMode,
  setTextScale,
  enableFeature as enableA11yFeature,
  A11Y_FEATURES,
  ARIA_LIVE_REGIONS,
  CONTRAST_MODES
} from '../../utils/accessibility-manager/index.js';

export {
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
  FOCUS_WRAP
} from '../../utils/keyboard-navigation-manager/index.js';

export {
  createZoomManager,
  getZoomManager,
  setZoom,
  zoomIn,
  zoomOut,
  zoomToFit,
  zoomToActual,
  resetZoom,
  ZOOM_PRESETS,
  ZOOM_ORIGINS
} from '../../utils/zoom-manager.js';

export {
  createPrintManager,
  getPrintManager,
  print,
  printElement,
  printPreview,
  addPageBreak,
  markAvoidBreak,
  PRINT_ORIENTATIONS,
  PRINT_SIZES,
  PAGE_BREAK_MODES
} from '../../utils/print-manager/index.js';

export {
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
  SORT_MODES
} from '../../utils/panel-bookmarks-manager/index.js';

// Sprint 6 imports
export {
  createCommandPaletteManager,
  getCommandPaletteManager,
  registerCommand,
  registerCommands,
  COMMAND_TYPES,
  PALETTE_MODES
} from '../../utils/command-palette-manager/index.js';

export {
  createPanelSearchManager,
  getPanelSearchManager,
  search,
  nextMatch,
  previousMatch,
  clearSearch,
  SEARCH_MODES,
  MATCH_TYPES
} from '../../utils/panel-search-manager/index.js';

export {
  createPanelTabsManager,
  getPanelTabsManager,
  addTab,
  closeTab,
  activateTab,
  TAB_STATES,
  TAB_POSITIONS,
  CLOSE_BEHAVIORS
} from '../../utils/panel-tabs-manager/index.js';

export {
  createQuickActionsManager,
  getQuickActionsManager,
  addAction,
  removeAction,
  FAB_POSITIONS,
  MENU_DIRECTIONS,
  ACTION_TYPES
} from '../../utils/quick-actions-manager.js';

export {
  createTourManager,
  getTourManager,
  registerTour,
  startTour,
  endTour,
  TOUR_STATES,
  TOOLTIP_POSITIONS as TOUR_TOOLTIP_POSITIONS
} from '../../utils/tour-manager.js';
