// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.toast.service.config
// PURPOSE: Toast Service Config - Configuration and defaults
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract CONFIG - configuration object constant
// @contract GET_CONFIG - getConfig() returns config copy
// @contract UPDATE_CONFIG - updateConfig() updates config
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CONFIG — configuration object
//   getConfig() — exported function
//   updateConfig() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): options object
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.1.0-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'toast.service.config';

export const CONFIG = {
  maxVisible: 3,
  stackGap: 12,
  position: 'bottom-right',
  zIndex: 10003,
  durations: {
    success: 3000,
    info: 4000,
    warning: 5000,
    error: 7000,
    critical: 0
  },
  colors: {
    success: { accent: '#22c55e', rgb: '34, 197, 94' },
    info: { accent: '#3b82f6', rgb: '59, 130, 246' },
    warning: { accent: '#f59e0b', rgb: '245, 158, 11' },
    error: { accent: '#ef4444', rgb: '239, 68, 68' },
    critical: { accent: '#dc2626', rgb: '220, 38, 38' }
  },
  badges: {
    success: 'SUCESSO',
    info: 'INFO',
    warning: 'ATENÇÃO',
    error: 'ERRO',
    critical: 'CRÍTICO'
  }
};

export function getConfig() {
  return Object.assign({}, CONFIG);
}

export function updateConfig(options: Record<string, unknown>) {
  if (!options) options = {};
  Object.assign(CONFIG, options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), timestamp: Date.now() };
}

export function healthCheck() {
  const checks: Record<string, boolean> = { configValid: typeof CONFIG === 'object', hasDurations: typeof CONFIG.durations === 'object', hasColors: typeof CONFIG.colors === 'object' };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i]]) passed++; }
  return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, moduleId: MODULE_ID, version: VERSION, checks, timestamp: Date.now() };
}

export default { CONFIG, getConfig, updateConfig, VERSION, MODULE_ID, info, healthCheck };
