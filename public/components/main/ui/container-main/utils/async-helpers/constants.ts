// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:async-helpers:constants
// PURPOSE: Async Helpers - Constantes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_TIMEOUTS — exported value
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

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:async-helpers:constants';

// Timeouts padrão (em ms)
export const DEFAULT_TIMEOUTS = Object.freeze({
  SHORT: 5000,      // 5s - operações rápidas
  MEDIUM: 15000,    // 15s - operações normais
  LONG: 30000,      // 30s - operações longas
  VERY_LONG: 60000, // 60s - operações muito longas
  FETCH: 10000,     // 10s - fetch padrão
  API: 20000,       // 20s - chamadas de API
  UPLOAD: 120000,   // 2min - uploads
  DOWNLOAD: 180000  // 3min - downloads
});

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    timeouts: Object.keys(DEFAULT_TIMEOUTS)
  };
}

export default {
  VERSION,
  MODULE_ID,
  DEFAULT_TIMEOUTS,
  info
};
