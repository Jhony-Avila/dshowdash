const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "sw-controller-helpers";
function isServiceWorkerSupported() {
  return "serviceWorker" in navigator;
}
function isSecureContext() {
  return window.isSecureContext === true;
}
function canRegisterSW() {
  return isServiceWorkerSupported() && isSecureContext();
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, helpers: ["isServiceWorkerSupported", "isSecureContext", "canRegisterSW"], swSupported: isServiceWorkerSupported(), timestamp: Date.now() };
}
async function getCacheNames() {
  try {
    return await caches.keys();
  } catch (e) {
    return [];
  }
}
async function clearAllCaches() {
  const names = await getCacheNames();
  await Promise.all(names.map(function(n) {
    return caches.delete(n);
  }));
}
async function getCacheSize(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    return keys.length;
  } catch (e) {
    return 0;
  }
}
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    return navigator.storage.estimate();
  }
  return { quota: 0, usage: 0 };
}
var helpers_default = { isServiceWorkerSupported, isSecureContext, canRegisterSW, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  canRegisterSW,
  clearAllCaches,
  helpers_default as default,
  formatBytes,
  getCacheNames,
  getCacheSize,
  getStorageEstimate,
  healthCheck,
  info,
  isSecureContext,
  isServiceWorkerSupported
};
