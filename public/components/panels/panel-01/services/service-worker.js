import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01.services.service-worker";
const SW_PATH = "/sw-panel01.js";
const CACHE_NAME = "panel01-v2";
const hasWindow = typeof window !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[SW]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "info") logger.info?.(prefix, ...args);
  else logger.debug?.(prefix, ...args);
};
class ServiceWorkerManager {
  constructor(options = {}) {
    this.onUpdate = options.onUpdate || (() => {
    });
    this.onOffline = options.onOffline || (() => {
    });
    this.onOnline = options.onOnline || (() => {
    });
    this._registration = null;
    this._supported = hasWindow && "serviceWorker" in navigator;
    this._abortController = null;
  }
  isSupported() {
    return this._supported;
  }
  async register() {
    if (!this._supported) return null;
    try {
      this._registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/components/panels/panel-01/" });
      this._registration.addEventListener("updatefound", () => this._onUpdateFound());
      _log("info", "Registered");
      return this._registration;
    } catch (error) {
      _log("info", "Registration failed:", error.message);
      return null;
    }
  }
  _onUpdateFound() {
    const newWorker = this._registration.installing;
    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        this.onUpdate();
      }
    });
  }
  async unregister() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (!this._registration) return false;
    try {
      await this._registration.unregister();
      this._registration = null;
      return true;
    } catch {
      return false;
    }
  }
  async update() {
    if (!this._registration) return false;
    try {
      await this._registration.update();
      return true;
    } catch {
      return false;
    }
  }
  setupNetworkListeners() {
    if (hasWindow) {
      this._abortController = new AbortController();
      window.addEventListener("online", () => this.onOnline(), { signal: this._abortController.signal });
      window.addEventListener("offline", () => this.onOffline(), { signal: this._abortController.signal });
    }
  }
  isOnline() {
    return hasWindow ? navigator.onLine : true;
  }
  async clearCache() {
    if (!hasWindow || !("caches" in window)) return false;
    try {
      await caches.delete(CACHE_NAME);
      return true;
    } catch {
      return false;
    }
  }
  async getCacheSize() {
    if (!hasWindow || !("caches" in window)) return 0;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      return keys.length;
    } catch {
      return 0;
    }
  }
}
function createServiceWorkerManager(options = {}) {
  return new ServiceWorkerManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
var service_worker_default = { ServiceWorkerManager, createServiceWorkerManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  ServiceWorkerManager,
  VERSION,
  createServiceWorkerManager,
  service_worker_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
