// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/checks
// PURPOSE: Verificações de afetação por manutenção
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAINTENANCE_TYPES from ./constants.js
//   state, metrics from ./state.js
// EXPORTS:
//   isRegionAffected — Verifica se região está afetada
//   isFeatureAffected — Verifica se feature está afetada
//   canBypass — Verifica se pode fazer bypass
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeChecks
 * @description Verificações de modo de manutenção
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { MAINTENANCE_TYPES } from './constants.js';
import { state, metrics } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.maintenance-mode.checks';

/**
 * Verifica se região está afetada pela manutenção
 * @param {string} regionName - Nome da região
 * @returns {boolean}
 */
export function isRegionAffected(regionName: string) {
    if (!state.active) return false;
    if (state.type === MAINTENANCE_TYPES.FULL) return true;
    return state.affectedRegions.indexOf(regionName) >= 0;
}

/**
 * Verifica se feature está afetada pela manutenção
 * @param {string} featureName - Nome da feature
 * @returns {boolean}
 */
export function isFeatureAffected(featureName: string) {
    if (!state.active) return false;
    if (state.type === MAINTENANCE_TYPES.FULL) return true;
    return state.affectedFeatures.indexOf(featureName) >= 0;
}

/**
 * Verifica se pode fazer bypass da manutenção
 * @param {string} role - Role do usuário
 * @param {string} token - Token de bypass
 * @returns {boolean}
 */
export function canBypass(role: string, token: DynObj) {
    if (!state.active) return true;
    
    if (token && state.bypassToken && token === state.bypassToken) {
        metrics.bypasses++;
        return true;
    }
    
    if (role && state.allowedRoles.indexOf(role) >= 0) {
        metrics.bypasses++;
        return true;
    }
    
    return false;
}
