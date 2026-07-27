// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/cache/manager
// PURPOSE: Gerenciamento de cache via Service Worker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   postMessage from ../messaging/manager.js
// EXPORTS:
//   clearCache — Limpa cache específico ou todos
//   precache — Pré-cacheia URLs
//   getCacheNames — Lista nomes dos caches
//   getCacheSize — Retorna uso de storage
// BROWSER APIs: caches, navigator.storage
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerCacheManager
 * @description API de cache para Service Worker
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { postMessage } from '../messaging/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.cache.manager';

/**
 * Limpa cache específico ou todos
 * @param {string} cacheName - Nome do cache (opcional)
 * @returns {Promise}
 */
export function clearCache(cacheName: string) {
    return postMessage({
        type: 'CLEAR_CACHE',
        cacheName: cacheName || null
    });
}

/**
 * Pré-cacheia lista de URLs
 * @param {Array<string>} urls - URLs para cachear
 * @returns {Promise}
 */
export function precache(urls: DynObj) {
    return postMessage({
        type: 'PRECACHE',
        urls
    });
}

/**
 * Lista nomes dos caches existentes
 * @returns {Promise<Array>}
 */
export function getCacheNames() {
    if (typeof caches === 'undefined') {
        return Promise.resolve([]);
    }
    
    return caches.keys();
}

/**
 * Retorna informações de uso de storage
 * @returns {Promise<Object>}
 */
export function getCacheSize() {
    if (!navigator.storage || !navigator.storage.estimate) {
        return Promise.resolve({ usage: 0, quota: 0 });
    }
    
    return navigator.storage.estimate()
        .then(estimate => ({
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        // @ts-expect-error strict migration — TS18048
        usagePercent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
    }));
}
