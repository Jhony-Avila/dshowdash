// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets
// PURPOSE: Entry point dos presets de acessibilidade
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, PRESETS
//   ./presets-config.js — getPresetConfig
//   ./presets/manager.js — enable, disable, toggle, enableMultiple, reset, isEnabled, getActivePresets
//   ./settings/manager.js — setSetting, getSetting, getAllSettings, removeSetting
//   ./system/detection.js — detectSystemPreferences, applySystemPreferences
//   ./api.js — listPresets, configure, getConfig, subscribe, healthCheck, info, getMetrics
// SIDE EFFECTS: Auto-loads stored presets on init
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresets
 * @description Presets de acessibilidade
 * @version 1.0.1-FIX-AAA
 * @since 2025-02-02
 */
'use strict';

type DynObj = any;

export { VERSION, MODULE_ID, PRESETS } from './constants.js';
export { getPresetConfig } from './presets-config.js';

// Presets
export { enable, disable, toggle, enableMultiple, reset, isEnabled, getActivePresets } from './presets/manager.js';

// Settings
export { setSetting, getSetting, getAllSettings, removeSetting } from './settings/manager.js';

// System
export { detectSystemPreferences, applySystemPreferences } from './system/detection.js';

// API
export { listPresets, configure, getConfig, subscribe, healthCheck, info, getMetrics } from './api.js';

// Auto-init
import { activePresets, config } from './state.js';
import { loadFromStorage } from './storage/persistence.js';
import { enable } from './presets/manager.js';
import { applySystemPreferences } from './system/detection.js';

if (typeof window !== 'undefined') {
    loadFromStorage();
    
    const toApply = Array.from(activePresets);
    activePresets.clear();
    for (let i = 0; i < toApply.length; i++) {
        enable(toApply[i] as DynObj);
    }
    
    if (config.autoDetectSystem && activePresets.size === 0) {
        applySystemPreferences();
    }
}

// Default export
import { VERSION, MODULE_ID, PRESETS } from './constants.js';
import { getActivePresets, isEnabled, toggle, enableMultiple, reset, disable } from './presets/manager.js';
import { setSetting, getSetting, getAllSettings, removeSetting } from './settings/manager.js';
import { detectSystemPreferences } from './system/detection.js';
import { listPresets, configure, getConfig, subscribe, healthCheck, info, getMetrics, getPresetConfig } from './api.js';

export default {
    VERSION, MODULE_ID, PRESETS,
    enable, disable, toggle, enableMultiple, reset,
    isEnabled, getActivePresets, listPresets, getPresetConfig,
    setSetting, getSetting, getAllSettings, removeSetting,
    detectSystemPreferences, applySystemPreferences,
    configure, getConfig, subscribe,
    getMetrics, healthCheck, info
};
