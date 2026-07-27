import { BOOKMARK_TYPES } from "../constants.js";
import { getConfig, getBookmarks, incrementMetric } from "../state.js";
import { log, emit, generateId } from "../helpers/logger.js";
import { sortBookmarks } from "../helpers/sorting.js";
import { saveBookmarks } from "../storage/bookmarks.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.operations.crud";
function addBookmark(bookmarkData) {
  const config = getConfig();
  const bookmarks = getBookmarks();
  if (bookmarks.length >= config.maxBookmarks) {
    log("warn", "Maximum bookmarks reached");
    emit("maxBookmarksReached", { max: config.maxBookmarks });
    return null;
  }
  const { panelId, title, icon, state, type = BOOKMARK_TYPES.PANEL, metadata: metadataOpt = {} } = bookmarkData;
  if (!panelId) {
    log("error", "panelId is required");
    return null;
  }
  if (isBookmarked(panelId)) {
    log("warn", "Panel already bookmarked:", panelId);
    return getBookmarkByPanelId(panelId);
  }
  const bookmark = {
    id: generateId(),
    panelId,
    title: title || panelId,
    icon: icon || "\u{1F4CC}",
    type,
    state: state || null,
    metadata: metadataOpt,
    order: bookmarks.length,
    createdAt: Date.now(),
    lastAccessed: null,
    accessCount: 0
  };
  bookmarks.push(bookmark);
  saveBookmarks();
  incrementMetric("bookmarksAdded");
  emit("bookmarkAdded", { bookmark });
  log("info", "Bookmark added:", bookmark.title);
  return bookmark;
}
function removeBookmark(bookmarkId) {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((b) => b.id === bookmarkId);
  if (index === -1) return false;
  const [removed] = bookmarks.splice(index, 1);
  bookmarks.forEach((b, i) => b.order = i);
  saveBookmarks();
  incrementMetric("bookmarksRemoved");
  emit("bookmarkRemoved", { bookmark: removed });
  log("info", "Bookmark removed:", removed.title);
  return true;
}
function updateBookmark(bookmarkId, updates) {
  const bookmarks = getBookmarks();
  const bookmark = bookmarks.find((b) => b.id === bookmarkId);
  if (!bookmark) return null;
  const allowedFields = ["title", "icon", "state", "metadata", "order"];
  allowedFields.forEach((field) => {
    if (updates[field] !== void 0) {
      bookmark[field] = updates[field];
    }
  });
  bookmark.updatedAt = Date.now();
  saveBookmarks();
  emit("bookmarkUpdated", { bookmark });
  return bookmark;
}
function getBookmark(bookmarkId) {
  return getBookmarks().find((b) => b.id === bookmarkId) || null;
}
function getAllBookmarks(sorted = true) {
  const bookmarks = getBookmarks();
  return sorted ? sortBookmarks(bookmarks) : [...bookmarks];
}
function getBookmarkByPanelId(panelId) {
  return getBookmarks().find((b) => b.panelId === panelId) || null;
}
function isBookmarked(panelId) {
  return getBookmarks().some((b) => b.panelId === panelId);
}
export {
  MODULE_ID,
  VERSION,
  addBookmark,
  getAllBookmarks,
  getBookmark,
  getBookmarkByPanelId,
  isBookmarked,
  removeBookmark,
  updateBookmark
};
