import { getBookmarks, setBookmarks, incrementMetric } from "../state.js";
import { log, emit } from "../helpers/logger.js";
import { saveBookmarks } from "../storage/bookmarks.js";
import { trackPanelAccess } from "./frequency.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.operations.navigation";
function navigateToBookmark(bookmarkId) {
  const bookmarks = getBookmarks();
  const bookmark = bookmarks.find((b) => b.id === bookmarkId);
  if (!bookmark) return null;
  bookmark.lastAccessed = Date.now();
  bookmark.accessCount = (bookmark.accessCount || 0) + 1;
  saveBookmarks();
  incrementMetric("bookmarksAccessed");
  trackPanelAccess(bookmark.panelId);
  emit("bookmarkNavigated", { bookmark });
  log("info", "Navigating to bookmark:", bookmark.title);
  return bookmark;
}
function reorderBookmarks(orderedIds) {
  if (!Array.isArray(orderedIds)) return false;
  const bookmarks = getBookmarks();
  orderedIds.forEach((id, index) => {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      bookmark.order = index;
    }
  });
  bookmarks.sort((a, b) => a.order - b.order);
  saveBookmarks();
  emit("bookmarksReordered", { order: orderedIds });
  return true;
}
function clearBookmarks() {
  const bookmarks = getBookmarks();
  const count = bookmarks.length;
  setBookmarks([]);
  saveBookmarks();
  emit("bookmarksCleared", { count });
  return count;
}
export {
  MODULE_ID,
  VERSION,
  clearBookmarks,
  navigateToBookmark,
  reorderBookmarks
};
