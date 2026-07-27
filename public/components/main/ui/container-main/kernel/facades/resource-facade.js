import { getCircuitBreaker } from "../../resources/circuit-breaker.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades.resource-facade";
function createResourceFacade(registry) {
  return {
    scheduleCleanup(id, cleanupFn, priority = 0) {
      return registry.get("cleanup")?.schedule(id, cleanupFn, priority) || false;
    },
    cancelCleanup(id) {
      return registry.get("cleanup")?.cancel(id) || false;
    },
    async executeProtected(fn, breakerName = "default") {
      const breaker = getCircuitBreaker(breakerName);
      return breaker.executeWithRetry(fn);
    },
    start() {
      registry.get("resource")?.start();
      registry.get("cleanup")?.start();
    },
    stop() {
      registry.get("cleanup")?.stop();
    },
    pauseAll() {
      registry.get("resource")?.pauseAll();
    },
    resumeAll() {
      registry.get("resource")?.resumeAll();
    }
  };
}
var resource_facade_default = { createResourceFacade };
export {
  MODULE_ID,
  VERSION,
  createResourceFacade,
  resource_facade_default as default
};
