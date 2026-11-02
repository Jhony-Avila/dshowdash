
// Boot State Machine
// @version 2.0.0-BOOT-CONTRACT
// @changelog v2.0.0-BOOT-CONTRACT: Integração com boot-contract.js como fonte única de verdade
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.0-ENTERPRISE: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   BOOT_STATES, VALID_TRANSITIONS, PHASE_TO_STATE, STATE_TO_PHASE,
//   canTransition as contractCanTransition, isBootComplete, isBootFailed,
//   isTerminalState, validateTransition from ../contracts/boot-contract.js
//
// PROVIDES: createBootStateMachine() factory returning:
//   transition(), transitionToPhase(), canTransition(), getState(),
//   getHistory(), isState(), isReady(), isError(), isDegraded(),
//   isTerminal(), on(), reset(), info(), validateSequence()
//
// ALSO EXPORTS (re-exported from boot-contract for backward compat):
//   BOOT_STATES, VALID_TRANSITIONS, PHASE_TO_STATE
//
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  BOOT_STATES,
  VALID_TRANSITIONS,
  PHASE_TO_STATE,
  STATE_TO_PHASE,
  canTransition as contractCanTransition,
  isBootComplete,
  isBootFailed,
  isTerminalState,
  validateTransition,
  validateBootSequence
} from '../contracts/boot-contract.js';

var MODULE_ID = 'boot-state-machine';
var VERSION = '2.0.0-BOOT-CONTRACT';

// ═══════════════════════════════════════════════════════════════
// LEGACY MAPPING — Backward compatibility para estados antigos
// ═══════════════════════════════════════════════════════════════
// O state-machine antigo usava estados como 'loading-critical'
// O boot-contract usa estados como 'phase-0-critical'
// Este mapeamento garante backward compat

var LEGACY_STATE_MAP = {
  'loading-critical': BOOT_STATES.PHASE_0_CRITICAL,
  'loading-core': BOOT_STATES.PHASE_1_CORE,
  'authenticating': BOOT_STATES.PHASE_2_AUTH,
  'loading-shell': BOOT_STATES.PHASE_3_SHELL,
  'loading-main': BOOT_STATES.PHASE_4_MAIN,
  'loading-ui': BOOT_STATES.PHASE_5_UI,
  'loading-platform': BOOT_STATES.PHASE_6_PLATFORM,
  'error': BOOT_STATES.FAILED,
  'recovering': BOOT_STATES.RECOVERING
};

// Inverso para emitir estados legados se necessário
var REVERSE_LEGACY_MAP: Record<string, string> = {};
Object.keys(LEGACY_STATE_MAP).forEach(function(key: string) {
  REVERSE_LEGACY_MAP[(LEGACY_STATE_MAP as Record<string, string>)[key]] = key;
});

function _normalizeLegacyState(state: string): string {
  return (LEGACY_STATE_MAP as Record<string, string>)[state] || state;
}

// ═══════════════════════════════════════════════════════════════
// createBootStateMachine — Factory principal
// ═══════════════════════════════════════════════════════════════

// Types
interface StateMachineOptions {
  maxHistory?: number;
}

interface TransitionRecord {
  from: string;
  to: string;
  timestamp: number;
  metadata: Record<string, unknown>;
  warnings: string[];
}

