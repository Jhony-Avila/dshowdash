// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:async-helpers:abort-controller
// PURPOSE: Async Helpers - AbortController Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   incrementAborted from ./metrics.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createAbortController() — exported function
//   abortByKey() — exported function
//   abortAll() — exported function
//   isActive() — exported function
//   getActiveCount() — exported function
//   getActiveKeys() — exported function
//   info() — exported function
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

import { incrementAborted } from './metrics.js';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:async-helpers:abort-controller';

// Registry de controllers ativos
const _activeControllers = new Map();
let _controllerId = 0;

// Cria AbortController gerenciado
// @ts-expect-error strict migration — TS2322
export function createAbortController(key: string = null) {
  const id = key || `ctrl-${++_controllerId}`;
  
  // Aborta controller existente com mesma key
  if (_activeControllers.has(id)) {
    const existing = _activeControllers.get(id);
    if (!existing.signal.aborted) {
      existing.abort('Replaced by new controller');
    }
  }
  
  const controller = new AbortController();
  _activeControllers.set(id, controller);
  
  return {
    id,
    controller,
    signal: controller.signal,
    abort: (reason = 'Manual abort') => {
      if (!controller.signal.aborted) {
        controller.abort(reason);
        incrementAborted();
      }
      _activeControllers.delete(id);
    },
    cleanup: () => {
      _activeControllers.delete(id);
    },
    isAborted: () => controller.signal.aborted
  };
}

// Aborta por key
export function abortByKey(key: string) {
  const controller = _activeControllers.get(key);
  if (controller && !controller.signal.aborted) {
    controller.abort('Aborted by key');
    _activeControllers.delete(key);
    incrementAborted();
    return true;
  }
  return false;
}

// Aborta todos com prefixo
export function abortAll(keyPrefix: unknown = null) {
  let aborted = 0;
  _activeControllers.forEach((controller, key) => {
    if (!keyPrefix || key.startsWith(keyPrefix)) {
      if (!controller.signal.aborted) {
        controller.abort('Abort all');
        aborted++;
      }
      _activeControllers.delete(key);
    }
  });
  if (aborted > 0) {
    for (let i = 0; i < aborted; i++) incrementAborted();
  }
  return aborted;
}

// Verifica se key está ativa
export function isActive(key: string) {
  const controller = _activeControllers.get(key);
  return controller && !controller.signal.aborted;
}

// Conta controllers ativos
export function getActiveCount() {
  let count = 0;
  _activeControllers.forEach((controller) => {
    if (!controller.signal.aborted) count++;
  });
  return count;
}

// Lista keys ativas
export function getActiveKeys() {
  const keys: unknown[] = [];
  _activeControllers.forEach((controller, key) => {
    if (!controller.signal.aborted) keys.push(key);
  });
  return keys;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    activeControllers: getActiveCount()
  };
}

export default {
  VERSION, MODULE_ID,
  createAbortController,
  abortByKey, abortAll,
  isActive, getActiveCount, getActiveKeys,
  info
};
