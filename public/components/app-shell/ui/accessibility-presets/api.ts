// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/api
// PURPOSE: API pública dos presets de acessibilidade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, PRESETS from ./constants.js
//   activePresets, config, subscribers, getMetrics from ./state.js
//   presetConfigs, getPresetConfig from ./presets-config.js
//   getActivePresets, isEnabled from ./presets/manager.js
//   getAllSettings from ./settings/manager.js
//   detectSystemPreferences from ./system/detection.js
// EXPORTS:
//   listPresets, configure, getConfig, subscribe,
//   healthCheck, info, getPresetConfig, getMetrics
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsAPI
 * @description API pública de acessibilidade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, PRESETS } from './constants.js';
import { activePresets, config, subscribers, getMetrics } from './state.js';
import { presetConfigs, getPresetConfig } from './presets-config.js';
import { getActivePresets, isEnabled } from './presets/manager.js';
import { getAllSettings } from './settings/manager.js';
import { detectSystemPreferences } from './system/detection.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function listPresets() {
    return Object.keys(presetConfigs).map(name => {
        const cfg = (presetConfigs as DynObj)[name];
        return {
            name,
            displayName: cfg.name,
            description: cfg.description,
            isActive: activePresets.has(name)
        };
    });
}

export function configure(options: DynObj) {
    if (options.persistPresets !== undefined) config.persistPresets = !!options.persistPresets;
    if (options.autoDetectSystem !== undefined) config.autoDetectSystem = !!options.autoDetectSystem;
    if (options.storageKey !== undefined) config.storageKey = options.storageKey;
}

export function getConfig() {
    return Object.assign({}, config);
}

export function subscribe(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    subscribers.push(callback);
    
    return () => {
        const idx = subscribers.indexOf(callback);
        if (idx >= 0) subscribers.splice(idx, 1);
    };
}

export function healthCheck() {
    const checks = {
        noExcessivePresets: activePresets.size <= 5,
        noConflicts: !(activePresets.has(PRESETS.HIGH_CONTRAST) && activePresets.has(PRESETS.LOW_VISION) && activePresets.size > 3),
        configValid: typeof config.persistPresets === 'boolean'
    };
    
    let passed = 0;
    const keys = Object.keys(checks);
    for (let i = 0; i < keys.length; i++) {
        if ((checks as DynObj)[keys[i]]) passed++;
    }
    
    return {
        status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
        score: `${passed}/${keys.length}`,
        checks,
        activePresets: getActivePresets(),
        systemPrefs: detectSystemPreferences(),
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        config: getConfig(),
        activePresets: getActivePresets(),
        customSettings: getAllSettings(),
        availablePresets: listPresets(),
        systemPrefs: detectSystemPreferences(),
        metrics: getMetrics(),
        subscriberCount: subscribers.length,
        timestamp: Date.now()
    };
}

export { getPresetConfig };
export { getMetrics };

