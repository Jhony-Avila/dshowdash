// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/core
// PURPOSE: Core do modo de manutenção
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAINTENANCE_TYPES, SEVERITY from ./constants.js
//   state, metrics from ./state.js
//   saveState, clearState from ./storage.js
//   createBanner, removeBanner, updateTimeRemaining from ./banner.js
//   applyBlockingOverlay, removeBlockingOverlay, blockRegion, unblockRegion from ./blocking.js
//   notifySubscribers from ./subscription.js
// EXPORTS:
//   activate — Ativa modo de manutenção
//   deactivate — Desativa modo de manutenção
//   isActive — Verifica se está ativo
//   getState — Retorna estado atual
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeCore
 * @description Core do modo de manutenção
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { MAINTENANCE_TYPES, SEVERITY } from './constants.js';
import { state, metrics } from './state.js';
import { saveState, clearState } from './storage.js';
import { createBanner, removeBanner, updateTimeRemaining } from './banner.js';
import { applyBlockingOverlay, removeBlockingOverlay, blockRegion, unblockRegion } from './blocking.js';
import { notifySubscribers } from './subscription.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.maintenance-mode.core';

export function activate(options: DynObj) {
    options = options || {};
    
    state.active = true;
    state.type = options.type || MAINTENANCE_TYPES.PARTIAL;
    state.severity = options.severity || SEVERITY.INFO;
    state.message = options.message || null;
    state.startTime = Date.now();
    state.endTime = options.endTime || (options.duration ? Date.now() + options.duration : null);
    state.affectedRegions = options.regions || [];
    state.affectedFeatures = options.features || [];
    state.allowedRoles = options.allowedRoles || [];
    state.bypassToken = options.bypassToken || null;
    
    saveState();
    createBanner();
    
    for (let i = 0; i < state.affectedRegions.length; i++) {
        blockRegion(state.affectedRegions[i]);
    }
    
    if (state.type === MAINTENANCE_TYPES.FULL) {
        applyBlockingOverlay();
    }
    
    metrics.activations++;
    
    notifySubscribers({
        type: 'activated',
        maintenanceType: state.type,
        severity: state.severity,
        timestamp: Date.now()
    });
    
    if (state.endTime) {
        const remaining = state.endTime - Date.now();
        if (remaining > 0) {
            state._autoDeactivateTimer = setTimeout(() => {
                state._autoDeactivateTimer = null;
                if (state.active && state.endTime && Date.now() >= state.endTime) {
                    deactivate();
                }
            }, remaining);

            state._countdownInterval = setInterval(updateTimeRemaining, 60000);
        }
    }
    
    return { ok: true, state: getState() };
}

export function deactivate() {
    if (!state.active) return { ok: false, error: 'Not active' };

    if (state._autoDeactivateTimer) { clearTimeout(state._autoDeactivateTimer); state._autoDeactivateTimer = null; }
    if (state._countdownInterval) { clearInterval(state._countdownInterval); state._countdownInterval = null; }

    for (let i = 0; i < state.affectedRegions.length; i++) {
        unblockRegion(state.affectedRegions[i]);
    }

    removeBanner();
    removeBlockingOverlay();
    
    state.active = false;
    state.type = null;
    state.message = null;
    state.startTime = null;
    state.endTime = null;
    state.affectedRegions = [];
    state.affectedFeatures = [];
    
    clearState();
    metrics.deactivations++;
    
    notifySubscribers({
        type: 'deactivated',
        timestamp: Date.now()
    });
    
    return { ok: true };
}

export function isActive() {
    return state.active;
}

export function getState() {
    return {
        active: state.active,
        type: state.type,
        severity: state.severity,
        message: state.message,
        startTime: state.startTime,
        endTime: state.endTime,
        affectedRegions: state.affectedRegions.slice(),
        affectedFeatures: state.affectedFeatures.slice(),
        duration: state.startTime ? Date.now() - state.startTime : 0
    };
}
