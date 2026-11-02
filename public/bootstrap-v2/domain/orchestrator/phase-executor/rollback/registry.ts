// Rollback Registry - Side Effects Tracker
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description Sprint 6: #8 Rollback Automático - Registry de side-effects
// @changelog v1.0.0: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory options):
//   options.logger — optional logger instance
//   options.maxEffectsPerPhase — max effects per phase (default: 100)
// PROVIDES: createRollbackRegistry() factory returning:
//   startPhase(), registerEffect(), getEffects(), clearPhase(),
//   hasEffects(), reset(), info()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.1-CONTRACTS';
var MODULE_ID = 'rollback-registry';

// Tipos de side-effects suportados
var EFFECT_TYPES = Object.freeze({
  WINDOW_PROPERTY: 'window-property',
  GLOBAL_OBJECT: 'global-object',
  DOM_ELEMENT: 'dom-element',
  EVENT_LISTENER: 'event-listener',
  INTERVAL: 'interval',
  TIMEOUT: 'timeout',
  STORAGE: 'storage',
  CUSTOM: 'custom'
});

interface RegistryOptions {
  logger?: Record<string, Function> | null;
  maxEffectsPerPhase?: number;
}

interface SideEffect {
  type: string;
  [key: string]: unknown;
}

interface SideEffectEntry {
  id: string;
  type: string;
  data: SideEffect;
  registeredAt: number;
}

interface PhaseInfo {
  phaseId: string;
  effectCount: number;
}

