import { STORAGE_KEY, CACHE_METADATA_KEY } from "../constants.js";
import { getConfig, getOfflineQueue, getCacheMetadata } from "../state.js";
import { _log } from "./logger.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.offline-mode-manager.helpers.storage";
function _saveState() {
  const config = getConfig();
  if (!config.persistState) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      offlineQueue: getOfflineQueue(),
      lastSync: Date.now()
    }));
  } catch (e) {
    _log("warn", "Failed to save state:", e.message);
  }
}
function _loadState() {
  const config = getConfig();
  if (!config.persistState) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function _saveCacheMetadata() {
  try {
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(getCacheMetadata()));
  } catch (e) {
    _log("warn", "Failed to save cache metadata:", e.message);
  }
}
function _loadCacheMetadata() {
  try {
    const raw = localStorage.getItem(CACHE_METADATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
export {
  MODULE_ID,
  VERSION,
  _loadCacheMetadata,
  _loadState,
  _saveCacheMetadata,
  _saveState
};
