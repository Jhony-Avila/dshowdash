import { getConfig, getCacheMetadata, deleteCacheMetadata } from "../state.js";
import { _log } from "../helpers/logger.js";
import { _saveCacheMetadata } from "../helpers/storage.js";
import { _isExpired } from "./utils.js";
import { _openCache } from "./manager.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.offline-mode-manager.cache.cleanup";
async function _cleanupCache() {
  const cache = await _openCache();
  if (!cache) return;
  const config = getConfig();
  const metadata = getCacheMetadata();
  try {
    const keys = Object.keys(metadata);
    const expiredKeys = keys.filter((key) => _isExpired(metadata[key]));
    for (const key of expiredKeys) {
      await cache.delete(key);
      deleteCacheMetadata(key);
    }
    const remainingKeys = Object.keys(getCacheMetadata());
    if (remainingKeys.length > config.maxItems) {
      const sorted = remainingKeys.sort(
        (a, b) => (
          // @ts-expect-error TS migration - TS2339
          (metadata[b]?.timestamp || 0) - (metadata[a]?.timestamp || 0)
        )
      );
      const toRemove = sorted.slice(config.maxItems);
      for (const key of toRemove) {
        await cache.delete(key);
        deleteCacheMetadata(key);
      }
    }
    _saveCacheMetadata();
  } catch (e) {
    _log("warn", "Cache cleanup failed:", e.message);
  }
}
export {
  MODULE_ID,
  VERSION,
  _cleanupCache
};
