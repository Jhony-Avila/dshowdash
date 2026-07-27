import { createLogger } from "./logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-sw-helper";
const logger = createLogger(MODULE_ID);
let _registration = null;
let _isSupported = "serviceWorker" in navigator;
async function register(swPath = "/sw.js", options = {}) {
  if (!_isSupported) {
    logger.warn("Service Workers not supported");
    return null;
  }
  try {
    _registration = await navigator.serviceWorker.register(swPath, options);
    _registration.addEventListener("updatefound", () => {
      const newWorker = _registration.installing;
      newWorker?.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          dispatchEvent(new CustomEvent("sw:update-available"));
        }
      });
    });
    return _registration;
  } catch (error) {
    logger.error("Registration failed", { error: error.message });
    return null;
  }
}
async function unregister() {
  if (!_registration) return false;
  return _registration.unregister();
}
async function checkForUpdates() {
  if (!_registration) return null;
  await _registration.update();
  return _registration;
}
function skipWaiting() {
  if (_registration?.waiting) {
    _registration.waiting.postMessage({ type: "SKIP_WAITING" });
    return true;
  }
  return false;
}
function postMessage(message) {
  if (!navigator.serviceWorker.controller) return false;
  navigator.serviceWorker.controller.postMessage(message);
  return true;
}
function onMessage(callback) {
  if (!_isSupported) return () => {
  };
  const handler = (event) => callback(event.data);
  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}
async function getCacheNames() {
  if (!("caches" in window)) return [];
  return caches.keys();
}
async function clearCache(cacheName) {
  if (!("caches" in window)) return false;
  return caches.delete(cacheName);
}
async function clearAllCaches() {
  const names = await getCacheNames();
  await Promise.all(names.map((name) => caches.delete(name)));
  return names.length;
}
async function getCacheSize(cacheName) {
  if (!("caches" in window)) return 0;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let size = 0;
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      size += blob.size;
    }
  }
  return size;
}
async function precache(urls, cacheName = "precache-v1") {
  if (!("caches" in window)) return 0;
  const cache = await caches.open(cacheName);
  await cache.addAll(urls);
  return urls.length;
}
function isOnline() {
  return navigator.onLine;
}
function onOnlineStatusChange(callback) {
  const onlineHandler = () => callback(true);
  const offlineHandler = () => callback(false);
  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", offlineHandler);
  return () => {
    window.removeEventListener("online", onlineHandler);
    window.removeEventListener("offline", offlineHandler);
  };
}
function getStatus() {
  return {
    isSupported: _isSupported,
    isRegistered: !!_registration,
    isControlled: !!navigator.serviceWorker?.controller,
    isOnline: navigator.onLine,
    // @ts-expect-error TS migration - TS2339
    state: _registration?.active?.state || "none"
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, ...getStatus() };
}
function healthCheck() {
  const status = getStatus();
  return {
    status: status.isSupported ? "HEALTHY" : "UNSUPPORTED",
    version: VERSION,
    moduleId: MODULE_ID,
    ...status
  };
}
var service_worker_helper_default = {
  register,
  unregister,
  checkForUpdates,
  skipWaiting,
  postMessage,
  onMessage,
  getCacheNames,
  clearCache,
  clearAllCaches,
  getCacheSize,
  precache,
  isOnline,
  onOnlineStatusChange,
  getStatus,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  checkForUpdates,
  clearAllCaches,
  clearCache,
  service_worker_helper_default as default,
  getCacheNames,
  getCacheSize,
  getStatus,
  healthCheck,
  info,
  isOnline,
  onMessage,
  onOnlineStatusChange,
  postMessage,
  precache,
  register,
  skipWaiting,
  unregister
};
