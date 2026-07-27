// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-regions/cache
// PURPOSE: Cache LRU para elementos de região
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   cacheConfig — Configuração do cache
//   regionCache — Map do cache
//   cleanupInterval — Referência do interval
//   cacheHits — Métricas de cache
//   getCacheEntry — Busca entrada no cache
//   setCacheEntry — Adiciona entrada ao cache
//   cleanupExpiredEntries — Remove entradas expiradas
//   startAutoCleanup — Inicia limpeza automática
//   stopAutoCleanup — Para limpeza automática
// BROWSER APIs: setInterval, clearInterval
// ═══════════════════════════════════════════════════════════════
/**
 * @module DOMRegionsCache
 * @description Cache LRU para regiões DOM
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.dom-regions.cache';

export const cacheConfig = {
    ttlMs: 30000,
    maxSize: 50,
    autoCleanup: true,
    cleanupIntervalMs: 60000
};

export const regionCache = new Map();
export const cleanupInterval = { value: null as DynObj };
export const cacheHits = { hits: 0, misses: 0, expired: 0, evictions: 0 };

/**
 * Busca entrada no cache com validação
 * @param {string} name - Nome da região
 * @returns {Object|null} Entrada ou null se inválida
 */
export function getCacheEntry(name: string) {
    const entry = regionCache.get(name);
    if (!entry) return null;
    
    const now = Date.now();
    
    // TTL expirado
    if (now - entry.cachedAt > cacheConfig.ttlMs) {
        regionCache.delete(name);
        cacheHits.expired++;
        return null;
    }
    
    // Elemento removido do DOM
    if (entry.element && !document.contains(entry.element)) {
        regionCache.delete(name);
        cacheHits.evictions++;
        return null;
    }
    
    entry.lastAccess = now;
    entry.accessCount++;
    return entry;
}

/**
 * Adiciona entrada ao cache com LRU
 * @param {string} name - Nome da região
 * @param {HTMLElement} element - Elemento DOM
 */
export function setCacheEntry(name: string, element: HTMLElement) {
    const now = Date.now();
    
    // LRU: remove mais antigo se atingiu limite
    if (regionCache.size >= cacheConfig.maxSize) {
        let oldest = null;
        let oldestTime = Infinity;
        regionCache.forEach((entry, key) => {
            if (entry.lastAccess < oldestTime) {
                oldestTime = entry.lastAccess;
                oldest = key;
            }
        });
        if (oldest) {
            regionCache.delete(oldest);
            cacheHits.evictions++;
        }
    }
    
    regionCache.set(name, {
        element,
        cachedAt: now,
        lastAccess: now,
        accessCount: 1
    });
}

/**
 * Remove entradas expiradas ou órfãs
 * @returns {number} Quantidade removida
 */
export function cleanupExpiredEntries() {
    const now = Date.now();
    const expired: DynObj[] = [];
    
    regionCache.forEach((entry, key) => {
        if (now - entry.cachedAt > cacheConfig.ttlMs) {
            expired.push(key);
        } else if (entry.element && !document.contains(entry.element)) {
            expired.push(key);
        }
    });
    
    for (let i = 0; i < expired.length; i++) {
        regionCache.delete(expired[i]);
        cacheHits.expired++;
    }
    
    return expired.length;
}

/**
 * Inicia limpeza automática
 */
export function startAutoCleanup() {
    if (cleanupInterval.value) return;
    if (!cacheConfig.autoCleanup) return;
    
    cleanupInterval.value = setInterval(cleanupExpiredEntries, cacheConfig.cleanupIntervalMs);
}

/**
 * Para limpeza automática
 */
export function stopAutoCleanup() {
    if (cleanupInterval.value) {
        clearInterval(cleanupInterval.value);
        cleanupInterval.value = null;
    }
}

// Auto-start em browser
if (typeof document !== 'undefined') {
    startAutoCleanup();
}
