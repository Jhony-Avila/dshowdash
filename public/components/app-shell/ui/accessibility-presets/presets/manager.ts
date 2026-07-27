// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/presets/manager
// PURPOSE: Gerenciamento de presets de acessibilidade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   activePresets, subscribers, incrementMetric, resetCustomSettings from ../state.js
//   presetConfigs from ../presets-config.js
//   saveToStorage from ../storage/persistence.js
//   applyCssVars, removeCssVars, applyBodyClasses from ../css/manager.js
// EXPORTS:
//   getActivePresets — Lista presets ativos
//   enable — Ativa preset
//   disable — Desativa preset
//   toggle — Alterna preset
//   enableMultiple — Ativa múltiplos presets
//   reset — Reseta todos os presets
//   isEnabled — Verifica se preset está ativo
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsManager
 * @description Gerenciamento de presets
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { activePresets, subscribers, incrementMetric, resetCustomSettings } from '../state.js';
import { presetConfigs } from '../presets-config.js';
import { saveToStorage } from '../storage/persistence.js';
import { applyCssVars, removeCssVars, applyBodyClasses } from '../css/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.presets.manager';

function notifySubscribers(event: DynObj) {
    for (let i = 0; i < subscribers.length; i++) {
        try { subscribers[i](event); } catch (e) {}
    }
}

export function getActivePresets() {
    return Array.from(activePresets);
}

export function enable(presetName: string) {
    const config = (presetConfigs as DynObj)[presetName];
    if (!config) {
        return { ok: false, error: `Unknown preset: ${presetName}` };
    }
    
    if (activePresets.has(presetName)) {
        return { ok: true, alreadyActive: true };
    }
    
    if (config.cssVars) {
        applyCssVars(config.cssVars);
    }
    
    if (config.bodyClasses) {
        applyBodyClasses(config.bodyClasses, true);
    }
    
    activePresets.add(presetName);
    incrementMetric('presetChanges');
    
    saveToStorage();
    
    notifySubscribers({
        type: 'preset-enabled',
        preset: presetName,
        activePresets: getActivePresets(),
        timestamp: Date.now()
    });
    
    return { ok: true, preset: presetName };
}

export function disable(presetName: string) {
    const config = (presetConfigs as DynObj)[presetName];
    if (!config) {
        return { ok: false, error: `Unknown preset: ${presetName}` };
    }
    
    if (!activePresets.has(presetName)) {
        return { ok: true, notActive: true };
    }
    
    if (config.cssVars) {
        removeCssVars(config.cssVars);
    }
    
    if (config.bodyClasses) {
        applyBodyClasses(config.bodyClasses, false);
    }
    
    activePresets.delete(presetName);
    incrementMetric('presetChanges');
    
    saveToStorage();
    
    notifySubscribers({
        type: 'preset-disabled',
        preset: presetName,
        activePresets: getActivePresets(),
        timestamp: Date.now()
    });
    
    return { ok: true, preset: presetName };
}

export function toggle(presetName: string) {
    if (activePresets.has(presetName)) {
        return disable(presetName);
    }
    return enable(presetName);
}

export function enableMultiple(presetNames: DynObj) {
    const results = [];
    for (let i = 0; i < presetNames.length; i++) {
        results.push(enable(presetNames[i]));
    }
    return results;
}

export function reset() {
    const active = Array.from(activePresets);
    for (let i = 0; i < active.length; i++) {
        disable(active[i] as DynObj);
    }
    
    resetCustomSettings();
    saveToStorage();
    
    notifySubscribers({
        type: 'reset',
        timestamp: Date.now()
    });
    
    return { ok: true };
}

export function isEnabled(presetName: string) {
    return activePresets.has(presetName);
}
