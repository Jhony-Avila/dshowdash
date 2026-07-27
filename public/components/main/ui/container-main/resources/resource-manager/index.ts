
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   getRegisteredResources, getResourcesByType,
//     getResourceStats from resource-contract.js
//   getCircuitBreaker from ../circuit-breaker.js
//   MEMORY_LIMITS, DEFAULT_PANEL_LIMITS from ./constants.js
//   createMemoryMonitor from ./memory-monitor.js
//   cleanupByPriority, cleanupByType, cleanupPanel,
//     disposeAll from ./cleanup-strategies.js
//   createPanelRegistry from ./panel-registry.js
//   createLimitChecker from ./limit-checker.js
//   createThrottleController from ./throttle-controller.js
//   createPauseController from ./pause-controller.js
//   createResourceRegistry from ./resource-registry.js
//   RESOURCE_EVENT_NAMES from /core/runtime/constants/
//
// PROVIDES:
//   createResourceManager(), info(), healthCheck(),
//   MEMORY_LIMITS, DEFAULT_PANEL_LIMITS,
//   VERSION, MODULE_ID
//
// RECEIVES (via createResourceManager options):
//   options.eventBus, options.memoryWarningThreshold,
//   options.memoryCriticalThreshold, options.checkInterval,
//   options.autoCleanup, options.defaultPanelLimits,
//   options.onMemoryWarning, options.onMemoryCritical,
//   options.onPanelLimitExceeded, options.onResourceError
// ═══════════════════════════════════════════════════════════════
// Resource Manager - Gerenciador central de recursos com limites por painel
// @version 2.1.0-EVENT-CONSTANTS
// @changelog v2.1.0-EVENT-CONSTANTS - Migrado strings hardcoded para RESOURCE_EVENT_NAMES
// @changelog v2.0.0-MODULAR - Refatorado para arquitetura modular
// @description Gerencia ciclo de vida de recursos pesados com controle por painel
'use strict';

