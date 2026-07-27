import { VERSION, MODULE_ID, BOOKMARK_TYPES, SORT_MODES, DEFAULT_CONFIG } from "./constants.js";
import {
  getInstance,
  setInstance,
  getConfig,
  setConfig,
  updateConfig,
  setBookmarks,
  setRecentPanels,
  setPanelFrequency,
  getBookmarks,
  _listeners,
  getMetrics
} from "./state.js";
import { log, emit } from "./helpers/logger.js";
import { loadBookmarks } from "./storage/bookmarks.js";
import { loadRecentPanels } from "./storage/recent.js";
import { loadFrequency } from "./storage/frequency.js";
import { setupHotkeys } from "./hotkeys/manager.js";
import {
  addBookmark,
  removeBookmark,
  updateBookmark,
  getBookmark,
  getAllBookmarks,
  getBookmarkByPanelId,
  isBookmarked
} from "./operations/crud.js";
import { navigateToBookmark, reorderBookmarks, clearBookmarks } from "./operations/navigation.js";
import { addToRecent, getRecentPanels, clearRecentPanels } from "./operations/recent.js";
import { getMostFrequent, trackPanelAccess } from "./operations/frequency.js";
import { exportBookmarks, importBookmarks } from "./import-export.js";
function createPanelBookmarksManager(options = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  setBookmarks(loadBookmarks());
  setRecentPanels(loadRecentPanels());
  setPanelFrequency(loadFrequency());
  const config = getConfig();
  if (config.enableHotkeys) {
    setupHotkeys();
  }
  log("debug", "Panel Bookmarks Manager created", { bookmarks: getBookmarks().length });
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
function getPanelBookmarksManager(options = {}) {
  if (!getInstance()) {
    setInstance(createPanelBookmarksManager(options));
  }
  return getInstance();
}
function setSortMode(mode) {
  if (!Object.values(SORT_MODES).includes(mode)) return false;
  updateConfig({ sortMode: mode });
  emit("sortModeChanged", { mode });
  return true;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
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
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
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
function info() {
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
export {
  addBookmark,
  addToRecent,
  clearBookmarks,
  clearRecentPanels,
  createPanelBookmarksManager,
  exportBookmarks,
  getAllBookmarks,
  getBookmark,
  getBookmarkByPanelId,
  getMostFrequent,
  getPanelBookmarksManager,
  getRecentPanels,
  healthCheck,
  importBookmarks,
  info,
  isBookmarked,
  navigateToBookmark,
  removeBookmark,
  reorderBookmarks,
  setSortMode,
  subscribe,
  trackPanelAccess,
  updateBookmark
};
