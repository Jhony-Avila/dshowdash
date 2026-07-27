// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-integration/regions/region-themes
// PURPOSE: Gerenciamento de temas por região
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegionThemes, setRegionTheme, deleteRegionTheme, hasRegionTheme,
//   getResolvedTheme, getListeners, incrementMetric from ../state.js
//   applyThemeToElement from ../core/theme-engine.js
//   getRegion from ../../../core/dom-regions/index.js
// EXPORTS:
//   setRegionTheme — Define tema de região
//   clearRegionTheme — Limpa tema de região
//   getRegionTheme — Retorna tema de região
//   getRegionThemes — Retorna todos os temas
// ═══════════════════════════════════════════════════════════════
/**
 * @module ThemeIntegrationRegionThemes
 * @description Temas por região
 * @version 1.2.1-IMPORT-FIX-AAA
 * @since 2025-02-02
 */
'use strict';

import {
    getRegionThemes as _getRegionThemes,
    setRegionTheme as _setRegionTheme,
    deleteRegionTheme,
    hasRegionTheme,
    getResolvedTheme,
    getListeners,
    incrementMetric
} from '../state.js';
import { applyThemeToElement } from '../core/theme-engine.js';
import { getRegion } from '../../../core/dom-regions/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.3.0-FIX-MISSING-EXPORTS';
export const MODULE_ID = 'app-shell.adapters.theme-integration.regions.region-themes';

function _notifyListeners(event: string, data: DynObj) {
    const listeners = getListeners();
    for (let i = 0; i < listeners.length; i++) {
        try {
            listeners[i]({ type: event, data, timestamp: Date.now() });
        } catch (e) {
            incrementMetric('errors');
        }
    }
}

/**
 * Define tema de uma região
 * @param {string} regionName - Nome da região
 * @param {string} theme - 'light' ou 'dark'
 * @returns {boolean} Sucesso
 */
export function setRegionTheme(regionName: string, theme: DynObj) {
    if (theme !== 'light' && theme !== 'dark') {
        incrementMetric('errors');
        return false;
    }
    
    const region = getRegion(regionName);
    if (!region) return false;
    
    _setRegionTheme(regionName, theme);
    applyThemeToElement(region, theme);
    
    _notifyListeners('region-theme-change', { region: regionName, theme });
    return true;
}

/**
 * Limpa tema de uma região
 * @param {string} regionName - Nome da região
 * @returns {boolean} Sucesso
 */
export function clearRegionTheme(regionName: string) {
    if (!hasRegionTheme(regionName)) return false;
    
    deleteRegionTheme(regionName);
    
    const region = getRegion(regionName);
    if (region) {
        applyThemeToElement(region, getResolvedTheme());
    }
    
    _notifyListeners('region-theme-cleared', { region: regionName });
    return true;
}

/**
 * Retorna tema de uma região
 * @param {string} regionName - Nome da região
 * @returns {string} Tema
 */
export function getRegionTheme(regionName: string) {
    const regionThemes = _getRegionThemes();
    return regionThemes[regionName] || getResolvedTheme();
}

/**
 * Retorna todos os temas de regiões
 * @returns {Object}
 */
export function getRegionThemes() {
    const themes = _getRegionThemes();
    const result = {};
    const keys = Object.keys(themes);
    for (let i = 0; i < keys.length; i++) {
        (result as DynObj)[keys[i]] = themes[keys[i]];
    }
    return result;
}

export default {
    setRegionTheme, clearRegionTheme, getRegionTheme, getRegionThemes
};
