
// Partial Reinitialization - Reinitialize specific phases without full boot
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description #29 - Permite reinicializar fases específicas sem reboot completo
// @changelog v1.0.0-PERFORMANCE: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: registerHandler(), unregisterHandler(), supportsReinit(),
//   reinitPhase(), reinitPhases(), reinitFrom(), getHistory(),
//   getPhaseHandlers(), getRegisteredPhases(), reset()
// BROWSER APIs:
//   performance.now() — LEGÍTIMO: timing measurement
// WINDOW ACCESS: performance.now() (timing API)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

var MODULE_ID = 'partial-reinit';
var VERSION = '1.1.0-HEALTH-CONTRACT';

// Types
interface ReinitHandlerEntry {
  id: string;
  phaseId: string;
  handler: (context: Record<string, unknown>) => void | Promise<void>;
  priority: number;
  description: string;
  cleanup: ((context: Record<string, unknown>) => void | Promise<void>) | null;
  registeredAt: number;
}

interface ReinitHistoryEntry {
  timestamp: number;
  phaseId: string;
  success: boolean;
  handlersExecuted: number;
  duration: number;
}

interface ReinitHandlerOptions {
  priority?: number;
  description?: string;
  cleanup?: ((context: Record<string, unknown>) => void | Promise<void>) | null;
}

interface ReinitPhasesOptions {
  stopOnError?: boolean;
}

// Reinit history
var _history: ReinitHistoryEntry[] = [];
var _maxHistory = 30;

// Reinit registry - stores reinit handlers per phase
var _reinitHandlers: Record<string, ReinitHandlerEntry[]> = {};

// Phases that support partial reinit
var REINIT_SUPPORTED_PHASES = [
  'phase-4-ui-prep',
  'phase-5-ui',
  'phase-6-platform'
];

// Register a reinit handler for a phase
function registerHandler(phaseId: string, handler: (context: Record<string, unknown>) => void | Promise<void>, options: ReinitHandlerOptions) {
  if (options === undefined) options = {};
  
  if (!_reinitHandlers[phaseId]) {
    _reinitHandlers[phaseId] = [];
  }
  
  var entry = {
    id: 'rh-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
    phaseId: phaseId,
    handler: handler,
    priority: options.priority || 0,
    description: options.description || 'Reinit handler for ' + phaseId,
    cleanup: options.cleanup || null,
    registeredAt: Date.now()
  };
  
  _reinitHandlers[phaseId].push(entry);
  _reinitHandlers[phaseId].sort(function(a, b) { return b.priority - a.priority; });
  
  return entry.id;
}

// Unregister a handler
function unregisterHandler(phaseId: string, handlerId: string) {
  if (!_reinitHandlers[phaseId]) return false;
  
  var idx = _reinitHandlers[phaseId].findIndex(function(h) { return h.id === handlerId; });
  if (idx !== -1) {
    _reinitHandlers[phaseId].splice(idx, 1);
    return true;
  }
  return false;
}

// Check if phase supports partial reinit
function supportsReinit(phaseId: string) {
  return REINIT_SUPPORTED_PHASES.indexOf(phaseId) !== -1 || !!_reinitHandlers[phaseId];
}

// Reinitialize a single phase
function reinitPhase(phaseId: string, context: Record<string, unknown>) {
  return new Promise(function(resolve) {
    if (!supportsReinit(phaseId)) {
      resolve({
        success: false,
        phaseId: phaseId,
        error: 'Phase does not support partial reinitialization'
      });
      return;
    }
    
    var handlers = _reinitHandlers[phaseId] || [];
    if (handlers.length === 0) {
      resolve({
        success: true,
        phaseId: phaseId,
        handlersExecuted: 0,
        message: 'No handlers registered, phase marked as reinit-ready'
      });
      return;
    }
    
    var startTime = performance.now();
    var results: Array<{ handlerId: string; description: string; success: boolean; error?: string; duration: number }> = [];

    // Execute cleanup first (in reverse order)
    var cleanupPromises = handlers.filter(function(h) { return h.cleanup; }).reverse().map(function(h) {
      return Promise.resolve().then(function() {
        return h.cleanup!(context);
      }).catch(function(e) {
        return { error: e.message };
      });
    });
    
    Promise.all(cleanupPromises).then(function() {
      // Then execute reinit handlers
      var executeNext = function(index: number) {
        if (index >= handlers.length) {
          var duration = Math.round(performance.now() - startTime);
          var hasErrors = results.some(function(r) { return !r.success; });
          
          var result = {
            success: !hasErrors,
            phaseId: phaseId,
            handlersExecuted: results.length,
            results: results,
            duration: duration
          };
          
          _recordReinit(result);
          resolve(result);
          return;
        }
        
        var handler = handlers[index];
        var handlerStart = performance.now();
        
        Promise.resolve().then(function() {
          return handler.handler(context);
        }).then(function() {
          results.push({
            handlerId: handler.id,
            description: handler.description,
            success: true,
            duration: Math.round(performance.now() - handlerStart)
          });
          executeNext(index + 1);
        }).catch(function(error) {
          results.push({
            handlerId: handler.id,
            description: handler.description,
            success: false,
            error: error.message,
            duration: Math.round(performance.now() - handlerStart)
          });
          executeNext(index + 1);
        });
      };
      
      executeNext(0);
    });
  });
}

