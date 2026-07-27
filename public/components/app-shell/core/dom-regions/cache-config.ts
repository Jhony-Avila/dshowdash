// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-regions/cache-config
// PURPOSE: Configuração do cache de regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   cacheConfig, regionCache, cacheHits, startAutoCleanup,
//   stopAutoCleanup, cleanupInterval from ./cache.js
// EXPORTS:
//   setCacheTTL — Define TTL do cache
//   getCacheTTL — Retorna TTL atual
//   setCacheConfig — Define configurações múltiplas
//   getCacheConfig — Retorna configurações
//   getCacheStats — Retorna estatísticas
// ═══════════════════════════════════════════════════════════════
/**
 * @module DOMRegionsCacheConfig
 * @description Configuração do cache LRU de regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import {

    cacheConfig,
    regionCache,
    cacheHits,
    startAutoCleanup,
    stopAutoCleanup,
    cleanupInterval
} from './cache.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '4.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.dom-regions.cache-config';

export function setCacheTTL(ttlMs: number) {
    cacheConfig.ttlMs = Math.max(1000, Math.min(300000, ttlMs));
}

export function getCacheTTL() {
    return cacheConfig.ttlMs;
}

/**
 * Define múltiplas configurações de cache
 * @param {Object} options - Opções { ttlMs, maxSize, autoCleanup, cleanupIntervalMs }
 */
export function setCacheConfig(options: DynObj) {
    if (options.ttlMs !== undefined) {
        cacheConfig.ttlMs = Math.max(1000, Math.min(300000, options.ttlMs));
    }
    if (options.maxSize !== undefined) {
        cacheConfig.maxSize = Math.max(10, Math.min(200, options.maxSize));
    }
    if (options.autoCleanup !== undefined) {
        cacheConfig.autoCleanup = !!options.autoCleanup;
        if (cacheConfig.autoCleanup) {
            startAutoCleanup();
        } else {
            stopAutoCleanup();
        }
    }
    if (options.cleanupIntervalMs !== undefined) {
        cacheConfig.cleanupIntervalMs = Math.max(10000, options.cleanupIntervalMs);
        if (cleanupInterval.value) {
            stopAutoCleanup();
            startAutoCleanup();
        }
    }
}

export function getCacheConfig() {
    return {
        ttlMs: cacheConfig.ttlMs,
        maxSize: cacheConfig.maxSize,
        autoCleanup: cacheConfig.autoCleanup,
        cleanupIntervalMs: cacheConfig.cleanupIntervalMs
    };
}

export function getCacheStats() {
    return {
        size: regionCache.size,
        maxSize: cacheConfig.maxSize,
        ttlMs: cacheConfig.ttlMs,
        hits: cacheHits.hits,
        misses: cacheHits.misses,
        expired: cacheHits.expired,
        evictions: cacheHits.evictions,
        hitRate: (cacheHits.hits + cacheHits.misses) > 0
            ? `${Math.round((cacheHits.hits / (cacheHits.hits + cacheHits.misses)) * 100)}%`
            : 'N/A'
    };
}
