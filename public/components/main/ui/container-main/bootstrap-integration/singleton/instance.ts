// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.9.0-SPRINT6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: instance
// PURPOSE: Bootstrap Integration - Singleton Instance
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, BOOTSTRAP_STATES from ../constants.js
//
// PROVIDES:
//   getInstance() — exported function
//   resetInstance() — exported function
//   hasInstance() — exported function
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

import { VERSION, MODULE_ID, BOOTSTRAP_STATES } from '../constants.js';

let _instance: Record<string, unknown> | null = null;

/**
 * Obtém ou cria instância singleton
 * @param {Function} createFn - Factory function
 * @param {Object} options
 * @returns {Object}
 */
export function getInstance(createFn: (opts: Record<string, unknown>) => Record<string, unknown>, options: Record<string, unknown>) {
  options = options || {};
  if (!_instance) {
    _instance = createFn(options);
  }
  return _instance;
}

/**
 * Reseta instância singleton
 */
export function resetInstance() {
  if (_instance) {
    if (typeof _instance.shutdown === 'function') {
      _instance.shutdown().catch(() => {});
    }
    _instance = null;
  }
}

/**
 * Verifica se instância existe
 * @returns {boolean}
 */
export function hasInstance() {
  return _instance !== null;
}

/**
 * Info do módulo singleton
 * @returns {Object}
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    exports: ['createBootstrap', 'getBootstrap', 'boot'],
    states: Object.keys(BOOTSTRAP_STATES),
    sprint1: true,
    sprint2: true,
    sprint3: true,
    sprint4: true,
    sprint5: true,
    sprint6: true
  };
}

/**
 * Health check standalone
 * @returns {Object}
 */
export function healthCheck() {
  if (_instance && typeof _instance.healthCheck === 'function') {
    return _instance.healthCheck();
  }
  return {
    status: 'NOT_INITIALIZED',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  getInstance,
  resetInstance,
  hasInstance,
  info,
  healthCheck
};
