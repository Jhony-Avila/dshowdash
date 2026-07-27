
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:lifecycle-guard
// PURPOSE: Lifecycle Guard - Garantia de idempotência automática
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   GUARD_STATES — exported value
//   createLifecycleGuard() — exported function
//   getLifecycleGuard() — exported function
//   resetGlobalGuard() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:lifecycle-guard';

// Estados do guard
export const GUARD_STATES = Object.freeze({
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  INITIALIZED: 'initialized',
  DESTROYING: 'destroying',
  DESTROYED: 'destroyed',
  ERROR: 'error'
});

// Cria instância do Lifecycle Guard
export function createLifecycleGuard(options: Record<string, any> = {}) {
  const {
    eventBus,
    onStateChange,
    onIdempotencyViolation,
    onError,
    trackMetrics = true
  } = options;

  // Registry de componentes guardados
  const _guardedComponents = new Map();
  
  // Métricas globais
  let _metrics = {
    totalGuarded: 0,
    initAttempts: 0,
    initBlocked: 0,
    destroyAttempts: 0,
    destroyBlocked: 0,
    violations: 0,
    errors: 0
  };

  let _destroyed = false;

  // Emite evento
  function _emit(event: string, data: Record<string, unknown>) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }

  // Cria registro para componente
  function _createGuardRecord(componentId: string) {
    return {
      componentId,
      state: GUARD_STATES.IDLE,
      initCount: 0,
      destroyCount: 0,
      lastInit: null as Record<string, unknown> | null,
      lastDestroy: null as Record<string, unknown> | null,
      errors: [] as unknown[],
      createdAt: Date.now()
    };
  }

  // Obtém ou cria registro
  function _getRecord(componentId: string) {
    if (!_guardedComponents.has(componentId)) {
      _guardedComponents.set(componentId, _createGuardRecord(componentId));
      _metrics.totalGuarded++;
    }
    return _guardedComponents.get(componentId);
  }

  // Atualiza estado do componente
  function _setState(componentId: string, newState: string) {
    const record = _getRecord(componentId);
    const oldState = record.state;
    record.state = newState;
    
    onStateChange?.(componentId, newState, oldState);
    _emit('lifecycle-guard:state-changed', { componentId, state: newState, previousState: oldState });
  }

  const guard = {
    // Registra componente para guarda
    register(componentId: string) {
      if (_destroyed) return false;
      _getRecord(componentId);
      _emit('lifecycle-guard:registered', { componentId });
      return true;
    },

    // Remove registro
    unregister(componentId: string) {
      _guardedComponents.delete(componentId);
      _emit('lifecycle-guard:unregistered', { componentId });
      return true;
    },

    // Verifica se pode inicializar
    canInit(componentId: string) {
      const record = _getRecord(componentId);
      return record.state === GUARD_STATES.IDLE || 
             record.state === GUARD_STATES.DESTROYED ||
             record.state === GUARD_STATES.ERROR;
    },

    // Verifica se pode destruir
    canDestroy(componentId: string) {
      const record = _getRecord(componentId);
      return record.state === GUARD_STATES.INITIALIZED ||
             record.state === GUARD_STATES.ERROR;
    },

    // Guarda init - executa apenas se permitido
    async guardInit(componentId: string, initFn: () => Promise<unknown>) {
      if (_destroyed) return { success: false, reason: 'guard-destroyed' };
      
      const record = _getRecord(componentId);
      _metrics.initAttempts++;

      // Verifica se já está inicializando
      if (record.state === GUARD_STATES.INITIALIZING) {
        _metrics.initBlocked++;
        _metrics.violations++;
        onIdempotencyViolation?.(componentId, 'init', 'already-initializing');
        _emit('lifecycle-guard:violation', { componentId, operation: 'init', reason: 'already-initializing' });
        return { success: false, reason: 'already-initializing', blocked: true };
      }

      // Verifica se já está inicializado
      if (record.state === GUARD_STATES.INITIALIZED) {
        _metrics.initBlocked++;
        _metrics.violations++;
        onIdempotencyViolation?.(componentId, 'init', 'already-initialized');
        _emit('lifecycle-guard:violation', { componentId, operation: 'init', reason: 'already-initialized' });
        return { success: false, reason: 'already-initialized', blocked: true };
      }

      // Executa init
      _setState(componentId, GUARD_STATES.INITIALIZING);
      record.initCount++;
      record.lastInit = Date.now();

      try {
        const result = await initFn();
        _setState(componentId, GUARD_STATES.INITIALIZED);
        _emit('lifecycle-guard:init-success', { componentId, initCount: record.initCount });
        return { success: true, result };
      } catch (error: any) {
        _setState(componentId, GUARD_STATES.ERROR);
        record.errors.push({ type: 'init', error: error.message, timestamp: Date.now() });
        _metrics.errors++;
        onError?.(componentId, 'init', error);
        _emit('lifecycle-guard:init-error', { componentId, error: error.message });
        return { success: false, reason: 'error', error };
      }
    },

    // Guarda destroy - executa apenas se permitido
    async guardDestroy(componentId: string, destroyFn: () => Promise<unknown>) {
      if (_destroyed) return { success: false, reason: 'guard-destroyed' };

      const record = _getRecord(componentId);
      _metrics.destroyAttempts++;

      // Verifica se já está destruindo
      if (record.state === GUARD_STATES.DESTROYING) {
        _metrics.destroyBlocked++;
        _metrics.violations++;
        onIdempotencyViolation?.(componentId, 'destroy', 'already-destroying');
        _emit('lifecycle-guard:violation', { componentId, operation: 'destroy', reason: 'already-destroying' });
        return { success: false, reason: 'already-destroying', blocked: true };
      }

      // Verifica se já está destruído ou idle
      if (record.state === GUARD_STATES.DESTROYED || record.state === GUARD_STATES.IDLE) {
        _metrics.destroyBlocked++;
        _metrics.violations++;
        onIdempotencyViolation?.(componentId, 'destroy', 'already-destroyed');
        _emit('lifecycle-guard:violation', { componentId, operation: 'destroy', reason: 'already-destroyed' });
        return { success: false, reason: 'already-destroyed', blocked: true };
      }

      // Executa destroy
      _setState(componentId, GUARD_STATES.DESTROYING);
      record.destroyCount++;
      record.lastDestroy = Date.now();

      try {
        const result = await destroyFn();
        _setState(componentId, GUARD_STATES.DESTROYED);
        _emit('lifecycle-guard:destroy-success', { componentId, destroyCount: record.destroyCount });
        return { success: true, result };
      } catch (error: any) {
        _setState(componentId, GUARD_STATES.ERROR);
        record.errors.push({ type: 'destroy', error: error.message, timestamp: Date.now() });
        _metrics.errors++;
        onError?.(componentId, 'destroy', error);
        _emit('lifecycle-guard:destroy-error', { componentId, error: error.message });
        return { success: false, reason: 'error', error };
      }
    },

    // Wrapper completo para componente
    wrapComponent(componentId: string, component: Record<string, unknown>) {
      const originalInit = (component.init as ((...args: unknown[]) => unknown) | undefined)?.bind(component);
      const originalDestroy = (component.destroy as ((...args: unknown[]) => unknown) | undefined)?.bind(component);

      if (originalInit) {
        component.init = async (...args: unknown[]) => {
          // @ts-expect-error strict migration — TS2322
          const result = await this.guardInit(componentId, () => originalInit(...args));
          if (!result.success && result.blocked) {
            return component; // Retorna componente sem re-inicializar
          }
          if (!result.success) throw result.error;
          return result.result || component;
        };
      }

      if (originalDestroy) {
        component.destroy = async (...args: unknown[]) => {
          // @ts-expect-error strict migration — TS2322
          const result = await this.guardDestroy(componentId, () => originalDestroy(...args));
          if (!result.success && result.blocked) {
            return; // Já destruído, ignora
          }
          if (!result.success && result.error) throw result.error;
          return result.result;
        };
      }

      // Adiciona método de status
      component.getLifecycleState = () => this.getState(componentId);
      component.isInitialized = () => this.getState(componentId) === GUARD_STATES.INITIALIZED;
      component.isDestroyed = () => this.getState(componentId) === GUARD_STATES.DESTROYED;

      this.register(componentId);
      return component;
    },

    // Factory para criar componentes guardados
    createGuarded(componentId: string, createFn: (...args: unknown[]) => Record<string, unknown>, ...args: unknown[]) {
      const component = createFn(...args);
      return this.wrapComponent(componentId, component);
    },

    // Obtém estado de um componente
    getState(componentId: string) {
      const record = _guardedComponents.get(componentId);
      return record?.state || GUARD_STATES.IDLE;
    },

    // Obtém registro completo
    getRecord(componentId: string) {
      const record = _guardedComponents.get(componentId);
      return record ? { ...record } : null;
    },

    // Lista todos os componentes guardados
    list() {
      const list: unknown[] = [];
      _guardedComponents.forEach((record, id) => {
        list.push({ componentId: id, state: record.state, initCount: record.initCount, destroyCount: record.destroyCount });
      });
      return list;
    },

    // Obtém componentes por estado
    getByState(state: string) {
      const result: unknown[] = [];
      _guardedComponents.forEach((record, id) => {
        if (record.state === state) {
          result.push(id);
        }
      });
      return result;
    },

    // Reseta estado de um componente
    reset(componentId: string) {
      const record = _guardedComponents.get(componentId);
      if (record) {
        record.state = GUARD_STATES.IDLE;
        record.errors = [];
        _emit('lifecycle-guard:reset', { componentId });
      }
      return this;
    },

    // Reseta todos os componentes
    resetAll() {
      _guardedComponents.forEach((record, id) => {
        record.state = GUARD_STATES.IDLE;
        record.errors = [];
      });
      _emit('lifecycle-guard:reset-all', { count: _guardedComponents.size });
      return this;
    },

    // Obtém métricas
    getMetrics() {
      return {
        ..._metrics,
        activeComponents: _guardedComponents.size,
        byState: {
          idle: this.getByState(GUARD_STATES.IDLE).length,
          initialized: this.getByState(GUARD_STATES.INITIALIZED).length,
          destroyed: this.getByState(GUARD_STATES.DESTROYED).length,
          error: this.getByState(GUARD_STATES.ERROR).length
        }
      };
    },

    // Health check
    healthCheck() {
      const metrics = this.getMetrics();
      const errorCount = metrics.byState.error;

      let status = 'HEALTHY';
      if (errorCount > 5) status = 'ERROR';
      else if (errorCount > 0) status = 'WARNING';
      else if (metrics.violations > 10) status = 'DEGRADED';

      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        metrics,
        errorComponents: this.getByState(GUARD_STATES.ERROR)
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        guardedComponents: _guardedComponents.size,
        states: Object.keys(GUARD_STATES)
      };
    },

    // Destroy
    destroy() {
      _destroyed = true;
      _guardedComponents.clear();
      _emit('lifecycle-guard:destroyed', { metrics: _metrics });
    }
  };

  return guard;
}

// Singleton global
let _globalGuard: ReturnType<typeof createLifecycleGuard> | null = null;

export function getLifecycleGuard(options: Record<string, unknown>) {
  if (!_globalGuard) {
    _globalGuard = createLifecycleGuard(options);
  }
  return _globalGuard;
}

export function resetGlobalGuard() {
  if (_globalGuard) {
    _globalGuard.destroy();
    _globalGuard = null;
  }
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['createLifecycleGuard', 'getLifecycleGuard'],
    states: Object.keys(GUARD_STATES)
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalGuard: !!_globalGuard
  };
}

export default {
  VERSION, MODULE_ID,
  GUARD_STATES,
  createLifecycleGuard, getLifecycleGuard, resetGlobalGuard,
  info, healthCheck
};