// Reinitialize multiple phases
function reinitPhases(phaseIds: string[], context: Record<string, unknown>, options?: ReinitPhasesOptions) {
  if (options === undefined) options = {};
  
  return new Promise(function(resolve) {
    var results: Array<Record<string, unknown>> = [];
    var startTime = performance.now();

    var executeNext = function(index: number) {
      if (index >= phaseIds.length) {
        var hasErrors = results.some(function(r) { return !r.success; });
        resolve({
          success: !hasErrors,
          phasesProcessed: results.length,
          results: results,
          duration: Math.round(performance.now() - startTime)
        });
        return;
      }
      
      // @ts-expect-error strict migration — TS2345
      reinitPhase(phaseIds[index], context).then(function(result: Record<string, unknown>) {
        results.push(result);

        if (!result.success && options!.stopOnError) {
          resolve({
            success: false,
            phasesProcessed: results.length,
            results: results,
            stoppedAt: phaseIds[index],
            duration: Math.round(performance.now() - startTime)
          });
        } else {
          executeNext(index + 1);
        }
      });
    };
    
    executeNext(0);
  });
}

// Reinitialize from a specific phase onwards
function reinitFrom(startPhaseId: string, context: Record<string, unknown>, options: ReinitPhasesOptions) {
  var phaseOrder = REINIT_SUPPORTED_PHASES;
  var startIndex = phaseOrder.indexOf(startPhaseId);
  
  if (startIndex === -1) {
    return Promise.resolve({
      success: false,
      error: 'Phase not found in reinit order: ' + startPhaseId
    });
  }
  
  var phasesToReinit = phaseOrder.slice(startIndex);
  return reinitPhases(phasesToReinit, context, options);
}

// Record reinit in history
function _recordReinit(result: { phaseId: string; success: boolean; handlersExecuted: number; duration: number }) {
  _history.unshift({
    timestamp: Date.now(),
    phaseId: result.phaseId,
    success: result.success,
    handlersExecuted: result.handlersExecuted,
    duration: result.duration
  });
  
  while (_history.length > _maxHistory) {
    _history.pop();
  }
}

// Get reinit history
function getHistory() {
  return _history.slice();
}

// Get registered handlers for a phase
function getPhaseHandlers(phaseId: string) {
  return (_reinitHandlers[phaseId] || []).map(function(h) {
    return {
      id: h.id,
      description: h.description,
      priority: h.priority,
      hasCleanup: !!h.cleanup
    };
  });
}

// Get all phases with handlers
function getRegisteredPhases() {
  return Object.keys(_reinitHandlers).filter(function(p) {
    return _reinitHandlers[p].length > 0;
  });
}

// Reset
function reset() {
  _reinitHandlers = {};
  _history = [];
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    supportedPhases: REINIT_SUPPORTED_PHASES,
    registeredPhases: getRegisteredPhases(),
    totalHandlers: Object.keys(_reinitHandlers).reduce(function(sum, key) {
      return sum + _reinitHandlers[key].length;
    }, 0),
    historyCount: _history.length,
    improvements: ['#29-PartialReinit']
  };
}

function healthCheck() {
  var recentFailures = _history.filter(function(r) {
    return !r.success && (Date.now() - r.timestamp) < 300000;
  });

  return createHealthResult({
    status: recentFailures.length > 2 ? HEALTH_STATUS.DEGRADED : HEALTH_STATUS.HEALTHY,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      registeredPhases: getRegisteredPhases().length,
      recentFailures: recentFailures.length
    }
  });
}

export {
  REINIT_SUPPORTED_PHASES,
  registerHandler,
  unregisterHandler,
  supportsReinit,
  reinitPhase,
  reinitPhases,
  reinitFrom,
  getHistory,
  getPhaseHandlers,
  getRegisteredPhases,
  reset,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  REINIT_SUPPORTED_PHASES: REINIT_SUPPORTED_PHASES,
  registerHandler: registerHandler,
  unregisterHandler: unregisterHandler,
  supportsReinit: supportsReinit,
  reinitPhase: reinitPhase,
  reinitPhases: reinitPhases,
  reinitFrom: reinitFrom,
  getHistory: getHistory,
  getPhaseHandlers: getPhaseHandlers,
  getRegisteredPhases: getRegisteredPhases,
  reset: reset,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
