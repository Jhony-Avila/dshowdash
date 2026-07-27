// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-regions/clear
// PURPOSE: Funções de limpeza de regiões e cache
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   REGION_MAP from ./constants.js
//   regionCache, cacheHits from ./cache.js
//   getRegion from ./core.js
// EXPORTS:
//   clearRegion — Limpa conteúdo de uma região
//   clearAllRegions — Limpa todas as regiões
//   clearCache — Limpa cache de regiões
//   invalidateCache — Invalida cache (específico ou total)
// ═══════════════════════════════════════════════════════════════
/**
 * @module DOMRegionsClear
 * @description Limpeza de regiões e cache
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { REGION_MAP } from './constants.js';
import { regionCache, cacheHits } from './cache.js';
import { getRegion } from './core.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.dom-regions.clear';

/**
 * Limpa conteúdo de uma região
 * @param {string} name - Nome da região
 */
export function clearRegion(name: string) {
    const region = getRegion(name);
    if (region) region.innerHTML = '';
}

/**
 * Limpa todas as regiões
 */
export function clearAllRegions() {
    const keys = Object.keys(REGION_MAP);
    for (let i = 0; i < keys.length; i++) {
        clearRegion(keys[i]);
    }
}

/**
 * Limpa completamente o cache de regiões
 */
export function clearCache() {
    regionCache.clear();
    cacheHits.hits = 0;
    cacheHits.misses = 0;
    cacheHits.expired = 0;
    cacheHits.evictions = 0;
}

/**
 * Invalida cache (específico ou total)
 * @param {string} name - Nome da região (opcional)
 * @returns {boolean} Sucesso
 */
export function invalidateCache(name: string) {
    if (name) {
        return regionCache.delete(name);
    }
    clearCache();
    return true;
}
