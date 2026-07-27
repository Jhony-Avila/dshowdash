import { postMessage } from "../messaging/manager.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.cache.manager";
function clearCache(cacheName) {
  return postMessage({
    type: "CLEAR_CACHE",
    cacheName: cacheName || null
  });
}
function precache(urls) {
  return postMessage({
    type: "PRECACHE",
    urls
  });
}
function getCacheNames() {
  if (typeof caches === "undefined") {
    return Promise.resolve([]);
  }
  return caches.keys();
}
function getCacheSize() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return Promise.resolve({ usage: 0, quota: 0 });
  }
  return navigator.storage.estimate().then((estimate) => ({
    usage: estimate.usage || 0,
    quota: estimate.quota || 0,
    // @ts-expect-error strict migration — TS18048
    usagePercent: estimate.quota ? Math.round(estimate.usage / estimate.quota * 100) : 0
  }));
}
export {
  MODULE_ID,
  VERSION,
  clearCache,
  getCacheNames,
  getCacheSize,
  precache
};
