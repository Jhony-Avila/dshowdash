// Boot Manifest - Queries
// @version 1.3.1-CONTRACTS
// @description Utilitários de consulta do manifest
// @changelog v1.3.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.3.0-DYNAMIC-TIMEOUT: Sprint 7A #2 - Integração com NetworkDetector para timeouts dinâmicos
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   BOOT_MANIFEST from ./manifest-data.js
//   NetworkDetector from ../domain/network-detector.js
//
// PROVIDES:
//   getPhaseById, getPhaseOrder, getCriticalPhases, getPhaseConfig,
//   getAllAdjustedTimeouts, isDynamicTimeoutEnabled — query functions
//
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { BOOT_MANIFEST } from './manifest-data.js';
import * as NetworkDetector from '../domain/network-detector.js';

export const VERSION = '1.3.1-CONTRACTS';
export const MODULE_ID = 'boot-manifest:queries';

// Cache para evitar múltiplas chamadas ao NetworkDetector
var _dynamicTimeoutEnabled = true;

export function setDynamicTimeoutEnabled(enabled: boolean) {
  _dynamicTimeoutEnabled = enabled;
}

export function isDynamicTimeoutEnabled() {
  return _dynamicTimeoutEnabled;
}

export function getPhaseById(phaseId: string) {
  for (let i = 0; i < BOOT_MANIFEST.phases.length; i++) {
    if (BOOT_MANIFEST.phases[i].id === phaseId) {
      return BOOT_MANIFEST.phases[i];
    }
  }
  return null;
}

export function getPhaseOrder() {
  return BOOT_MANIFEST.phases
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(p => p.id);
}

export function getCriticalPhases() {
  return BOOT_MANIFEST.phases.filter(p => p.critical);
}

export function getNonCriticalPhases() {
  return BOOT_MANIFEST.phases.filter(p => !p.critical);
}

export function getPhaseDependencies(phaseId: string) {
  const phase = getPhaseById(phaseId);
  return phase ? phase.dependsOn.slice() : [];
}

/**
 * Calcula timeout ajustado baseado nas condições de rede
 * @param {number} baseTimeout - Timeout base em ms
 * @param {boolean} isCritical - Se a fase é crítica (usa limites mais conservadores)
 * @returns {object} { adjusted, original, multiplier, networkQuality }
 */
function calculateDynamicTimeout(baseTimeout: number, isCritical: boolean) {
  if (!_dynamicTimeoutEnabled) {
    return {
      adjusted: baseTimeout,
      original: baseTimeout,
      multiplier: 1.0,
      networkQuality: 'unknown',
      dynamic: false
    };
  }
  
  try {
    var options = {
      minMultiplier: isCritical ? 0.8 : 0.5,  // Fases críticas não reduzem muito
      maxMultiplier: isCritical ? 2.0 : 3.0,  // Fases críticas não estendem muito
      minTimeout: isCritical ? 3000 : 1000,
      maxTimeout: isCritical ? 60000 : 120000
    };
    
    var result = NetworkDetector.calculateAdjustedTimeout(baseTimeout, options);
    
    return {
      adjusted: result.adjusted,
      original: result.original,
      multiplier: result.multiplier,
      networkQuality: result.networkQuality,
      dynamic: true
    };
  } catch (e: any) {
    // Fallback se NetworkDetector falhar
    return {
      adjusted: baseTimeout,
      original: baseTimeout,
      multiplier: 1.0,
      networkQuality: 'error',
      dynamic: false,
      error: e.message
    };
  }
}

export function getPhaseConfig(phaseId: string, options?: Record<string, unknown>) {
  if (options === undefined) options = {};
  
  const phase = getPhaseById(phaseId);
  if (!phase) return null;

  const global = BOOT_MANIFEST.global;
  const baseTimeout = phase.timeout || global.defaultTimeout;
  
  // Sprint 7A #2: Calcular timeout dinâmico
  var timeoutInfo = calculateDynamicTimeout(baseTimeout, phase.critical);
  var effectiveTimeout = options.ignoreDynamicTimeout ? baseTimeout : timeoutInfo.adjusted;
  
  return {
    id: phase.id,
    name: phase.name,
    order: phase.order,
    critical: phase.critical,
    recoverable: phase.recoverable,
    parallel: phase.parallel,
    timeout: effectiveTimeout,
    baseTimeout: baseTimeout,
    timeoutInfo: timeoutInfo,  // Sprint 7A #2: Info completo do timeout
    retry: { ...global.defaultRetry, ...(phase.retry || {}) },
    onFail: phase.onFail,
    suppressWhenUnauth: phase.suppressWhenUnauth || false,
    requiresAuth: phase.requiresAuth || false,
    deferWhenUnauth: phase.deferWhenUnauth || false,
    modules: phase.modules || [],
    healthWeight: phase.healthWeight || 0,
    circuitBreaker: (phase as any).circuitBreaker
  };
}

/**
 * Sprint 7A #2: Obtém todos os timeouts ajustados para rede atual
 */
export function getAllAdjustedTimeouts() {
  var result: Record<string, unknown> = {};
  var phases = BOOT_MANIFEST.phases;
  
  for (var i = 0; i < phases.length; i++) {
    var phase = phases[i];
    var baseTimeout = phase.timeout || BOOT_MANIFEST.global.defaultTimeout;
    var timeoutInfo = calculateDynamicTimeout(baseTimeout, phase.critical);
    
    result[phase.id] = {
      base: baseTimeout,
      adjusted: timeoutInfo.adjusted,
      multiplier: timeoutInfo.multiplier,
      critical: phase.critical
    };
  }
  
  (result as any)._networkQuality = NetworkDetector.getNetworkInfo().quality;
  (result as any)._timestamp = Date.now();
  
  return result;
}

export function getTotalHealthWeight() {
  let total = 0;
  for (let i = 0; i < BOOT_MANIFEST.phases.length; i++) {
    total += BOOT_MANIFEST.phases[i].healthWeight || 0;
  }
  return total;
}

export function getPhaseCount() {
  return BOOT_MANIFEST.phases.length;
}

export function getGlobalConfig() {
  return { ...BOOT_MANIFEST.global };
}

export default {
  VERSION,
  MODULE_ID,
  getPhaseById,
  getPhaseOrder,
  getCriticalPhases,
  getNonCriticalPhases,
  getPhaseDependencies,
  getPhaseConfig,
  getTotalHealthWeight,
  getPhaseCount,
  getGlobalConfig,
  // Sprint 7A #2
  setDynamicTimeoutEnabled,
  isDynamicTimeoutEnabled,
  getAllAdjustedTimeouts
};
