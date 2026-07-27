// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:resource-manager:constants
// PURPOSE: Resource Manager - Constantes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MEMORY_LIMITS — exported value
//   DEFAULT_PANEL_LIMITS — exported value
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
export const MODULE_ID = 'container-main:resource-manager:constants';

// Limites de memória globais (em bytes)
export const MEMORY_LIMITS = Object.freeze({
  WARNING: 100 * 1024 * 1024,
  CRITICAL: 200 * 1024 * 1024,
  MAX: 300 * 1024 * 1024
});

// Limites padrão por painel
export const DEFAULT_PANEL_LIMITS = Object.freeze({
  maxMemory: 50 * 1024 * 1024,
  maxResources: 20,
  maxMediaResources: 3,
  maxNetworkResources: 5,
  maxTimers: 10,
  throttleOnWarning: true
});

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    memoryLimits: Object.keys(MEMORY_LIMITS),
    panelLimitKeys: Object.keys(DEFAULT_PANEL_LIMITS)
  };
}

export default {
  VERSION,
  MODULE_ID,
  MEMORY_LIMITS,
  DEFAULT_PANEL_LIMITS,
  info
};
