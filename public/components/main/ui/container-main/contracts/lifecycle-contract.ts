// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:contracts:lifecycle
// PURPOSE: Lifecycle Contract - Interface para ciclo de vida de componentes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LIFECYCLE_STATES — exported value
//   VALID_TRANSITIONS — exported value
//   REQUIRED_METHODS — exported value
//   OPTIONAL_METHODS — exported value
//   isValidTransition() — exported function
//   validateLifecycleContract() — exported function
//   createLifecycleWrapper() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:contracts:lifecycle';

const logger = createLogger(MODULE_ID);

// Estados válidos do ciclo de vida
export const LIFECYCLE_STATES = Object.freeze({
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ERROR: 'error',
  DESTROYING: 'destroying',
  DESTROYED: 'destroyed'
});

// Transições válidas de estado
export const VALID_TRANSITIONS = Object.freeze({
  [LIFECYCLE_STATES.IDLE]: [LIFECYCLE_STATES.INITIALIZING],
  [LIFECYCLE_STATES.INITIALIZING]: [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.ERROR],
  [LIFECYCLE_STATES.READY]: [LIFECYCLE_STATES.ACTIVE, LIFECYCLE_STATES.PAUSED, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.ACTIVE]: [LIFECYCLE_STATES.PAUSED, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.PAUSED]: [LIFECYCLE_STATES.ACTIVE, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.ERROR]: [LIFECYCLE_STATES.INITIALIZING, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.DESTROYING]: [LIFECYCLE_STATES.DESTROYED],
  [LIFECYCLE_STATES.DESTROYED]: []
});

// Contrato: Métodos obrigatórios
export const REQUIRED_METHODS = Object.freeze([
  'init',
  'destroy',
  'getState',
  'healthCheck'
]);

// Contrato: Métodos opcionais
export const OPTIONAL_METHODS = Object.freeze([
  'pause',
  'resume',
  'reset',
  'update',
  'onError',
  'onRecover'
]);

// Valida se uma transição de estado é permitida
export function isValidTransition(from: string, to: string) {
  const allowed = (VALID_TRANSITIONS as Record<string, readonly string[]>)[from];
  return allowed ? allowed.includes(to) : false;
}

// Valida se um objeto implementa o contrato de lifecycle
export function validateLifecycleContract(obj: Record<string, unknown>) {
  const result = {
    valid: true,
    missing: [] as unknown[],
    optional: [] as unknown[],
    warnings: [] as unknown[]
  };

  // Verifica métodos obrigatórios
  REQUIRED_METHODS.forEach(method => {
    if (typeof obj[method] !== 'function') {
      result.valid = false;
      result.missing.push(method);
    }
  });

  // Verifica métodos opcionais
  OPTIONAL_METHODS.forEach(method => {
    if (typeof obj[method] === 'function') {
      result.optional.push(method);
    }
  });

  // Warnings
  if (!result.optional.includes('pause') || !result.optional.includes('resume')) {
    result.warnings.push('Componente não suporta pause/resume - pode impactar performance');
  }

  if (!result.optional.includes('onError') || !result.optional.includes('onRecover')) {
    result.warnings.push('Componente não suporta error recovery - falhas serão terminais');
  }

  return result;
}

// Cria um wrapper que garante compliance com o contrato
interface LifecycleComponent {
  init?: () => Promise<void> | void;
  destroy?: () => Promise<void> | void;
  pause?: () => void;
  resume?: () => void;
  onRecover?: () => Promise<void> | void;
  healthCheck?: () => Record<string, unknown>;
  [key: string]: unknown;
}

export function createLifecycleWrapper(component: LifecycleComponent, options: Record<string, any> = {}) {
  const { id = 'unknown', onStateChange } = options;
  
  let _state: string = LIFECYCLE_STATES.IDLE;
  let _error: unknown = null;
  let _initialized = false;

  const _setState = (newState: string) => {
    if (!isValidTransition(_state, newState)) {
      logger.warn(`Invalid state transition: ${_state} -> ${newState}`, { componentId: id });
      return false;
    }
    const oldState = _state;
    _state = newState;
    onStateChange?.(newState, oldState, id);
    return true;
  };

  return {
    getId: () => id,
    
    getState: () => ({
      lifecycle: _state,
      initialized: _initialized,
      error: _error,
      timestamp: Date.now()
    }),

    async init() {
      if (_initialized) return this;
      _setState(LIFECYCLE_STATES.INITIALIZING);
      try {
        if (component.init) await component.init();
        _initialized = true;
        _error = null;
        _setState(LIFECYCLE_STATES.READY);
      } catch (e) {
        _error = e;
        _setState(LIFECYCLE_STATES.ERROR);
        throw e;
      }
      return this;
    },

    async destroy() {
      _setState(LIFECYCLE_STATES.DESTROYING);
      try {
        if (component.destroy) await component.destroy();
      } catch (e) {
        logger.error(`Error during destroy`, { componentId: id, error: (e as Error).message });
      }
      _initialized = false;
      _setState(LIFECYCLE_STATES.DESTROYED);
      return this;
    },

    pause() {

      if (_state !== LIFECYCLE_STATES.ACTIVE) return this;
      if (component.pause) component.pause();
      _setState(LIFECYCLE_STATES.PAUSED);
      return this;
    },

    resume() {

      if (_state !== LIFECYCLE_STATES.PAUSED) return this;
      if (component.resume) component.resume();
      _setState(LIFECYCLE_STATES.ACTIVE);
      return this;
    },

    activate() {

      if (_state === LIFECYCLE_STATES.READY || _state === LIFECYCLE_STATES.PAUSED) {
        _setState(LIFECYCLE_STATES.ACTIVE);
      }
      return this;
    },

    async recover() {

      if (_state !== LIFECYCLE_STATES.ERROR) return this;
      _error = null;
      if (component.onRecover) {
        await component.onRecover();
      }
      _setState(LIFECYCLE_STATES.INITIALIZING);
      return this.init();
    },

    healthCheck() {
      const componentHealth = (component.healthCheck?.() || { status: 'UNKNOWN' }) as Record<string, unknown>;
      return {
        ...componentHealth,
        lifecycle: _state,
        initialized: _initialized,
        hasError: !!_error,
        error: (_error as Error)?.message || null
      };
    },

    getComponent: () => component
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(LIFECYCLE_STATES).length,
    requiredMethods: REQUIRED_METHODS.length,
    optionalMethods: OPTIONAL_METHODS.length
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  VERSION, MODULE_ID,
  LIFECYCLE_STATES, VALID_TRANSITIONS,
  REQUIRED_METHODS, OPTIONAL_METHODS,
  isValidTransition, validateLifecycleContract, createLifecycleWrapper,
  info, healthCheck
};
