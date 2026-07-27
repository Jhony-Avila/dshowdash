// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode
// PURPOSE: Entry point do Modo de Manutenção Granular
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, MAINTENANCE_TYPES, SEVERITY
//   ./core.js — activate, deactivate, isActive, getState
//   ./checks.js — isRegionAffected, isFeatureAffected, canBypass
//   ./schedule.js — schedule, cancelScheduled, getScheduled
//   ./config.js — configure, getConfig
//   ./subscription.js — subscribe
//   ./health.js — getMetrics, healthCheck, info
// SIDE EFFECTS: Auto-loads state and applies on init
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceMode
 * @description Modo de Manutenção Granular
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, MAINTENANCE_TYPES, SEVERITY } from './constants.js';

// Core
export { activate, deactivate, isActive, getState } from './core.js';

// Checks
export { isRegionAffected, isFeatureAffected, canBypass } from './checks.js';

// Schedule
export { schedule, cancelScheduled, getScheduled } from './schedule.js';

// Config
export { configure, getConfig } from './config.js';

// Subscription
export { subscribe } from './subscription.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Auto-initialization
import { state } from './state.js';
import { loadState } from './storage.js';
import { createBanner } from './banner.js';
import { applyBlockingOverlay, blockRegion } from './blocking.js';
import { MAINTENANCE_TYPES } from './constants.js';

if (typeof window !== 'undefined') {
    loadState();
    if (state.active) {
        createBanner();
        for (let i = 0; i < state.affectedRegions.length; i++) {
            blockRegion(state.affectedRegions[i]);
        }
        if (state.type === MAINTENANCE_TYPES.FULL) {
            applyBlockingOverlay();
        }
    }
}

// Default export
import { VERSION, MODULE_ID, SEVERITY } from './constants.js';
import { activate, deactivate, isActive, getState } from './core.js';
import { isRegionAffected, isFeatureAffected, canBypass } from './checks.js';
import { schedule, cancelScheduled, getScheduled } from './schedule.js';
import { configure, getConfig } from './config.js';
import { subscribe } from './subscription.js';
import { getMetrics, healthCheck, info } from './health.js';

export default {
    VERSION, MODULE_ID, MAINTENANCE_TYPES, SEVERITY,
    activate, deactivate, isActive, getState,
    isRegionAffected, isFeatureAffected, canBypass,
    schedule, cancelScheduled, getScheduled,
    configure, getConfig, subscribe,
    getMetrics, healthCheck, info
};
