// Bootstrap-V2 Loader - Modular Index
// @version 7.0.0-EXPLICIT-START
// @changelog v7.0.0-EXPLICIT-START: P0 RESOLVIDO — Auto-execução eliminada. startBootstrap() é API explícita.
//   Feature flag window.__BOOTSTRAP_AUTO_START__ permite backward compat (default: true para não quebrar).
// @changelog v6.2.2-CONTRACTS: Dependency Contract formalizado
// @description Loader completo modularizado: Sprint 1-9 (26 melhorias)
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v7.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   guardedBoot from /boot/boot-guard.ts
//   BOOT_EVENTS from /core/runtime/events/index.js
//   MODULE_ID, VERSION from ./constants.js
//   log, emitBootEvent from ./helpers/
//   executeFullBootSequence, DegradationNotifier from ./sequence.js
//   getPreBootResult, getBootResult, etc. from ./api.js
//
// PROVIDES:
//   startBootstrap()  — Função explícita para iniciar boot (P0 resolution)
//   isBootStarted()   — Verifica se boot já foi iniciado
//   getBootPromise()  — Retorna promise do boot em andamento
//   + todas as APIs existentes (backward compat)
//
// FEATURE FLAGS:
//   window.__BOOTSTRAP_AUTO_START__ — Se false, NÃO inicia automaticamente (default: true)
//   window.__BOOTSTRAP_MANUAL_MODE__ — Se true, força modo manual (default: false)
//
// WINDOW ACCESS: Apenas para feature flags (read-only)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { guardedBoot } from '/boot/boot-guard.js';
import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';

export { MODULE_ID, VERSION } from './constants.js';
export { getPreBootResult, getBootResult, getBootstrapInstance, getPreBootOrchestrator, getKernel, info, healthCheck } from './api.js';

import { MODULE_ID, VERSION } from './constants.js';
import { log } from './helpers/logger.js';
import { emitBootEvent } from './helpers/events.js';
import { executeFullBootSequence, DegradationNotifier } from './sequence.js';
import { getPreBootResult, getBootResult, getBootstrapInstance, getPreBootOrchestrator, getKernel, info, healthCheck } from './api.js';

// ═══════════════════════════════════════════════════════════════
// BOOT STATE (v7.0.0 — Explicit Start)
// ═══════════════════════════════════════════════════════════════

var _bootStarted = false;
var _bootPromise: Promise<unknown> | null = null;

// ═══════════════════════════════════════════════════════════════
// startBootstrap() — API EXPLÍCITA PARA INICIAR BOOT
// ═══════════════════════════════════════════════════════════════
// P0 RESOLUTION: Esta função substitui a IIFE auto-executável.
// Agora o boot só inicia quando explicitamente chamado OU
// quando a feature flag permite auto-start (backward compat).

export function startBootstrap() {
  // Idempotent: se já iniciou, retorna a promise existente
  if (_bootStarted && _bootPromise) {
    log('info', 'Bootstrap already started, returning existing promise');
    return _bootPromise;
  }

  _bootStarted = true;
  log('info', 'Bootstrap starting via explicit startBootstrap() call', { version: VERSION });

  _bootPromise = guardedBoot(executeFullBootSequence).catch(function(criticalError) {
    log('error', 'BootGuard intercepted critical failure', { error: criticalError.message });
    emitBootEvent(BOOT_EVENTS.BOOTSTRAP_V2_ERROR, { error: criticalError.message });
    
    if (DegradationNotifier) {
      DegradationNotifier.notifyBootFailed('Critical: ' + criticalError.message);
    }
    
    // Re-throw para permitir handling externo
    throw criticalError;
  });

  return _bootPromise;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS (v7.0.0)
// ═══════════════════════════════════════════════════════════════

export function isBootStarted() {
  return _bootStarted;
}

export function getBootPromise() {
  return _bootPromise;
}

// ═══════════════════════════════════════════════════════════════
// AUTO-START COM FEATURE FLAG (Backward Compatibility)
// ═══════════════════════════════════════════════════════════════
// Por padrão, auto-start está HABILITADO para não quebrar sistemas existentes.
// Para desabilitar: window.__BOOTSTRAP_AUTO_START__ = false ANTES do import
// Para forçar modo manual: window.__BOOTSTRAP_MANUAL_MODE__ = true

(function() {
  if (typeof window === 'undefined') {
    // SSR/Node: não auto-inicia
    return;
  }

  // Feature flag: modo manual força não auto-iniciar
  if ((window as any).__BOOTSTRAP_MANUAL_MODE__ === true) {
    log('info', 'Bootstrap in MANUAL MODE — call startBootstrap() to begin');
    return;
  }

  // Feature flag: auto-start (default: true para backward compat)
  var autoStart = (window as any).__BOOTSTRAP_AUTO_START__;
  if (autoStart === false) {
    log('info', 'Bootstrap auto-start DISABLED — call startBootstrap() to begin');
    return;
  }

  // Backward compat: auto-inicia como antes
  log('info', 'Bootstrap auto-starting (backward compat mode)');
  startBootstrap();
})();

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT (backward compat + new APIs)
// ═══════════════════════════════════════════════════════════════

export default { 
  // Existing APIs (backward compat)
  MODULE_ID: MODULE_ID, 
  VERSION: VERSION, 
  getPreBootResult: getPreBootResult,
  getBootResult: getBootResult,
  getBootstrapInstance: getBootstrapInstance,
  getPreBootOrchestrator: getPreBootOrchestrator,
  getKernel: getKernel,
  info: info, 
  healthCheck: healthCheck,
  
  // New APIs (v7.0.0)
  startBootstrap: startBootstrap,
  isBootStarted: isBootStarted,
  getBootPromise: getBootPromise
};
