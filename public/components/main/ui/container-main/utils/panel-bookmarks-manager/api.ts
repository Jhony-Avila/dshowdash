// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Panel Bookmarks Manager - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, BOOKMARK_TYPES, SORT_MODES, DEFAULT_CONFIG from ./constan...
//   getInstance, setInstance, getConfig, setConfig, updateConfig, setBookmarks, s...
//   log, emit from ./helpers/logger.js
//   loadBookmarks from ./storage/bookmarks.js
//   loadRecentPanels from ./storage/recent.js
//   loadFrequency from ./storage/frequency.js
//   setupHotkeys from ./hotkeys/manager.js
//   addBookmark, removeBookmark, updateBookmark, getBookmark, getAllBookmarks, ge...
//   navigateToBookmark, reorderBookmarks, clearBookmarks from ./operations/naviga...
//   addToRecent, getRecentPanels, clearRecentPanels from ./operations/recent.js
//   getMostFrequent, trackPanelAccess from ./operations/frequency.js
//   exportBookmarks, importBookmarks from ./import-export.js
//
// PROVIDES:
//   createPanelBookmarksManager() — exported function
//   getPanelBookmarksManager() — exported function
//   setSortMode() — exported function
//   subscribe() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   addBookmark — exported value
//   removeBookmark — exported value
//   updateBookmark — exported value
//   getBookmark — exported value
//   getAllBookmarks — exported value
//   getBookmarkByPanelId — exported value
//   isBookmarked — exported value
//   navigateToBookmark — exported value
//   reorderBookmarks — exported value
//   clearBookmarks — exported value
//   addToRecent — exported value
//   getRecentPanels — exported value
//   clearRecentPanels — exported value
//   getMostFrequent — exported value
//   ... and 3 more exports
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

import { VERSION, MODULE_ID, BOOKMARK_TYPES, SORT_MODES, DEFAULT_CONFIG } from './constants.js';
import {
  getInstance, setInstance, getConfig, setConfig, updateConfig,
  setBookmarks, setRecentPanels, setPanelFrequency,
  getBookmarks, _listeners, getMetrics
} from './state.js';
import { log, emit } from './helpers/logger.js';
import { loadBookmarks } from './storage/bookmarks.js';
import { loadRecentPanels } from './storage/recent.js';
import { loadFrequency } from './storage/frequency.js';
import { setupHotkeys } from './hotkeys/manager.js';
import {
  addBookmark, removeBookmark, updateBookmark, getBookmark,
  getAllBookmarks, getBookmarkByPanelId, isBookmarked
} from './operations/crud.js';
import { navigateToBookmark, reorderBookmarks, clearBookmarks } from './operations/navigation.js';
import { addToRecent, getRecentPanels, clearRecentPanels } from './operations/recent.js';
import { getMostFrequent, trackPanelAccess } from './operations/frequency.js';
import { exportBookmarks, importBookmarks } from './import-export.js';

export function createPanelBookmarksManager(options: Record<string, unknown> = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  setBookmarks(loadBookmarks());
  setRecentPanels(loadRecentPanels());
  setPanelFrequency(loadFrequency());
  
  const config = getConfig();
  if (config.enableHotkeys) {
    setupHotkeys();
  }
  
  log('debug', 'Panel Bookmarks Manager created', { bookmarks: getBookmarks().length });
  
  return {
    addBookmark,
    removeBookmark,
    updateBookmark,
    getBookmark,
    getAllBookmarks,
    getBookmarkByPanelId,
    isBookmarked,
    navigateToBookmark,
    reorderBookmarks,
    clearBookmarks,
    addToRecent,
    getRecentPanels,
    clearRecentPanels,
    getMostFrequent,
    trackPanelAccess,
    exportBookmarks,
    importBookmarks,
    setSortMode,
    getSortMode: () => getConfig().sortMode,
    subscribe,
    healthCheck,
    info
  };
}

export function getPanelBookmarksManager(options: Record<string, unknown> = {}) {
  if (!getInstance()) {
    setInstance(createPanelBookmarksManager(options));
  }
  return getInstance();
}

export function setSortMode(mode: string) {
  // @ts-expect-error TS migration - TS2345
  if (!Object.values(SORT_MODES).includes(mode)) return false;
  updateConfig({ sortMode: mode });
  emit('sortModeChanged', { mode });
  return true;
}

export function subscribe(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

export function healthCheck() {
  const config = getConfig();
  const bookmarks = getBookmarks();
  const metrics = getMetrics();
  
  const checks = {
    hasBookmarks: bookmarks.length > 0,
    underLimit: bookmarks.length < config.maxBookmarks,
    noErrors: metrics.errors === 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${total}`,
    checks,
    bookmarkCount: bookmarks.length,
    recentCount: getRecentPanels().length,
    maxBookmarks: config.maxBookmarks,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    bookmarkTypes: Object.values(BOOKMARK_TYPES),
    sortModes: Object.values(SORT_MODES),
    config: {
      maxBookmarks: config.maxBookmarks,
      maxRecentPanels: config.maxRecentPanels,
      sortMode: config.sortMode,
      enableHotkeys: config.enableHotkeys
    },
    bookmarkCount: getBookmarks().length,
    recentCount: getRecentPanels().length,
    mostFrequent: getMostFrequent(5)
  };
}

// Re-exports
export { addBookmark, removeBookmark, updateBookmark, getBookmark, getAllBookmarks, getBookmarkByPanelId, isBookmarked };
export { navigateToBookmark, reorderBookmarks, clearBookmarks };
export { addToRecent, getRecentPanels, clearRecentPanels };
export { getMostFrequent, trackPanelAccess };
export { exportBookmarks, importBookmarks };