function createBootStateMachine(options?: StateMachineOptions) {
  if (options === undefined) options = {};

  var currentState: string = BOOT_STATES.COLD;
  var history: TransitionRecord[] = [];
  var listeners: Record<string, Array<(record: TransitionRecord) => void>> = {};
  var maxHistory = options.maxHistory || 50;
  var context: { phase0Complete: boolean; skippedPhases: string[] } = {
    phase0Complete: false,
    skippedPhases: []
  };

  // ─────────────────────────────────────────────────────────────
  // canTransition — Usa boot-contract como fonte de verdade
  // ─────────────────────────────────────────────────────────────
  function canTransition(toState: string) {
    var normalizedTo = _normalizeLegacyState(toState);
    return contractCanTransition(currentState, normalizedTo);
  }

  // ─────────────────────────────────────────────────────────────
  // transition — Transição com validação via contrato
  // ─────────────────────────────────────────────────────────────
  function transition(toState: string, metadata: Record<string, unknown>) {
    if (metadata === undefined) metadata = {};

    var normalizedTo = _normalizeLegacyState(toState);

    // Usar validateTransition do contrato para validação completa
    var validation = validateTransition(currentState, normalizedTo, context);

    if (!validation.valid) {
      return {
        success: false,
        error: 'Invalid transition: ' + currentState + ' → ' + normalizedTo,
        details: validation.errors,
        warnings: validation.warnings
      };
    }

    var fromState = currentState;
    currentState = normalizedTo;

    // Atualizar contexto
    if (normalizedTo === BOOT_STATES.PHASE_0_CRITICAL) {
      // Não marca como completo ainda — marca quando SAI de phase-0
    }
    if (fromState === BOOT_STATES.PHASE_0_CRITICAL) {
      context.phase0Complete = true;
    }

    var record = {
      from: fromState,
      to: normalizedTo,
      timestamp: Date.now(),
      metadata: metadata,
      warnings: validation.warnings
    };

    history.push(record);
    if (history.length > maxHistory) {
      history.shift();
    }

    // Notificar listeners
    var handlers = listeners['transition'] || [];
    for (var i = 0; i < handlers.length; i++) {
      try {
        handlers[i](record);
      } catch (e) {
        // Silently ignore listener errors
      }
    }

    // Notificar listeners específicos do estado
    var stateHandlers = listeners[normalizedTo] || [];
    for (var j = 0; j < stateHandlers.length; j++) {
      try {
        stateHandlers[j](record);
      } catch (e) {
        // Silently ignore
      }
    }

    return {
      success: true,
      record: record,
      warnings: validation.warnings
    };
  }

  // ─────────────────────────────────────────────────────────────
  // transitionToPhase — Transição via ID de fase
  // ─────────────────────────────────────────────────────────────
  function transitionToPhase(phaseId: string, metadata: Record<string, unknown>) {
    var targetState = (PHASE_TO_STATE as Record<string, string>)[phaseId];
    if (!targetState) {
      return {
        success: false,
        error: 'Unknown phase: ' + phaseId
      };
    }
    return transition(targetState, Object.assign({ phaseId: phaseId }, metadata || {}));
  }

  // ─────────────────────────────────────────────────────────────
  // markPhaseSkipped — Marca fase como pulada (para validação)
  // ─────────────────────────────────────────────────────────────
  function markPhaseSkipped(phaseId: string) {
    if (context.skippedPhases.indexOf(phaseId) === -1) {
      context.skippedPhases.push(phaseId);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // State accessors
  // ─────────────────────────────────────────────────────────────
  function getState() {
    return currentState;
  }

  function getHistory() {
    return history.slice();
  }

  function getStateHistory() {
    return history.map(function(record) {
      return record.to;
    });
  }

  function isState(state: string) {
    var normalized = _normalizeLegacyState(state);
    return currentState === normalized;
  }

  function isReady() {
    return currentState === BOOT_STATES.READY;
  }

  function isDegraded() {
    return currentState === BOOT_STATES.DEGRADED;
  }

  function isError() {
    return isBootFailed(currentState);
  }

  function isTerminal() {
    return isTerminalState(currentState);
  }

  function isComplete() {
    return isBootComplete(currentState);
  }

  // ─────────────────────────────────────────────────────────────
  // Event listeners
  // ─────────────────────────────────────────────────────────────
  function on(event: string, handler: (record: TransitionRecord) => void) {
    var normalized = _normalizeLegacyState(event);
    if (!listeners[normalized]) {
      listeners[normalized] = [];
    }
    listeners[normalized].push(handler);

    // Return unsubscribe function
    return function() {
      var handlers = listeners[normalized] || [];
      var idx = handlers.indexOf(handler);
      if (idx !== -1) {
        handlers.splice(idx, 1);
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // validateSequence — Valida sequência usando boot-contract
  // ─────────────────────────────────────────────────────────────
  function validateSequence() {
    var stateHistory: string[] = ([BOOT_STATES.COLD] as string[]).concat(getStateHistory());
    return validateBootSequence(stateHistory);
  }

  // ─────────────────────────────────────────────────────────────
  // reset
  // ─────────────────────────────────────────────────────────────
  function reset() {
    currentState = BOOT_STATES.COLD;
    history.length = 0;
    context.phase0Complete = false;
    context.skippedPhases = [];
  }

  // ─────────────────────────────────────────────────────────────
  // info
  // ─────────────────────────────────────────────────────────────
  function info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      currentState: currentState,
      historyLength: history.length,
      isReady: isReady(),
      isDegraded: isDegraded(),
      isError: isError(),
      isTerminal: isTerminal(),
      isComplete: isComplete(),
      context: {
        phase0Complete: context.phase0Complete,
        skippedPhases: context.skippedPhases.slice()
      },
      contractIntegrated: true
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Return public API
  // ─────────────────────────────────────────────────────────────
  return {
    // Core transitions
    transition: transition,
    transitionToPhase: transitionToPhase,
    canTransition: canTransition,
    markPhaseSkipped: markPhaseSkipped,

    // State accessors
    getState: getState,
    getHistory: getHistory,
    getStateHistory: getStateHistory,
    isState: isState,
    isReady: isReady,
    isDegraded: isDegraded,
    isError: isError,
    isTerminal: isTerminal,
    isComplete: isComplete,

    // Validation
    validateSequence: validateSequence,

    // Events
    on: on,

    // Lifecycle
    reset: reset,
    info: info,

    // Expose states for backward compat
    STATES: BOOT_STATES
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS — Re-export do boot-contract para backward compat
// ═══════════════════════════════════════════════════════════════

export {
  createBootStateMachine,
  BOOT_STATES,
  VALID_TRANSITIONS,
  PHASE_TO_STATE,
  MODULE_ID,
  VERSION
};

export default createBootStateMachine;
