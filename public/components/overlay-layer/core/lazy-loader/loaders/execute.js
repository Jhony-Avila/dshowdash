import { config, incrementMetric } from "../state.js";
import { getCacheKey, getFromCache, addToCache } from "../cache/operations.js";
import { findLoader } from "./registry.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.loaders.execute";
async function loadWithRetry(loader, context, attempts = 0) {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Load timeout")), config.timeout);
    });
    const loadPromise = Promise.resolve(loader(context));
    const result = await Promise.race([loadPromise, timeoutPromise]);
    return { ok: true, data: result };
  } catch (error) {
    if (attempts < config.retryAttempts) {
      await new Promise((r) => setTimeout(r, config.retryDelay * (attempts + 1)));
      return loadWithRetry(loader, context, attempts + 1);
    }
    return { ok: false, error: error.message };
  }
}
async function load(type, options = {}) {
  if (!config.enabled) {
    return { ok: false, error: "lazy-loader-disabled" };
  }
  incrementMetric("totalLoads");
  const cacheKey = getCacheKey(type, options.id);
  if (!options.skipCache) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return { ok: true, data: cached, fromCache: true };
    }
  }
  incrementMetric("cacheMisses");
  const loader = findLoader(type);
  if (!loader) {
    return { ok: false, error: "no-loader-registered", type };
  }
  const result = await loadWithRetry(loader, { type, ...options });
  if (result.ok) {
    addToCache(cacheKey, result.data);
    return { ok: true, data: result.data, fromCache: false };
  }
  incrementMetric("errors");
  return { ok: false, error: result.error };
}
export {
  MODULE_ID,
  VERSION,
  load,
  loadWithRetry
};
