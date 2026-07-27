// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel Bookmarks Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, BOOKMARK_TYPES, SORT_MODES from ./constants.js
//   createPanelBookmarksManager, getPanelBookmarksManager, addBookmark, removeBoo...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BOOKMARK_TYPES — exported value
//   SORT_MODES — exported value
//   createPanelBookmarksManager — exported value
//   getPanelBookmarksManager — exported value
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
//   ... and 7 more exports
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

export { VERSION, MODULE_ID, BOOKMARK_TYPES, SORT_MODES } from './constants.js';

export {
  createPanelBookmarksManager,
  getPanelBookmarksManager,
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
  subscribe,
  healthCheck,
  info
} from './api.js';

import { VERSION, MODULE_ID, BOOKMARK_TYPES, SORT_MODES } from './constants.js';
import {
  createPanelBookmarksManager,
  getPanelBookmarksManager,
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
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  BOOKMARK_TYPES,
  SORT_MODES,
  createPanelBookmarksManager,
  getPanelBookmarksManager,
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
  subscribe,
  healthCheck,
  info
};
