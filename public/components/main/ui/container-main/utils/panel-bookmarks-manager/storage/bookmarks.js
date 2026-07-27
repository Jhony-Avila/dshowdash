import { STORAGE_KEY } from "../constants.js";
import { getConfig, getBookmarks } from "../state.js";
import { log } from "../helpers/logger.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.storage.bookmarks";
function saveBookmarks() {
  const config = getConfig();
  if (!config.persistBookmarks) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getBookmarks()));
  } catch (e) {
    log("warn", "Failed to save bookmarks:", e.message);
  }
}
function loadBookmarks() {
  const config = getConfig();
  if (!config.persistBookmarks) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
export {
  MODULE_ID,
  VERSION,
  loadBookmarks,
  saveBookmarks
};
