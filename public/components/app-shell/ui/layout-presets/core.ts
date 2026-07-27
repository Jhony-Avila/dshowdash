// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: layout-presets/core
// PURPOSE: Operações core de presets de layout
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PRESETS, PRESET_CONFIGS, applyRegionConfig, applyCssVars, clearCssVars from ./constants.js
// EXPORTS:
//   getPresetConfig — Obtém config de preset
//   applyPreset — Aplica preset
//   createPreset — Cria preset customizado
//   deletePreset — Remove preset customizado
//   clonePreset — Clona preset existente
// BROWSER APIs: document.body
// ═══════════════════════════════════════════════════════════════
/**
 * @module LayoutPresetsCore
 * @description Core de presets de layout
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { PRESETS, PRESET_CONFIGS, applyRegionConfig, applyCssVars, clearCssVars } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.layout-presets.core';

export function getPresetConfig(name: string, customPresets: DynObj) {
    if ((PRESET_CONFIGS as DynObj)[name]) return (PRESET_CONFIGS as DynObj)[name];
    if (customPresets.has(name)) return customPresets.get(name);
    return null;
}

export function applyPreset(presetName: string, options: DynObj, state: DynObj) {
    options = options || {};
    const config = getPresetConfig(presetName, state.customPresets);
    
    if (!config) return { ok: false, error: `Unknown preset: ${presetName}` };
    
    const oldPreset = state.currentPreset;
    const oldConfig = getPresetConfig(oldPreset, state.customPresets);
    
    if (oldConfig && oldConfig.cssVars) {
        clearCssVars(oldConfig.cssVars);
    }
    
    if (typeof document !== 'undefined' && options.animate !== false) {
        document.body.classList.add('shell-layout-transitioning');
        document.body.style.setProperty('--shell-transition-duration', `${state.transitionDuration}ms`);
    }
    
    const regionNames = Object.keys(config.regions);
    for (let i = 0; i < regionNames.length; i++) {
        applyRegionConfig(regionNames[i], config.regions[regionNames[i]]);
    }
    
    if (config.cssVars) {
        applyCssVars(config.cssVars);
    }
    
    state.previousPreset = oldPreset;
    state.currentPreset = presetName;
    state.metrics.presetChanges++;
    
    if (typeof document !== 'undefined') {
        document.body.setAttribute('data-layout-preset', presetName);
        const duration = state.transitionDuration;
        setTimeout(() => {
            document.body.classList.remove('shell-layout-transitioning');
        }, duration);
    }
    
    state.notify({
        type: 'preset-changed',
        from: oldPreset,
        to: presetName,
        config,
        timestamp: Date.now()
    });
    
    return { ok: true, preset: presetName, previous: oldPreset };
}

export function createPreset(name: string, config: DynObj, state: DynObj) {
    if ((PRESET_CONFIGS as DynObj)[name]) return { ok: false, error: 'Cannot override built-in preset' };
    if (!config.regions) return { ok: false, error: 'Preset must have regions config' };
    
    state.customPresets.set(name, {
        name: config.name || name,
        description: config.description || '',
        regions: config.regions,
        cssVars: config.cssVars || {}
    });
    
    state.metrics.customPresetsCreated++;
    return { ok: true, preset: name };
}

export function deletePreset(name: string, state: DynObj, applyFn: DynObj) {
    if ((PRESET_CONFIGS as DynObj)[name]) return { ok: false, error: 'Cannot delete built-in preset' };
    
    if (state.currentPreset === name) {
        applyFn(PRESETS.DEFAULT);
    }
    
    return { ok: state.customPresets.delete(name) };
}

export function clonePreset(sourceName: string, newName: string, overrides: DynObj, state: DynObj) {
    const source = getPresetConfig(sourceName, state.customPresets);
    if (!source) return { ok: false, error: 'Source preset not found' };
    
    const newConfig = {
        name: overrides?.name || newName,
        description: overrides?.description || source.description,
        regions: Object.assign({}, source.regions, overrides?.regions || {}),
        cssVars: Object.assign({}, source.cssVars, overrides?.cssVars || {})
    };
    
    return createPreset(newName, newConfig, state);
}