export function createRollbackRegistry(options: RegistryOptions) {
  if (options === undefined) options = {};

  var logger = options.logger;
  var maxEffectsPerPhase = options.maxEffectsPerPhase || 100;

  // Map: phaseId -> Array<SideEffect>
  var _registry = new Map<string, SideEffectEntry[]>();

  // Métricas
  var _metrics: {
    totalRegistered: number;
    totalRolledBack: number;
    byType: Record<string, number>;
    byPhase: Record<string, number>;
  } = {
    totalRegistered: 0,
    totalRolledBack: 0,
    byType: {},
    byPhase: {}
  };

  function _log(level: string, message: string, data?: Record<string, unknown>) {
    if (logger && logger[level]) {
      logger[level]('[' + MODULE_ID + '] ' + message, data);
    }
  }
  
  function _incrementMetric(type: string, phaseId: string) {
    _metrics.totalRegistered++;
    _metrics.byType[type] = (_metrics.byType[type] || 0) + 1;
    _metrics.byPhase[phaseId] = (_metrics.byPhase[phaseId] || 0) + 1;
  }
  
  /**
   * Inicia tracking para uma fase
   */
  function startPhase(phaseId: string) {
    if (!_registry.has(phaseId)) {
      _registry.set(phaseId, []);
      _log('debug', 'Started tracking phase: ' + phaseId);
    }
    return {
      register: function(effect: SideEffect) {
        return registerEffect(phaseId, effect);
      },
      // Helpers de conveniência
      windowProperty: function(key: string, previousValue: unknown) {
        return registerEffect(phaseId, {
          type: EFFECT_TYPES.WINDOW_PROPERTY,
          key: key,
          previousValue: previousValue,
          hadPrevious: previousValue !== undefined
        });
      },
      globalObject: function(path: string, previousValue: unknown) {
        return registerEffect(phaseId, {
          type: EFFECT_TYPES.GLOBAL_OBJECT,
          path: path,
          previousValue: previousValue,
          hadPrevious: previousValue !== undefined
        });
      },
      domElement: function(element: Element | null, parent: Node | null) {
        return registerEffect(phaseId, {
          type: EFFECT_TYPES.DOM_ELEMENT,
          element: element,
          parent: parent || (element ? element.parentNode : null)
        });
      },
      eventListener: function(target: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions) {
        return registerEffect(phaseId, {
          type: EFFECT_TYPES.EVENT_LISTENER,
          target: target,
          event: event,
          handler: handler,
          options: options
        });
      },
      interval: function(intervalId: ReturnType<typeof setInterval>) {
        return registerEffect(phaseId, {
          type: EFFECT_TYPES.INTERVAL,
          intervalId: intervalId
        });
      },
      timeout: function(timeoutId: ReturnType<typeof setTimeout>) {
        return registerEffect(phaseId, {
          type: EFFECT_TYPES.TIMEOUT,
          timeoutId: timeoutId
        });
      },
      storage: function(storageType: string, key: string, previousValue: string | null) {
        return registerEffect(phaseId, {
          type: EFFECT_TYPES.STORAGE,
          storageType: storageType,
          key: key,
          previousValue: previousValue,
          hadPrevious: previousValue !== undefined
        });
      },
      custom: function(rollbackFn: () => void, description: string) {
        return registerEffect(phaseId, {
          type: EFFECT_TYPES.CUSTOM,
          rollbackFn: rollbackFn,
          description: description || 'custom-effect'
        });
      }
    };
  }
  
  /**
   * Registra um side-effect
   */
  function registerEffect(phaseId: string, effect: SideEffect) {
    if (!_registry.has(phaseId)) {
      _registry.set(phaseId, []);
    }
    
    var effects = _registry.get(phaseId);
    
    if (effects!.length >= maxEffectsPerPhase) {
      _log('warn', 'Max effects reached for phase: ' + phaseId, { max: maxEffectsPerPhase });
      return false;
    }
    
    var entry = {
      id: phaseId + '-' + effects!.length,
      type: effect.type,
      data: effect,
      registeredAt: Date.now()
    };
    
    effects!.push(entry);
    _incrementMetric(effect.type, phaseId);
    
    _log('debug', 'Registered effect', { phaseId: phaseId, type: effect.type, id: entry.id });
    
    return entry.id;
  }
  
  /**
   * Obtém effects de uma fase (em ordem reversa para rollback)
   */
  function getEffects(phaseId: string) {
    var effects = _registry.get(phaseId);
    if (!effects) return [];
    // Retorna cópia em ordem reversa (LIFO)
    return effects.slice().reverse();
  }
  
  /**
   * Marca fase como rolled back e limpa registry
   */
  function clearPhase(phaseId: string) {
    var effects = _registry.get(phaseId);
    if (effects) {
      _metrics.totalRolledBack += effects.length;
      _registry.delete(phaseId);
      _log('debug', 'Cleared phase: ' + phaseId, { effectsCleared: effects.length });
      return true;
    }
    return false;
  }
  
  /**
   * Verifica se fase tem effects registrados
   */
  function hasEffects(phaseId: string) {
    var effects = _registry.get(phaseId);
    return effects && effects.length > 0;
  }
  
  /**
   * Reset completo
   */
  function reset() {
    _registry.clear();
    _metrics.totalRegistered = 0;
    _metrics.totalRolledBack = 0;
    _metrics.byType = {};
    _metrics.byPhase = {};
    _log('info', 'Registry reset');
  }
  
  /**
   * Info
   */
  function info() {
    var phases: PhaseInfo[] = [];
    _registry.forEach(function(effects: SideEffectEntry[], phaseId: string) {
      phases.push({ phaseId: phaseId, effectCount: effects.length });
    });
    
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      trackedPhases: _registry.size,
      phases: phases,
      metrics: Object.assign({}, _metrics),
      effectTypes: Object.keys(EFFECT_TYPES)
    };
  }
  
  return {
    startPhase: startPhase,
    registerEffect: registerEffect,
    getEffects: getEffects,
    clearPhase: clearPhase,
    hasEffects: hasEffects,
    reset: reset,
    info: info,
    EFFECT_TYPES: EFFECT_TYPES
  };
}

export { EFFECT_TYPES, VERSION, MODULE_ID };
export default { createRollbackRegistry, EFFECT_TYPES };
