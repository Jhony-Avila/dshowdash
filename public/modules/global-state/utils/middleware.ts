// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-middleware
// PURPOSE: Global State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ../core/logger.js
//
// PROVIDES:
//   default export
//   MODULE_ID
//   VERSION
// ═══════════════════════════════════════════════════════════════
'use strict';

import { _log } from '../core/logger.js';

const MODULE_ID = 'global-state-middleware';
const VERSION = '4.2.0-P17WI';

const _metrics = {
  executionsRun: 0,
  executionsPassed: 0,
  executionsBlocked: 0,
  middlewaresAdded: 0,
  middlewaresRemoved: 0,
  errors: 0
};

const _middlewareMap = new Map();
let _middlewareIdCounter = 0;

const StateMiddleware = {
  MODULE_ID,
  VERSION,

  get middlewares() {
    return Array.from(_middlewareMap.values());
  },

  use(fn: (...args: unknown[]) => unknown) {
    if (typeof fn !== 'function') {
      throw new Error('Middleware must be a function');
    }
    const id = ++_middlewareIdCounter;
    _middlewareMap.set(id, fn);
    _metrics.middlewaresAdded++;
    return id;
  },

  remove(idOrFn: number | ((...args: unknown[]) => unknown)) {
    if (typeof idOrFn === 'number') {
      const deleted = _middlewareMap.delete(idOrFn);
      if (deleted) _metrics.middlewaresRemoved++;
      return deleted;
    }
    const entries = _middlewareMap.entries();
    let entry = entries.next();
    while (!entry.done) {
      if (entry.value[1] === idOrFn) {
        _middlewareMap.delete(entry.value[0]);
        _metrics.middlewaresRemoved++;
        return true;
      }
      entry = entries.next();
    }
    return false;
  },

  execute(action: unknown, state: unknown, dispatch: (...args: unknown[]) => unknown) {
    const self = this;
    _metrics.executionsRun++;
    let currentAction = action;
    const middlewares = self.middlewares;

    return new Promise(resolve => {
      let index = 0;
      function next() {
        if (index >= middlewares.length) {
          _metrics.executionsPassed++;
          resolve({ blocked: false, action: currentAction });
          return;
        }
        const middleware = middlewares[index++];
        try {
          Promise.resolve(middleware(currentAction, state, dispatch)).then(result => {
            if (result === false) {
              _metrics.executionsBlocked++;
              resolve({ blocked: true, action: currentAction });
              return;
            }
            if (result && typeof result === 'object' && result.type) {
              currentAction = result;
            }
            next();
          }).catch(error => {
            _metrics.errors++;

            // @ts-expect-error TS migration - TS2554
            _log('error', 'Middleware error:', error);
            resolve({ blocked: true, error });
          });
        } catch (error) {
          _metrics.errors++;

          // @ts-expect-error TS migration - TS2554
          _log('error', 'Middleware sync error:', error);
          resolve({ blocked: true, error });
        }
      }
      next();
    });
  },

  clear() {
    _middlewareMap.clear();
    return this;
  },

  loggerMiddleware(action: unknown, state: unknown) {

    // @ts-expect-error TS migration - TS2554
    _log('info', 'Action:', action.type, action.payload || '');
    return action;
  },

  timestampMiddleware(action: Record<string, unknown>) {
    return Object.assign({}, action, {
      meta: Object.assign({}, action.meta, { timestamp: Date.now() })
    });
  },

  validationMiddleware(action: Record<string, unknown>) {
    if (!action.type) {

      // @ts-expect-error TS migration - TS2554
      _log('warn', 'Action without type blocked');
      return false;
    }
    return action;
  },

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      middlewareCount: _middlewareMap.size,
      metrics: Object.assign({}, _metrics),
      builtInMiddlewares: ['loggerMiddleware', 'timestampMiddleware', 'validationMiddleware'],
      timestamp: Date.now()
    };
  },

  healthCheck() {
    const checks = {
      noErrors: _metrics.errors === 0,
      lowBlockRate: _metrics.executionsRun === 0 || (_metrics.executionsBlocked / _metrics.executionsRun) < 0.5,
      middlewaresHealthy: _middlewareMap.size < 50
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? 'HEALTHY' : 'DEGRADED',
      score: `${passed}/${total}`,
      healthy: passed === total,
      checks,
      metrics: Object.assign({}, _metrics),
      middlewareCount: _middlewareMap.size,
      moduleId: MODULE_ID,
      version: VERSION,
      timestamp: Date.now()
    };
  },

  resetMetrics() {
    _metrics.executionsRun = 0;
    _metrics.executionsPassed = 0;
    _metrics.executionsBlocked = 0;
    _metrics.middlewaresAdded = 0;
    _metrics.middlewaresRemoved = 0;
    _metrics.errors = 0;
  }
};

export default StateMiddleware;
export { MODULE_ID, VERSION };