import { 
  getRegisteredResources,
  getResourcesByType,
  getResourceStats 
} from '../../contracts/resource-contract.js';
import { getCircuitBreaker } from '../circuit-breaker.js';
import { MEMORY_LIMITS, DEFAULT_PANEL_LIMITS } from './constants.js';
import { createMemoryMonitor } from './memory-monitor.js';
import { cleanupByPriority, cleanupByType, cleanupPanel, disposeAll } from './cleanup-strategies.js';
import { createPanelRegistry } from './panel-registry.js';
import { createLimitChecker } from './limit-checker.js';
import { createThrottleController } from './throttle-controller.js';
import { createPauseController } from './pause-controller.js';
import { createResourceRegistry } from './resource-registry.js';
import { RESOURCE_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '2.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'container-main:resource-manager';

export { MEMORY_LIMITS, DEFAULT_PANEL_LIMITS } from './constants.js';

// Cria instância do Resource Manager
export function createResourceManager(options: Record<string, any> = {}) {
  const {
    eventBus,
    memoryWarningThreshold = MEMORY_LIMITS.WARNING,
    memoryCriticalThreshold = MEMORY_LIMITS.CRITICAL,
    checkInterval = 30000,
    autoCleanup = true,
    defaultPanelLimits = {},
    onMemoryWarning,
    onMemoryCritical,
    onPanelLimitExceeded,
    onResourceError
  } = options;

  let _destroyed = false;

  // Emitter helper
  const emitter = {
    emit(event: string, data: Record<string, unknown>) {
      if (eventBus?.emit) {
        eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
      }
    }
  };

  // Criar componentes modulares
  const panelRegistry = createPanelRegistry({ emitter });
  const throttleController = createThrottleController({ emitter });
  
  const limitChecker = createLimitChecker({
    panelRegistry,
    throttleController,
    emitter,
    defaultPanelLimits,
    onPanelLimitExceeded
  });

  const pauseController = createPauseController({
    panelRegistry,
    emitter
  });

  const resourceRegistry = createResourceRegistry({
    panelRegistry,
    limitChecker,
    throttleController,
    emitter
  });

  const _circuitBreaker = getCircuitBreaker('resource-manager', {
    failureThreshold: 3,
    timeout: 60000
  });

  // Memory monitor
  const _memoryMonitor = createMemoryMonitor({
    warningThreshold: memoryWarningThreshold,
    criticalThreshold: memoryCriticalThreshold,
    checkInterval,
    onWarning: (usage: unknown) => {
      emitter.emit(RESOURCE_EVENT_NAMES.MEMORY_WARNING, { memoryUsage: usage, threshold: memoryWarningThreshold });
      onMemoryWarning?.(usage);
    },
    onCritical: (usage: unknown) => {
      emitter.emit(RESOURCE_EVENT_NAMES.MEMORY_CRITICAL, { memoryUsage: usage, threshold: memoryCriticalThreshold });
      onMemoryCritical?.(usage);
      if (autoCleanup) {
        manager.cleanupByPriority();
      }
    }
  });

  const manager = {
    // === PANEL MANAGEMENT ===
    registerPanel(panelId: string, customLimits = {}) {
      panelRegistry.getOrCreate(panelId);
      if (Object.keys(customLimits).length > 0) {
        limitChecker.setLimits(panelId, customLimits);
      }
      emitter.emit(RESOURCE_EVENT_NAMES.PANEL_REGISTERED, { panelId });
      return this;
    },

    async unregisterPanel(panelId: string) {
      const record = panelRegistry.get(panelId);
      if (record) {
        for (const [, info] of record.resources) {
          if (info.resource?.dispose) {
            await info.resource.dispose();
          }
        }
        panelRegistry.delete(panelId);
      }
      limitChecker.removeLimits(panelId);
      throttleController.unthrottle(panelId);
      emitter.emit(RESOURCE_EVENT_NAMES.PANEL_UNREGISTERED, { panelId });
      return this;
    },

    // === RESOURCE MANAGEMENT ===
    registerResource: (panelId: string, resourceId: string, resource: Record<string, unknown>, opts: Record<string, unknown>) => 
      resourceRegistry.register(panelId, resourceId, resource, opts),
    
    unregisterResource: (panelId: string, resourceId: string) => 
      resourceRegistry.unregister(panelId, resourceId),

    // === LIMITS ===
    setPanelLimits: (panelId: string, limits: Record<string, unknown>) => {
      limitChecker.setLimits(panelId, limits);
      return manager;
    },
    getPanelLimits: (panelId: string) => ({ ...limitChecker.getLimits(panelId) }),
    getPanelUsage: (panelId: string) => limitChecker.getUsage(panelId),

    // === THROTTLING ===
    unthrottlePanel: (panelId: string) => {
      throttleController.unthrottle(panelId);
      return manager;
    },
    isPanelThrottled: (panelId: string) => throttleController.isThrottled(panelId),
    getThrottledPanels: () => throttleController.getAll(),

    // === PAUSE/RESUME ===
    pauseByType: (type: string) => pauseController.pauseByType(type),
    resumeByType: (type: string) => pauseController.resumeByType(type),
    pauseAll: () => pauseController.pauseAll(),
    resumeAll: () => pauseController.resumeAll(),
    pausePanel: (panelId: string) => pauseController.pausePanel(panelId),
    resumePanel: (panelId: string) => pauseController.resumePanel(panelId),

    // === LIFECYCLE ===
    start() {
      if (_destroyed) return this;
      _memoryMonitor.start(() => panelRegistry.getStats(throttleController.getSet()));
      emitter.emit(RESOURCE_EVENT_NAMES.MANAGER_STARTED, {});
      return this;
    },

    stop() {
      _memoryMonitor.stop();
      emitter.emit(RESOURCE_EVENT_NAMES.MANAGER_STOPPED, {});
      return this;
    },

    // === QUERIES ===
    getByType: (type: string) => getResourcesByType(type),
    getAll: () => getRegisteredResources(),
    
    getStats() {
      const globalStats = getResourceStats();
      return {
        ...globalStats,
        panelCount: panelRegistry.size(),
        throttledCount: throttleController.count(),
        byPanel: panelRegistry.getStats(throttleController.getSet())
      };
    },

    // === CLEANUP ===
    async cleanupByPriority() {
      const result = await cleanupByPriority({
        throttledPanels: throttleController.getSet(),
        panelResources: panelRegistry.getMap(),
        unregisterResource: resourceRegistry.unregister.bind(resourceRegistry)
      });
      emitter.emit(RESOURCE_EVENT_NAMES.CLEANUP_COMPLETE, result);
      return result.cleaned;
    },

    async cleanupPanel(panelId: string) {
      const cleaned = await cleanupPanel(panelId, {
        panelResources: panelRegistry.getMap(),
        unregisterResource: resourceRegistry.unregister.bind(resourceRegistry)
      });
      throttleController.unthrottle(panelId);
      emitter.emit(RESOURCE_EVENT_NAMES.PANEL_CLEANUP, { panelId, cleaned });
      return cleaned;
    },

    async cleanupByType(type: string) {
      const cleaned = await cleanupByType(type);
      emitter.emit(RESOURCE_EVENT_NAMES.TYPE_CLEANUP, { type, cleaned });
      return cleaned;
    },

    async disposeAll() {
      const count = await disposeAll(panelRegistry.getMap(), this.unregisterPanel.bind(this));
      emitter.emit(RESOURCE_EVENT_NAMES.ALL_DISPOSED, { count });
      return count;
    },

    // === CIRCUIT BREAKER ===
    executeProtected: (fn: (...args: unknown[]) => void) => _circuitBreaker.executeWithRetry(fn),

    // === MEMORY ===
    getLastCheck: () => _memoryMonitor.getLastCheck(),
    getMemoryHistory: () => _memoryMonitor.getHistory(),
    isCritical: () => _memoryMonitor.isCritical(),

    // === HEALTH ===
    healthCheck() {
      const stats = this.getStats();
      const memoryUsage = stats.totalMemoryEstimate || 0;
      
      let status = 'HEALTHY';
      if (memoryUsage >= memoryCriticalThreshold) status = 'CRITICAL';
      else if (memoryUsage >= memoryWarningThreshold) status = 'DEGRADED';
      else if (throttleController.count() > 0) status = 'WARNING';

      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        modular: true,
        monitoring: _memoryMonitor.isMonitoring(),
        destroyed: _destroyed,
        memoryUsage,
        memoryWarningThreshold,
        memoryCriticalThreshold,
        panelCount: panelRegistry.size(),
        throttledPanels: throttleController.getAll(),
        stats,
        lastCheck: _memoryMonitor.getLastCheck(),
        circuitBreaker: _circuitBreaker.getStats()
      };
    },

    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        modular: true,
        monitoring: _memoryMonitor.isMonitoring(),
        resourceCount: getRegisteredResources().length,
        panelCount: panelRegistry.size(),
        throttledCount: throttleController.count(),
        hasPerPanelLimits: true
      };
    },

    destroy() {
      _destroyed = true;
      _memoryMonitor.destroy();
      panelRegistry.clear();
      limitChecker.clear();
      throttleController.clear();
      emitter.emit(RESOURCE_EVENT_NAMES.MANAGER_DESTROYED, {});
    }
  };

  return manager;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    exports: ['createResourceManager', 'MEMORY_LIMITS', 'DEFAULT_PANEL_LIMITS'],
    hasPerPanelLimits: true
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    modular: true,
    hasPerPanelLimits: true
  };
}

export default {
  VERSION, MODULE_ID,
  MEMORY_LIMITS, DEFAULT_PANEL_LIMITS,
  createResourceManager,
  info, healthCheck
};
