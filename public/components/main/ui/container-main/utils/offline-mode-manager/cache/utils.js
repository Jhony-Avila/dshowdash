import { getConfig } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.offline-mode-manager.cache.utils";
function _isExpired(metadata) {
  const config = getConfig();
  if (!metadata || !metadata.timestamp) return true;
  return Date.now() - metadata.timestamp > config.maxAge;
}
function _createCacheKey(url) {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.href;
  } catch (e) {
    return url;
  }
}
export {
  MODULE_ID,
  VERSION,
  _createCacheKey,
  _isExpired
};
