import { SORT_MODES } from "../constants.js";
import { getConfig } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.helpers.sorting";
function sortBookmarks(bookmarks) {
  const config = getConfig();
  switch (config.sortMode) {
    case SORT_MODES.ALPHABETICAL:
      return [...bookmarks].sort((a, b) => (a.title || a.panelId).localeCompare(b.title || b.panelId));
    case SORT_MODES.RECENT:
      return [...bookmarks].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    case SORT_MODES.FREQUENCY:
      return [...bookmarks].sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
    case SORT_MODES.MANUAL:
    default:
      return [...bookmarks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}
export {
  MODULE_ID,
  VERSION,
  sortBookmarks
};
