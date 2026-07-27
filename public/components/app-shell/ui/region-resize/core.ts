// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-resize/core
// PURPOSE: Core de resize de regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../../core/dom-regions/index.js
//   LayoutPersistence from ../../state/layout-persistence.js
//   RESIZE_CONFIGS from ./constants.js
//   sizes, initialized, metrics from ./state.js
//   notifyListeners, clamp, applySize from ./helpers.js
// EXPORTS:
//   init — Inicializa sistema
//   getSize, getSizes — Consulta tamanhos
//   setSize — Define tamanho
//   resetSize, resetAllSizes — Reseta tamanhos
//   getConfig, isResizable, getResizableRegions — Consultas de config
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionResizeCore
 * @description Core de resize de regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.region-resize.core';

import { getRegion } from '../../core/dom-regions/index.js';
import LayoutPersistence from '../../state/layout-persistence.js';
import { RESIZE_CONFIGS } from './constants.js';
import { sizes, initialized, metrics } from './state.js';
import { notifyListeners, clamp, applySize } from './helpers.js';


export function init() {
    if (initialized.value) return true;
    
    const keys = Object.keys(RESIZE_CONFIGS);
    for (let i = 0; i < keys.length; i++) {
        const regionName = keys[i];
        const config = (RESIZE_CONFIGS as DynObj)[regionName];
        
        if (config.persist && config.persistKey) {
            const persisted = LayoutPersistence.getPreference(config.persistKey);
            if (persisted !== null && persisted !== undefined) {
                (sizes as DynObj)[regionName] = clamp(persisted, config.min, config.max);
            }
        }
        
        applySize(regionName, (sizes as DynObj)[regionName]);
    }
    
    initialized.value = true;
    notifyListeners('initialized', { sizes: getSizes() });
    return true;
}

export function getSize(regionName: string) {
    return (sizes as DynObj)[regionName] !== undefined ? (sizes as DynObj)[regionName] : null;
}

export function getSizes() {
    const result = {};
    const keys = Object.keys(sizes);
    for (let i = 0; i < keys.length; i++) {
        (result as DynObj)[keys[i]] = (sizes as DynObj)[keys[i]];
    }
    return result;
}

export function setSize(regionName: string, size: DynObj, options: DynObj) {
    const config = (RESIZE_CONFIGS as DynObj)[regionName];
    if (!config) {
        metrics.errors++;
        return false;
    }
    
    options = options || {};
    const persist = options.persist !== false;
    const animate = options.animate === true;
    
    const oldSize = (sizes as DynObj)[regionName];
    const newSize = clamp(size, config.min, config.max);
    
    const region = getRegion(regionName);
    if (!region) {
        metrics.errors++;
        return false;
    }
    
    if (animate) {
        region.style.transition = `${config.property} 0.2s ease`;
    }
    
    applySize(regionName, newSize);
    (sizes as DynObj)[regionName] = newSize;
    
    if (animate) {
        setTimeout(() => {
            region.style.transition = '';
        }, 200);
    }
    
    if (persist && config.persist && config.persistKey) {
        LayoutPersistence.setPreference(config.persistKey, newSize);
    }
    
    metrics.resizes++;
    notifyListeners('resize', { 
        region: regionName, 
        oldSize, 
        newSize,
        property: config.property
    });
    
    return true;
}

export function resetSize(regionName: string, options: DynObj) {
    const config = (RESIZE_CONFIGS as DynObj)[regionName];
    if (!config) return false;
    
    return setSize(regionName, config.default, options);
}

export function resetAllSizes(options: DynObj) {
    const keys = Object.keys(RESIZE_CONFIGS);
    for (let i = 0; i < keys.length; i++) {
        resetSize(keys[i], options);
    }
    
    notifyListeners('reset-all', { sizes: getSizes() });
    return true;
}

export function getConfig(regionName: string) {
    const config = (RESIZE_CONFIGS as DynObj)[regionName];
    return config ? Object.assign({}, config) : null;
}

export function isResizable(regionName: string) {
    return (RESIZE_CONFIGS as DynObj)[regionName] !== undefined;
}

export function getResizableRegions() {
    return Object.keys(RESIZE_CONFIGS);
}
