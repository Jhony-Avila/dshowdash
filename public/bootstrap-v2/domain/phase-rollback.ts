
// Phase Rollback - Automatic rollback for failed phases
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description #8 - Mecanismo de rollback para fases que falham
// @changelog v1.0.0-RESILIENCE: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: registerRollback(), unregisterRollback(), markPhaseExecuted(),
//   rollbackPhase(), rollbackToPhase(), getRollbackHistory(),
//   getPhaseHandlers(), getRegisteredPhases(), getExecutedPhases()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

var MODULE_ID = 'phase-rollback';
var VERSION = '1.1.0-HEALTH-CONTRACT';

// Types
interface RollbackHandler {
  id: string;
  phaseId: string;
  fn: (context: Record<string, unknown>) => void | Promise<void>;
  priority: number;
  description: string;
  critical: boolean;
  registeredAt: number;
}

interface ExecutedPhaseEntry {
  phaseId: string;
  timestamp: number;
  context: Record<string, unknown>;
}

interface RollbackHistoryEntry {
  timestamp: number;
  phaseId: string;
  status: string;
  handlersExecuted: number;
  duration: number;
}

interface RollbackResult {
  phaseId: string;
  status: string;
  reason?: string;
  handlersExecuted: number;
  results?: Array<{ handlerId: string; description: string; success: boolean; error?: string; duration: number }>;
  duration: number;
}

interface RollbackOptions {
  priority?: number;
  description?: string;
  critical?: boolean;
}

// Rollback registry - stores cleanup functions per phase
var _rollbackRegistry: Record<string, RollbackHandler[]> = {};
var _executedPhases: ExecutedPhaseEntry[] = [];
var _rollbackHistory: RollbackHistoryEntry[] = [];
var _maxHistory = 50;

// Rollback status
var ROLLBACK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

// Register a rollback handler for a phase
function registerRollback(phaseId: string, rollbackFn: (context: Record<string, unknown>) => void | Promise<void>, options: RollbackOptions) {
  if (options === undefined) options = {};
  
  if (!_rollbackRegistry[phaseId]) {
    _rollbackRegistry[phaseId] = [];
  }
  
  var handler = {
    id: 'rb-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
    phaseId: phaseId,
    fn: rollbackFn,
    priority: options.priority || 0,
    description: options.description || 'Rollback for ' + phaseId,
    critical: options.critical || false,
    registeredAt: Date.now()
  };
  
  _rollbackRegistry[phaseId].push(handler);
  
  // Sort by priority (higher first)
  _rollbackRegistry[phaseId].sort(function(a, b) {
    return b.priority - a.priority;
  });
  
  return handler.id;
}

// Unregister a rollback handler
function unregisterRollback(phaseId: string, handlerId: string) {
  if (!_rollbackRegistry[phaseId]) return false;
  
  var idx = _rollbackRegistry[phaseId].findIndex(function(h) {
    return h.id === handlerId;
  });
  
  if (idx !== -1) {
    _rollbackRegistry[phaseId].splice(idx, 1);
    return true;
  }
  
  return false;
}

// Mark a phase as executed (for rollback ordering)
function markPhaseExecuted(phaseId: string, context: Record<string, unknown>) {
  _executedPhases.push({
    phaseId: phaseId,
    timestamp: Date.now(),
    context: context || {}
  });
}

// Clear executed phase
function clearPhaseExecution(phaseId: string) {
  _executedPhases = _executedPhases.filter(function(p) {
    return p.phaseId !== phaseId;
  });
}

// Execute rollback for a single phase
function rollbackPhase(phaseId: string, context: Record<string, unknown>) {
  return new Promise(function(resolve) {
    var handlers = _rollbackRegistry[phaseId] || [];
    
    if (handlers.length === 0) {
      resolve({
        phaseId: phaseId,
        status: ROLLBACK_STATUS.SKIPPED,
        reason: 'No rollback handlers registered',
        handlersExecuted: 0
      });
      return;
    }
    
    var results: Array<{ handlerId: string; description: string; success: boolean; error?: string; duration: number }> = [];
    var startTime = Date.now();

    // Execute handlers sequentially
    var executeNext = function(index: number) {
      if (index >= handlers.length) {
        // All done
        var hasFailures = results.some(function(r) { return !r.success; });
        var result = {
          phaseId: phaseId,
          status: hasFailures ? ROLLBACK_STATUS.FAILED : ROLLBACK_STATUS.COMPLETED,
          handlersExecuted: results.length,
          results: results,
          duration: Date.now() - startTime
        };
        
        _recordRollback(result);
        resolve(result);
        return;
      }
      
      var handler = handlers[index];
      var handlerStart = Date.now();
      
      try {
        var fnResult = handler.fn(context);
        
        // Handle promise or sync result
        Promise.resolve(fnResult).then(function() {
          results.push({
            handlerId: handler.id,
            description: handler.description,
            success: true,
            duration: Date.now() - handlerStart
          });
          executeNext(index + 1);
        }).catch(function(error) {
          results.push({
            handlerId: handler.id,
            description: handler.description,
            success: false,
            error: error.message,
            duration: Date.now() - handlerStart
          });
          
          // Continue even if handler fails (unless critical)
          if (handler.critical) {
            var result = {
              phaseId: phaseId,
              status: ROLLBACK_STATUS.FAILED,
              reason: 'Critical rollback handler failed: ' + error.message,
              handlersExecuted: results.length,
              results: results,
              duration: Date.now() - startTime
            };
            _recordRollback(result);
            resolve(result);
          } else {
            executeNext(index + 1);
          }
        });
      } catch (error: any) {
        results.push({
          handlerId: handler.id,
          description: handler.description,
          success: false,
          error: (error as Error).message,
          duration: Date.now() - handlerStart
        });
        
        if (handler.critical) {
          var catchResult = {
            phaseId: phaseId,
            status: ROLLBACK_STATUS.FAILED,
            reason: 'Critical rollback handler threw: ' + error.message,
            handlersExecuted: results.length,
            results: results,
            duration: Date.now() - startTime
          };
          _recordRollback(catchResult);
          resolve(catchResult);
        } else {
          executeNext(index + 1);
        }
      }
    };
    
    executeNext(0);
  });
}

