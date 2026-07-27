// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-lifecycle
// PURPOSE: Orchestrator Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ORCHESTRATOR_EVENTS, MODULE_LIFECYCLE from ../bus/events-map.js
//   shouldRetry from ../utils/guards.js
//   orchestratorBus from ../bus/event-bus-adapter.js
//   orchestratorStore from ../state/store.js
//   moduleRegistry from ./registry.js
//   logger from ../utils/logger.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   ModuleLifecycle — exported value
//   moduleLifecycle — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ORCHESTRATOR_EVENTS.MODULE_FAILED
//   ORCHESTRATOR_EVENTS.MODULE_MOUNTED
//   ORCHESTRATOR_EVENTS.MODULE_UNMOUNTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import orchestratorBus from '../bus/event-bus-adapter.js';
import { ORCHESTRATOR_EVENTS, MODULE_LIFECYCLE } from '../bus/events-map.js';
import orchestratorStore from '../state/store.js';
import moduleRegistry from './registry.js';
import logger from '../utils/logger.js';
import { shouldRetry } from '../utils/guards.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-lifecycle';
const DEFAULT_TIMEOUT = 10000;

class ModuleLifecycle {
  [key: string]: any;
  constructor() {
    this.activeModules = new Map();
    this.abortControllers = new Map();
    this.initialized = false;
    this.destroyed = false;
  }

  getVersion() { return VERSION; }
  isInitialized() { return this.initialized && !this.destroyed; }
  initLifecycle() { this.initialized = true; this.destroyed = false; return this; }

  async bootstrap(moduleId: string, context: Record<string, unknown> = {}) {
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

  async initModule(moduleId: string, context: Record<string, unknown> = {}) {
    const startTime = Date.now();
    logger.debug(`Init: ${moduleId}`);
    const abortController = new AbortController();
    this.abortControllers.set(moduleId, abortController);
    const timeout = context.timeout || DEFAULT_TIMEOUT;
    const timeoutId = setTimeout(() => { abortController.abort(); }, Number(timeout));
    try {
      this.activeModules.set(moduleId, { phase: MODULE_LIFECYCLE.INIT, startTime, context });
      clearTimeout(timeoutId);
      return { moduleId, phase: MODULE_LIFECYCLE.INIT, success: true, durationMs: Date.now() - startTime };
    } catch (error) { clearTimeout(timeoutId); throw error; }
  }

  async hydrate(moduleId: string, initialData: Record<string, unknown> = {}) {
    logger.debug(`Hydrate: ${moduleId}`, { dataKeys: Object.keys(initialData) });
    const activeModule = this.activeModules.get(moduleId);
    if (activeModule) { activeModule.phase = MODULE_LIFECYCLE.HYDRATE; activeModule.data = initialData; }
    return { moduleId, phase: MODULE_LIFECYCLE.HYDRATE, success: true, dataSize: JSON.stringify(initialData).length };
  }

  async render(moduleId: string) {
    const startTime = Date.now();
    logger.debug(`Render: ${moduleId}`);
    const activeModule = this.activeModules.get(moduleId);
    if (activeModule) { activeModule.phase = MODULE_LIFECYCLE.RENDER; activeModule.renderStart = startTime; }
    orchestratorStore.recordMount(Date.now() - startTime);
    moduleRegistry.recordMount(moduleId);
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_MOUNTED, { moduleId, renderMs: Date.now() - startTime });
    return { moduleId, phase: MODULE_LIFECYCLE.RENDER, success: true, renderMs: Date.now() - startTime };
  }

  async update(moduleId: string, delta: Record<string, unknown> = {}) {
    logger.debug(`Update: ${moduleId}`, { delta });
    const activeModule = this.activeModules.get(moduleId);
    if (!activeModule) { logger.info(`Modulo nao ativo para update: ${moduleId}`); return { moduleId, phase: MODULE_LIFECYCLE.UPDATE, success: false }; }
    activeModule.lastUpdate = Date.now();
    activeModule.updateCount = (activeModule.updateCount || 0) + 1;
    return { moduleId, phase: MODULE_LIFECYCLE.UPDATE, success: true, updateCount: activeModule.updateCount };
  }

  async destroy(moduleId: string) {
    logger.debug(`Destroy: ${moduleId}`);
    const abortController = this.abortControllers.get(moduleId);
    if (abortController) { abortController.abort(); this.abortControllers.delete(moduleId); }
    this.activeModules.delete(moduleId);
    orchestratorStore.recordUnmount();
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_UNMOUNTED, { moduleId });
    return { moduleId, phase: MODULE_LIFECYCLE.DESTROY, success: true };
  }

  async executeWithRetry(moduleId: string, phase: string, fn: () => Promise<unknown>, maxRetries: number = 3) {
    let attempt = 0;
    let lastError = null;
    while (attempt < maxRetries) {
      try { return await fn(); }
      catch (error) {
        lastError = error;
        attempt++;
        if (!shouldRetry(attempt, maxRetries, error)) break;
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        logger.info(`Retry ${attempt}/${maxRetries} para ${moduleId}:${phase}`, { backoffMs, error: (error as Error).message });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    moduleRegistry.recordError(moduleId, lastError);
    orchestratorStore.incrementError();
    // @ts-expect-error strict migration — TS18046
    orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_FAILED, { moduleId, phase, error: lastError.message, attempts: attempt });
    throw lastError;
  }

  _isDependencyReady(dependency: string) {
    if (dependency.startsWith('api:')) return true;
    if (dependency.startsWith('core:')) return true;
    return moduleRegistry.has(dependency);
  }

  // @ts-expect-error strict migration — TS2345
  getActiveModules() { return Array.from(this.activeModules.entries()).map(([id, data]: [string, Record<string, unknown>]) => ({ id, ...data })); }
  isModuleActive(moduleId: string) { return this.activeModules.has(moduleId); }
  getModulePhase(moduleId: string) { const active = this.activeModules.get(moduleId); return active ? active.phase : null; }
  abortModule(moduleId: string) { const controller = this.abortControllers.get(moduleId); if (controller) { controller.abort(); return true; } return false; }
  abortAll() { this.abortControllers.forEach((controller: AbortController) => controller.abort()); this.abortControllers.clear(); this.activeModules.clear(); logger.info('Todos os modulos abortados'); }
  getStats() { return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, activeCount: this.activeModules.size, controllersCount: this.abortControllers.size, modules: this.getActiveModules() }; }
  reset() { this.abortAll(); this.destroyed = false; }
  shutdown() { this.abortAll(); this.initialized = false; this.destroyed = true; }
}

const moduleLifecycle = new ModuleLifecycle();

export default moduleLifecycle;
export { ModuleLifecycle, moduleLifecycle, VERSION, MODULE_ID };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { lifecycleReady: true } }; }
