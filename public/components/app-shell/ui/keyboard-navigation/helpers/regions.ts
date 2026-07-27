// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/helpers/regions
// PURPOSE: Helpers para navegação entre regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../../../core/dom-regions/index.js
//   NAVIGATION_ORDER from ../constants.js
// EXPORTS:
//   findCurrentRegionIndex — Encontra índice da região atual
//   getVisibleRegions — Retorna regiões visíveis
//   getCurrentRegion — Retorna nome da região atual
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationRegionHelpers
 * @description Helpers para regiões na navegação
 * @version 1.0.1-IMPORT-FIX-AAA
 * @since 2025-02-02
 * @changelog v1.0.1-IMPORT-FIX - Fixed import path
 */
'use strict';

import { getRegion } from '../../../core/dom-regions/index.js';
import { NAVIGATION_ORDER } from '../constants.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.helpers.regions';

/**
 * Encontra índice da região que contém o elemento ativo
 * @returns {number} Índice ou -1
 */
export function findCurrentRegionIndex() {
    const activeElement = document.activeElement;
    if (!activeElement) return -1;
    
    for (let i = 0; i < NAVIGATION_ORDER.length; i++) {
        const region = getRegion(NAVIGATION_ORDER[i]);
        if (region && region.contains(activeElement)) {
            return i;
        }
    }
    
    return -1;
}

/**
 * Retorna lista de regiões visíveis
 * @returns {Array<string>}
 */
export function getVisibleRegions() {
    const visible = [];
    
    for (let i = 0; i < NAVIGATION_ORDER.length; i++) {
        const regionName = NAVIGATION_ORDER[i];
        const region = getRegion(regionName);
        
        if (region && !region.classList.contains('dsd-region--hidden')) {
            const isVisible = region.offsetParent !== null ||
                getComputedStyle(region).position === 'fixed';
            if (isVisible) {
                visible.push(regionName);
            }
        }
    }
    
    return visible;
}

/**
 * Retorna nome da região que contém o elemento ativo
 * @returns {string|null}
 */
export function getCurrentRegion() {
    const activeElement = document.activeElement;
    if (!activeElement) return null;
    
    for (let i = 0; i < NAVIGATION_ORDER.length; i++) {
        const regionName = NAVIGATION_ORDER[i];
        const region = getRegion(regionName);
        if (region && region.contains(activeElement)) {
            return regionName;
        }
    }
    
    return null;
}