// Execute rollback for all phases up to (and including) failedPhaseId
function rollbackToPhase(failedPhaseId: string, context: Record<string, unknown>) {
  return new Promise(function(resolve) {
    // Find phases to rollback (in reverse order)
    var phasesToRollback: string[] = [];
    var foundFailed = false;
    
    for (var i = _executedPhases.length - 1; i >= 0; i--) {
      var phase = _executedPhases[i];
      phasesToRollback.push(phase.phaseId);
      
      if (phase.phaseId === failedPhaseId) {
        foundFailed = true;
        break;
      }
    }
    
    if (phasesToRollback.length === 0) {
      resolve({
        success: true,
        phasesRolledBack: 0,
        results: [],
        message: 'No phases to rollback'
      });
      return;
    }
    
    var results: RollbackResult[] = [];
    var startTime = Date.now();

    // Rollback phases sequentially (reverse order)
    var rollbackNext = function(index: number) {
      if (index >= phasesToRollback.length) {
        var hasFailures = results.some(function(r) { return r.status === ROLLBACK_STATUS.FAILED; });
        resolve({
          success: !hasFailures,
          phasesRolledBack: results.length,
          results: results,
          duration: Date.now() - startTime
        });
        return;
      }
      
      var phaseId = phasesToRollback[index];
      
      // @ts-expect-error strict migration — TS2345
      rollbackPhase(phaseId, context).then(function(result: RollbackResult) {
        results.push(result);
        clearPhaseExecution(phaseId);
        rollbackNext(index + 1);
      });
    };
    
    rollbackNext(0);
  });
}

// Record rollback in history
function _recordRollback(result: RollbackResult) {
  _rollbackHistory.unshift({
    timestamp: Date.now(),
    phaseId: result.phaseId,
    status: result.status,
    handlersExecuted: result.handlersExecuted,
    duration: result.duration
  });
  
  while (_rollbackHistory.length > _maxHistory) {
    _rollbackHistory.pop();
  }
}

// Get rollback history
function getRollbackHistory() {
  return _rollbackHistory.slice();
}

// Get registered handlers for a phase
function getPhaseHandlers(phaseId: string) {
  return (_rollbackRegistry[phaseId] || []).map(function(h) {
    return {
      id: h.id,
      description: h.description,
      priority: h.priority,
      critical: h.critical
    };
  });
}

// Get all registered phases
function getRegisteredPhases() {
  return Object.keys(_rollbackRegistry).filter(function(phaseId) {
    return _rollbackRegistry[phaseId].length > 0;
  });
}

// Get executed phases
function getExecutedPhases() {
  return _executedPhases.slice();
}

// Reset all state
function reset() {
  _rollbackRegistry = {};
  _executedPhases = [];
}

// Clear history only
function clearHistory() {
  _rollbackHistory = [];
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    registeredPhases: getRegisteredPhases(),
    executedPhases: _executedPhases.length,
    totalHandlers: Object.keys(_rollbackRegistry).reduce(function(sum, key) {
      return sum + _rollbackRegistry[key].length;
    }, 0),
    rollbackHistory: _rollbackHistory.length,
    improvements: ['#8-AutomaticRollback']
  };
}

function healthCheck() {
  var recentFailures = _rollbackHistory.filter(function(r) {
    return r.status === ROLLBACK_STATUS.FAILED && (Date.now() - r.timestamp) < 300000;
  });

  return createHealthResult({
    status: recentFailures.length > 0 ? HEALTH_STATUS.DEGRADED : HEALTH_STATUS.HEALTHY,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      registeredPhases: getRegisteredPhases().length,
      executedPhases: _executedPhases.length,
      recentFailures: recentFailures.length
    }
  });
}

export {
  ROLLBACK_STATUS,
  registerRollback,
  unregisterRollback,
  markPhaseExecuted,
  clearPhaseExecution,
  rollbackPhase,
  rollbackToPhase,
  getRollbackHistory,
  getPhaseHandlers,
  getRegisteredPhases,
  getExecutedPhases,
  reset,
  clearHistory,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  ROLLBACK_STATUS: ROLLBACK_STATUS,
  registerRollback: registerRollback,
  unregisterRollback: unregisterRollback,
  markPhaseExecuted: markPhaseExecuted,
  clearPhaseExecution: clearPhaseExecution,
  rollbackPhase: rollbackPhase,
  rollbackToPhase: rollbackToPhase,
  getRollbackHistory: getRollbackHistory,
  getPhaseHandlers: getPhaseHandlers,
  getRegisteredPhases: getRegisteredPhases,
  getExecutedPhases: getExecutedPhases,
  reset: reset,
  clearHistory: clearHistory,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
