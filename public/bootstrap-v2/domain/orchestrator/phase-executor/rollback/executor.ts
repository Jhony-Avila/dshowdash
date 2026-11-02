
// Rollback Executor - Executa rollback dos side-effects
// @version 1.0.1-CONTRACTS
// @description Sprint 6: #8 Rollback Automático - Executor
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   EFFECT_TYPES from ./registry.js
//
// RECEIVES (via createRollbackExecutor options):
//   options.logger          — Logger instance
//   options.registry        — Rollback registry for side-effects
//   options.eventEmitter    — Event emitter for rollback events
//   options.continueOnError — Whether to continue on revert failure
//
// WINDOW ACCESS:
//   window[key] — LEGÍTIMO: reverter propriedades registradas
//   sessionStorage/localStorage — LEGÍTIMO: reverter storage effects
//   document DOM — LEGÍTIMO: reverter DOM elements
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.1-CONTRACTS';
var MODULE_ID = 'rollback-executor';

import { EFFECT_TYPES } from './registry.js';

interface RollbackRegistry {
  getEffects: (phaseId: string) => RollbackEffect[];
  clearPhase: (phaseId: string) => boolean;
}

interface RollbackExecutorOptions {
  logger?: Record<string, Function> | null;
  registry?: RollbackRegistry | null;
  eventEmitter?: { emit?: (event: string, payload: Record<string, unknown>) => void } | null;
  continueOnError?: boolean;
}

