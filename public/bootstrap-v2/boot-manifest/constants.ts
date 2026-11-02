// Boot Manifest - Constants
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// @description Constantes centralizadas do manifest de boot
// QW#14: Centralização de Timeouts (SSOT)
// @changelog v1.2.0-QUALITY: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: TIMEOUTS, DEGRADATION_MODES, BOOT_HEALTH,
//   getTimeout(), getAllTimeouts()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.2.1-CONTRACTS';
export const MODULE_ID = 'boot-manifest:constants';

// QW#14: Constantes de Timeout centralizadas (SSOT)
export const TIMEOUTS = Object.freeze({
  PHASE_CRITICAL: 5000,
  PHASE_CORE: 10000,
  PHASE_AUTH: 15000,
  PHASE_SHELL: 20000,
  PHASE_MAIN: 15000,
  PHASE_UI: 10000,
  PHASE_PLATFORM: 10000,
  MODULE_EVENTBUS: 3000,
  MODULE_LOGGER: 5000,
  MODULE_ERROR_BOUNDARY: 3000,
  MODULE_CONFIG: 5000,
  MODULE_SECURITY: 3000,
  MODULE_ENVIRONMENT: 3000,
  MODULE_GLOBAL_STATE: 5000,
  MODULE_ROUTER: 5000,
  MODULE_READY_FLAGS: 3000,
  MODULE_TELEMETRY: 3000,
  MODULE_SESSION: 5000,
  MODULE_AUTH: 5000,
  MODULE_LOGIN: 5000,
  MODULE_APP_SHELL: 8000,
  MODULE_HEADER: 5000,
  MODULE_NAV: 5000,
  MODULE_FOOTER: 5000,
  MODULE_MAIN_ENGINE: 10000,
  MODULE_CONTAINER: 5000,
  MODULE_UI_ORCHESTRATOR: 5000,
  MODULE_TICKER: 5000,
  MODULE_TOAST: 3000,
  MODULE_PRELOADER: 2000,
  MODULE_PLATFORM: 5000,
  // UI Delays (v1.1.0 - Timeout Formalization)
  UI_DELAY_SHORT: 200,
  UI_DELAY_MEDIUM: 250,
  UI_DELAY_LONG: 500,
  UI_DELAY_RETRY: 300,
  UI_DELAY_INIT: 1000,
  CONFIG_WAIT: 8000,
  DEFAULT_PHASE: 30000,
  DEFAULT_MODULE: 10000
});

export const DEGRADATION_MODES = Object.freeze({
  HALT: 'halt',
  DEGRADED: 'degraded',
  SKIP: 'skip',
  ALLOW_SHELL_ONLY: 'allow-shell-only',
  ALLOW_LOGIN_ONLY: 'allow-login-only'
});

export const BOOT_HEALTH = Object.freeze({
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  FAILED: 'FAILED'
});

export function getTimeout(key: string) {
  return TIMEOUTS[key as keyof typeof TIMEOUTS] || TIMEOUTS.DEFAULT_MODULE;
}

export function getAllTimeouts() {
  return { ...TIMEOUTS };
}

export default {
  VERSION,
  MODULE_ID,
  TIMEOUTS,
  DEGRADATION_MODES,
  BOOT_HEALTH,
  getTimeout,
  getAllTimeouts
};
