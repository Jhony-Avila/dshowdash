// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-regions/core
// PURPOSE: Core API de acesso a regiões DOM
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   REGION_MAP, ENTERPRISE_STRICT from ./constants.js
//   getCacheEntry, setCacheEntry, cacheHits from ./cache.js
//   usageMetrics, trackUsage, trackEvent from ./metrics.js
// EXPORTS:
//   getRegion — Retorna elemento da região
//   getRegionWithMode — Retorna região com metadados
//   listRegions — Lista mapa de regiões
//   hasRegion — Verifica existência
//   getAllRegions — Retorna todas as regiões
// BROWSER APIs: document.getElementById
// ═══════════════════════════════════════════════════════════════
/**
 * @module DOMRegionsCore
 * @description Core de acesso a regiões DOM
 * @version 4.3.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { REGION_MAP, ENTERPRISE_STRICT } from './constants.js';
import { getCacheEntry, setCacheEntry, cacheHits } from './cache.js';
import { usageMetrics, trackUsage, trackEvent } from './metrics.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.dom-regions.core';

/**
 * Retorna elemento da região
 * @param {string} name - Nome da região
 * @returns {HTMLElement|null}
 */
export function getRegion(name: string) {
    const config = (REGION_MAP as DynObj)[name];
    if (!config) {
        usageMetrics.misses++;
        return document.getElementById(name) || null;
    }
    
    const cached = getCacheEntry(name);
    if (cached) {
        cacheHits.hits++;
        trackUsage(name, false, true);
        return cached.element;
    }
    
    cacheHits.misses++;
    
    const enterpriseEl = document.getElementById(config.id);
    if (enterpriseEl) {
        setCacheEntry(name, enterpriseEl);
        trackUsage(name, false, true);
        return enterpriseEl;
    }
    
    if (ENTERPRISE_STRICT) {
        trackUsage(name, false, false);
        trackEvent('strict-miss', { region: name, enterpriseId: config.id });
        return null;
    }
    
    const legacyEl = document.getElementById(config.legacyId);
    if (legacyEl) {
        setCacheEntry(name, legacyEl);
        trackUsage(name, true, true);
        trackEvent('legacy-fallback', { region: name, legacyId: config.legacyId });
        return legacyEl;
    }
    
    trackUsage(name, false, false);
    return null;
}

/**
 * Retorna região com metadados de modo
 * @param {string} name - Nome da região
 * @returns {Object}
 */
export function getRegionWithMode(name: string) {
    const config = (REGION_MAP as DynObj)[name];
    if (!config) {
        const el = document.getElementById(name);
        return { element: el, id: name, legacyId: null, usingLegacy: false, exists: !!el, mode: el ? 'direct' : 'missing' };
    }
    const newEl = document.getElementById(config.id);
    if (newEl) {
        trackUsage(name, false, true);
        return { element: newEl, id: config.id, legacyId: config.legacyId, usingLegacy: false, exists: true, mode: 'enterprise' };
    }
    if (ENTERPRISE_STRICT) {
        return { element: null, id: config.id, legacyId: config.legacyId, usingLegacy: false, exists: false, mode: 'strict-miss' };
    }
    const legacyEl = document.getElementById(config.legacyId);
    if (legacyEl) {
        trackUsage(name, true, true);
        return { element: legacyEl, id: config.id, legacyId: config.legacyId, usingLegacy: true, exists: true, mode: 'legacy-compat' };
    }
    return { element: null, id: config.id, legacyId: config.legacyId, usingLegacy: false, exists: false, mode: 'missing' };
}

/**
 * Lista mapa de regiões
 * @returns {Object}
 */
export function listRegions() {
    const result = {};
    const keys = Object.keys(REGION_MAP);
    for (let i = 0; i < keys.length; i++) {
        (result as DynObj)[keys[i]] = (REGION_MAP as DynObj)[keys[i]].id;
    }
    return result;
}

export function hasRegion(name: string) {
    return getRegion(name) !== null;
}

export function getAllRegions() {
    const regions = {};
    const keys = Object.keys(REGION_MAP);
    for (let i = 0; i < keys.length; i++) {
        (regions as DynObj)[keys[i]] = getRegion(keys[i]);
    }
    return regions;
}
