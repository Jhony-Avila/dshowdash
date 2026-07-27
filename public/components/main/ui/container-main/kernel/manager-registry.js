const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.kernel.manager-registry";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("container-main:manager-registry");
function createManagerRegistry() {
  const _managers = {
    slot: null,
    resource: null,
    // @ts-expect-error strict migration — TS2352
    cleanup: null,
    capability: null,
    // @ts-expect-error strict migration — TS2352
    listener: null,
    lifecycle: null,
    layout: null,
    metrics: null,
    image: null,
    deprecation: null,
    compat: null
  };
  const _initTimes = {};
  return {
    async initManager(name, createFn) {
      const startTime = performance.now();
      try {
        const manager = createFn();
        if (typeof manager.init === "function") await manager.init();
        _initTimes[name] = performance.now() - startTime;
        _managers[name] = manager;
        return manager;
      } catch (error) {
        _initTimes[name] = -1;
        throw error;
      }
    },
    get(name) {
      return _managers[name] || null;
    },
    set(name, manager) {
      _managers[name] = manager;
    },
    has(name) {
      return _managers[name] !== null;
    },
    getAll() {
      return { ..._managers };
    },
    getInitTimes() {
      return { ..._initTimes };
    },
    listActive() {
      return Object.entries(_managers).filter(([_, v]) => v !== null).map(([k, v]) => {
        const mgr = v;
        return {
          name: k,
          version: mgr.VERSION || (typeof mgr.info === "function" ? mgr.info()?.version : null) || "unknown",
          healthy: typeof mgr.healthCheck === "function" ? mgr.healthCheck()?.status === "HEALTHY" : false
        };
      });
    },
    async cleanup() {
      const cleanupOrder = [
        "cleanup",
        "image",
        "layout",
        "metrics",
        "listener",
        "capability",
        "lifecycle",
        "resource",
        "slot",
        "deprecation",
        "compat"
      ];
      const errors = [];
      for (const name of cleanupOrder) {
        try {
          if (_managers[name]) {
            const mgr = _managers[name];
            if (typeof mgr.destroy === "function") {
              await mgr.destroy();
            }
            _managers[name] = null;
          }
        } catch (e) {
          errors.push({ name, error: e.message });
          logger.warn(`Error cleaning up ${name}`, { error: e.message });
        }
      }
      return errors;
    },
    reset() {
      for (const key of Object.keys(_managers)) {
        _managers[key] = null;
      }
    }
  };
}
var manager_registry_default = { createManagerRegistry };
export {
  MODULE_ID,
  VERSION,
  createManagerRegistry,
  manager_registry_default as default
};
