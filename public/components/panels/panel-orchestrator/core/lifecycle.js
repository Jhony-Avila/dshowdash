import orchestratorBus from "../bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS, MODULE_LIFECYCLE } from "../bus/events-map.js";
import orchestratorStore from "../state/store.js";
import moduleRegistry from "./registry.js";
import logger from "../utils/logger.js";
import { shouldRetry } from "../utils/guards.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-lifecycle";
const DEFAULT_TIMEOUT = 1e4;
class ModuleLifecycle {
  constructor() {
    this.activeModules = /* @__PURE__ */ new Map();
    this.abortControllers = /* @__PURE__ */ new Map();
    this.initialized = false;
    this.destroyed = false;
  }
  getVersion() {
    return VERSION;
  }
  isInitialized() {
    return this.initialized && !this.destroyed;
  }
  initLifecycle() {
    this.initialized = true;
    this.destroyed = false;
    return this;
  }
  async bootstrap(moduleId, context = {}) {
    logger.debug(`Bootstrap: ${moduleId}`);
    const module = moduleRegistry.get(moduleId);
    if (!module) throw new Error(`Modulo nao encontrado: ${moduleId}`);
    if (module.dependencies && module.dependencies.length > 0) {
      for (const dep of module.dependencies) {
        if (!this._isDependencyReady(dep)) logger.info(`Dependencia nao disponivel: ${dep}`, { moduleId });
      }
    }
    return { moduleId, phase: MODULE_LIFECYCLE.BOOTSTRAP, success: true };
  }
  async initModule(moduleId, context = {}) {
    const startTime = Date.now();
    logger.debug(`Init: ${moduleId}`);
    const abortController = new AbortController();
    this.abortControllers.set(moduleId, abortController);
    const timeout = context.timeout || DEFAULT_TIMEOUT;
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, Number(timeout));
    try {
      this.activeModules.set(moduleId, { phase: MODULE_LIFECYCLE.INIT, startTime, context });
      clearTimeout(timeoutId);
      return { moduleId, phase: MODULE_LIFECYCLE.INIT, success: true, durationMs: Date.now() - startTime };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  async hydrate(moduleId, initialData = {}) {
    logger.debug(`Hydrate: ${moduleId}`, { dataKeys: Object.keys(initialData) });
    const activeModule = this.activeModules.get(moduleId);
    if (activeModule) {
      activeModule.phase = MODULE_LIFECYCLE.HYDRATE;
      activeModule.data = initialData;
    }
    return { moduleId, phase: MODULE_LIFECYCLE.HYDRATE, success: true, dataSize: JSON.stringify(initialData).length };
  }
  async render(moduleId) {
    const startTime = Date.now();
    logger.debug(`Render: ${moduleId}`);
    const activeModule = this.activeModules.get(moduleId);
    if (activeModule) {
      activeModule.phase = MODULE_LIFECYCLE.RENDER;
      activeModule.renderStart = startTime;
    }
    orchestratorStore.recordMount(Date.now() - startTime);
    moduleRegistry.recordMount(moduleId);
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_MOUNTED, { moduleId, renderMs: Date.now() - startTime });
    return { moduleId, phase: MODULE_LIFECYCLE.RENDER, success: true, renderMs: Date.now() - startTime };
  }
  async update(moduleId, delta = {}) {
    logger.debug(`Update: ${moduleId}`, { delta });
    const activeModule = this.activeModules.get(moduleId);
    if (!activeModule) {
      logger.info(`Modulo nao ativo para update: ${moduleId}`);
      return { moduleId, phase: MODULE_LIFECYCLE.UPDATE, success: false };
    }
    activeModule.lastUpdate = Date.now();
    activeModule.updateCount = (activeModule.updateCount || 0) + 1;
    return { moduleId, phase: MODULE_LIFECYCLE.UPDATE, success: true, updateCount: activeModule.updateCount };
  }
  async destroy(moduleId) {
    logger.debug(`Destroy: ${moduleId}`);
    const abortController = this.abortControllers.get(moduleId);
    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(moduleId);
    }
    this.activeModules.delete(moduleId);
    orchestratorStore.recordUnmount();
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_UNMOUNTED, { moduleId });
    return { moduleId, phase: MODULE_LIFECYCLE.DESTROY, success: true };
  }
  async executeWithRetry(moduleId, phase, fn, maxRetries = 3) {
    let attempt = 0;
    let lastError = null;
    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        attempt++;
        if (!shouldRetry(attempt, maxRetries, error)) break;
        const backoffMs = Math.min(1e3 * Math.pow(2, attempt - 1), 1e4);
        logger.info(`Retry ${attempt}/${maxRetries} para ${moduleId}:${phase}`, { backoffMs, error: error.message });
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
    moduleRegistry.recordError(moduleId, lastError);
    orchestratorStore.incrementError();
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_FAILED, { moduleId, phase, error: lastError.message, attempts: attempt });
    throw lastError;
  }
  _isDependencyReady(dependency) {
    if (dependency.startsWith("api:")) return true;
    if (dependency.startsWith("core:")) return true;
    return moduleRegistry.has(dependency);
  }
  // @ts-expect-error strict migration — TS2345
  getActiveModules() {
    return Array.from(this.activeModules.entries()).map(([id, data]) => ({ id, ...data }));
  }
  isModuleActive(moduleId) {
    return this.activeModules.has(moduleId);
  }
  getModulePhase(moduleId) {
    const active = this.activeModules.get(moduleId);
    return active ? active.phase : null;
  }
  abortModule(moduleId) {
    const controller = this.abortControllers.get(moduleId);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }
  abortAll() {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
    this.activeModules.clear();
    logger.info("Todos os modulos abortados");
  }
  getStats() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, activeCount: this.activeModules.size, controllersCount: this.abortControllers.size, modules: this.getActiveModules() };
  }
  reset() {
    this.abortAll();
    this.destroyed = false;
  }
  shutdown() {
    this.abortAll();
    this.initialized = false;
    this.destroyed = true;
  }
}
const moduleLifecycle = new ModuleLifecycle();
var lifecycle_default = moduleLifecycle;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { lifecycleReady: true } };
}
export {
  MODULE_ID,
  ModuleLifecycle,
  VERSION,
  lifecycle_default as default,
  healthCheck,
  info,
  moduleLifecycle
};