interface RollbackEffect {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface RevertResult {
  success: boolean;
  action?: string;
  reason?: string;
}

export function createRollbackExecutor(options: RollbackExecutorOptions) {
  if (options === undefined) options = {};

  var logger = options.logger;
  var registry = options.registry;
  var eventEmitter = options.eventEmitter;
  var continueOnError = options.continueOnError !== false;

  // Métricas
  var _metrics: {
    rollbacksExecuted: number;
    effectsReverted: number;
    effectsFailed: number;
    byType: Record<string, number>;
  } = {
    rollbacksExecuted: 0,
    effectsReverted: 0,
    effectsFailed: 0,
    byType: {}
  };

  function _log(level: string, message: string, data?: Record<string, unknown>) {
    if (logger && logger[level]) {
      logger[level]('[' + MODULE_ID + '] ' + message, data);
    }
  }
  
  function _emit(event: string, payload: Record<string, unknown>) {
    if (eventEmitter && eventEmitter.emit) {
      eventEmitter.emit(event, payload);
    }
  }
  
  /**
   * Reverte um efeito de window property
   */
  function _revertWindowProperty(effect: RollbackEffect): RevertResult {
    var data = effect.data as { key: string; hadPrevious: boolean; previousValue: unknown };
    if (data.hadPrevious) {
      (window as unknown as Record<string, unknown>)[data.key] = data.previousValue;
    } else {
      delete (window as unknown as Record<string, unknown>)[data.key];
    }
    return { success: true, action: data.hadPrevious ? 'restored' : 'deleted' };
  }
  
  /**
   * Reverte um efeito de global object (nested path)
   */
  function _revertGlobalObject(effect: RollbackEffect): RevertResult {
    var data = effect.data as { path: string; hadPrevious: boolean; previousValue: unknown };
    var parts = data.path.split('.');
    var obj: Record<string, unknown> = window as unknown as Record<string, unknown>;
    
    // Navega até o penúltimo nível
    for (var i = 0; i < parts.length - 1; i++) {
      if (obj && obj[parts[i]]) {
        obj = obj[parts[i]] as Record<string, unknown>;
      } else {
        return { success: false, reason: 'path-not-found' };
      }
    }
    
    var lastKey = parts[parts.length - 1];
    if (data.hadPrevious) {
      obj[lastKey] = data.previousValue;
    } else {
      delete obj[lastKey];
    }
    return { success: true, action: data.hadPrevious ? 'restored' : 'deleted' };
  }
  
  /**
   * Reverte um efeito de DOM element
   */
  function _revertDomElement(effect: RollbackEffect): RevertResult {
    var data = effect.data as { element: Element | null };
    if (data.element && data.element.parentNode) {
      data.element.parentNode.removeChild(data.element);
      return { success: true, action: 'removed' };
    }
    return { success: false, reason: 'element-not-in-dom' };
  }
  
  /**
   * Reverte um event listener
   */
  function _revertEventListener(effect: RollbackEffect): RevertResult {
    var data = effect.data as { target: EventTarget | null; handler: EventListener | null; event: string; options?: EventListenerOptions };
    if (data.target && data.handler) {
      try {
        data.target.removeEventListener(data.event, data.handler, data.options);
        return { success: true, action: 'removed' };
      } catch (e) {
        return { success: false, reason: (e as Error).message };
      }
    }
    return { success: false, reason: 'invalid-listener-data' };
  }
  
  /**
   * Reverte um interval
   */
  function _revertInterval(effect: RollbackEffect): RevertResult {
    var data = effect.data as { intervalId: ReturnType<typeof setInterval> | null };
    if (data.intervalId) {
      clearInterval(data.intervalId);
      return { success: true, action: 'cleared' };
    }
    return { success: false, reason: 'no-interval-id' };
  }
  
  /**
   * Reverte um timeout
   */
  function _revertTimeout(effect: RollbackEffect): RevertResult {
    var data = effect.data as { timeoutId: ReturnType<typeof setTimeout> | null };
    if (data.timeoutId) {
      clearTimeout(data.timeoutId);
      return { success: true, action: 'cleared' };
    }
    return { success: false, reason: 'no-timeout-id' };
  }
  
  /**
   * Reverte storage
   */
  function _revertStorage(effect: RollbackEffect): RevertResult {
    var data = effect.data as { storageType: string; key: string; hadPrevious: boolean; previousValue: string };
    var storage = data.storageType === 'session' ? sessionStorage : localStorage;

    try {
      if (data.hadPrevious) {
        storage.setItem(data.key, data.previousValue);
      } else {
        storage.removeItem(data.key);
      }
      return { success: true, action: data.hadPrevious ? 'restored' : 'removed' };
    } catch (e) {
      return { success: false, reason: (e as Error).message };
    }
  }
  
  /**
   * Reverte custom effect
   */
  function _revertCustom(effect: RollbackEffect): RevertResult {
    var data = effect.data as { rollbackFn?: () => void };
    if (typeof data.rollbackFn === 'function') {
      try {
        data.rollbackFn();
        return { success: true, action: 'custom-executed' };
      } catch (e) {
        return { success: false, reason: (e as Error).message };
      }
    }
    return { success: false, reason: 'no-rollback-function' };
  }
  
  /**
   * Reverte um único efeito
   */
  function revertEffect(effect: RollbackEffect) {
    var result: RevertResult;
    
    switch (effect.type) {
      case EFFECT_TYPES.WINDOW_PROPERTY:
        result = _revertWindowProperty(effect);
        break;
      case EFFECT_TYPES.GLOBAL_OBJECT:
        result = _revertGlobalObject(effect);
        break;
      case EFFECT_TYPES.DOM_ELEMENT:
        result = _revertDomElement(effect);
        break;
      case EFFECT_TYPES.EVENT_LISTENER:
        result = _revertEventListener(effect);
        break;
      case EFFECT_TYPES.INTERVAL:
        result = _revertInterval(effect);
        break;
      case EFFECT_TYPES.TIMEOUT:
        result = _revertTimeout(effect);
        break;
      case EFFECT_TYPES.STORAGE:
        result = _revertStorage(effect);
        break;
      case EFFECT_TYPES.CUSTOM:
        result = _revertCustom(effect);
        break;
      default:
        result = { success: false, reason: 'unknown-effect-type' };
    }
    
    // Atualiza métricas
    if (result.success) {
      _metrics.effectsReverted++;
    } else {
      _metrics.effectsFailed++;
    }
    _metrics.byType[effect.type] = (_metrics.byType[effect.type] || 0) + 1;
    
    return result;
  }
  
  /**
   * Executa rollback completo de uma fase
   */
  function rollbackPhase(phaseId: string) {
    if (!registry) {
      _log('error', 'No registry provided');
      return { success: false, reason: 'no-registry' };
    }
    
    var effects = registry.getEffects(phaseId);
    
    if (effects.length === 0) {
      _log('debug', 'No effects to rollback for phase: ' + phaseId);
      return { success: true, effectsReverted: 0, effectsFailed: 0 };
    }
    
    _log('info', 'Starting rollback for phase: ' + phaseId, { effectCount: effects.length });
    _emit('rollback-start', { phaseId: phaseId, effectCount: effects.length });
    
    var results: Array<{ effectId: string; type: string; success: boolean; action?: string; reason?: string }> = [];
    var reverted = 0;
    var failed = 0;
    
    for (var i = 0; i < effects.length; i++) {
      var effect = effects[i];
      
      try {
        var result = revertEffect(effect);
        results.push({
          effectId: effect.id,
          type: effect.type,
          success: result.success,
          action: result.action,
          reason: result.reason
        });
        
        if (result.success) {
          reverted++;
          _log('debug', 'Reverted effect', { effectId: effect.id, type: effect.type, action: result.action });
        } else {
          failed++;
          _log('warn', 'Failed to revert effect', { effectId: effect.id, type: effect.type, reason: result.reason });
          
          if (!continueOnError) {
            break;
          }
        }
      } catch (error) {
        failed++;
        results.push({
          effectId: effect.id,
          type: effect.type,
          success: false,
          reason: (error as Error).message
        });
        _log('error', 'Error reverting effect', { effectId: effect.id, error: (error as Error).message });
        
        if (!continueOnError) {
          break;
        }
      }
    }
    
    // Limpa registry da fase
    registry.clearPhase(phaseId);
    
    _metrics.rollbacksExecuted++;
    
    var summary = {
      success: failed === 0,
      phaseId: phaseId,
      effectsReverted: reverted,
      effectsFailed: failed,
      totalEffects: effects.length,
      results: results
    };
    
    _log('info', 'Rollback complete for phase: ' + phaseId, {
      reverted: reverted,
      failed: failed,
      success: summary.success
    });
    
    _emit('rollback-complete', summary);
    
    return summary;
  }
  
  /**
   * Rollback múltiplas fases (em ordem reversa)
   */
  function rollbackPhases(phaseIds: string[]) {
    var results = [];
    var totalReverted = 0;
    var totalFailed = 0;
    
    // Executa em ordem reversa
    for (var i = phaseIds.length - 1; i >= 0; i--) {
      var result = rollbackPhase(phaseIds[i]);
      results.push(result);
      // @ts-expect-error strict migration — TS18048
      totalReverted += result.effectsReverted;
      // @ts-expect-error strict migration — TS18048
      totalFailed += result.effectsFailed;
    }
    
    return {
      success: totalFailed === 0,
      phasesRolledBack: phaseIds.length,
      totalReverted: totalReverted,
      totalFailed: totalFailed,
      results: results
    };
  }
  
  /**
   * Reset métricas
   */
  function reset() {
    _metrics.rollbacksExecuted = 0;
    _metrics.effectsReverted = 0;
    _metrics.effectsFailed = 0;
    _metrics.byType = {};
  }
  
  /**
   * Info
   */
  function info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      metrics: Object.assign({}, _metrics),
      continueOnError: continueOnError,
      hasRegistry: !!registry
    };
  }
  
  return {
    revertEffect: revertEffect,
    rollbackPhase: rollbackPhase,
    rollbackPhases: rollbackPhases,
    reset: reset,
    info: info,
    getMetrics: function() { return Object.assign({}, _metrics); }
  };
}

export { VERSION, MODULE_ID };
export default { createRollbackExecutor };
