// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Runtime Integration - Queries
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as DegradationPolicy from ../../degradation-policy.js
//   * as PermissionGate from ../../overlay-permission-gate.js
//
// PROVIDES:
//   getMode() — exported function
//   getRuntimeContext() — exported function
//   isIntegrated() — exported function
//   canOpenOverlay() — exported function
//   getMetrics() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  isInitialized,
  getCurrentMode,
  getRuntimeContext as _getRuntimeContext,
  getApplicationKernel,
  getMetrics as _getMetrics
} from '../state.js';
import * as DegradationPolicy from '../../degradation-policy.js';
import * as PermissionGate from '../../overlay-permission-gate.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-ELEVATION';
export const MODULE_ID = 'overlay-layer.kernel.runtime-integration.core.queries';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Retorna o modo atual do runtime
 * @returns {string}
 */
export function getMode() {
  return getCurrentMode();
}

/**
 * Retorna o contexto do runtime
 * @returns {Object|null}
 */
export function getRuntimeContext() {
  return _getRuntimeContext();
}

/**
 * Verifica se está integrado com o Application Kernel
 * @returns {boolean}
 */
export function isIntegrated() {
  return isInitialized() && !!getApplicationKernel();
}

/**
 * Verifica se pode abrir um overlay
 * @param {string} typeId
 * @param {Object} options
 * @returns {Object}
 */
export function canOpenOverlay(typeId: string, options: DynObj) {
  const currentMode = getCurrentMode();
  
  // 1. Verificar política de degradação
  const policyResult = DegradationPolicy.evaluatePolicy(currentMode, typeId);
  
  if (policyResult.action === DegradationPolicy.POLICY_ACTIONS.BLOCK) {
    return {
      allowed: false,
      reason: 'blocked-by-degradation-policy',
      mode: currentMode,
      policy: policyResult
    };
  }
  
  // 2. Verificar permissão UARPS
  const permissionResult = PermissionGate.check(Object.assign({ typeId }, options || {}));
  
  if (!permissionResult.allowed) {
    return {
      allowed: false,
      reason: permissionResult.reason,
      mode: currentMode,
      permission: permissionResult
    };
  }
  
  return {
    allowed: true,
    mode: currentMode,
    policy: policyResult,
    permission: permissionResult
  };
}

/**
 * Retorna métricas
 * @returns {Object}
 */
export function getMetrics() {
  return _getMetrics();
}

export default {
  getMode,
  getRuntimeContext,
  isIntegrated,
  canOpenOverlay,
  getMetrics
};
