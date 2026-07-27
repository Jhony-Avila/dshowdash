// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-cache
// PURPOSE: UARPS Admin - Cache Local
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _getState, _setState, notify from ./core.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   saveToCache() — exported function
//   loadFromCache() — exported function
//   applyCacheToState() — exported function
//   clearCache() — exported function
//   getCacheAge() — exported function
//   isCacheValid() — exported function
//   getCacheTTL() — exported function
//   getSavedFilters() — exported function
//   saveFilter() — exported function
//   removeSavedFilter() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { _getState, _setState, notify } from './core.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-cache';

const CACHE_KEY = 'uarps-admin-cache';
const CACHE_TTL = 5 * 60 * 1000;

export function saveToCache() {
    try {
        const state = _getState();
        const permsArray: Array<[string, unknown]> = [];
        state.userPermissions.forEach((v: unknown, k: string) => permsArray.push([k, v]));
        const cacheData = { timestamp: Date.now(), users: state.users, triggers: state.triggers, regions: state.regions, permissions: permsArray };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        return true;
    } catch (e) { return false; }
}

export function loadFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
        return data;
    } catch (e) { return null; }
}

export function applyCacheToState() {
    const cached = loadFromCache();
    if (!cached) return false;
    const state = _getState();
    state.users = cached.users || [];
    state.triggers = cached.triggers || [];
    state.regions = cached.regions || [];
    state.userPermissions = new Map(cached.permissions || []);
    state.lastSync = cached.timestamp;
    _setState(state);
    return true;
}

export function clearCache() { try { localStorage.removeItem(CACHE_KEY); return true; } catch (e) { return false; } }
export function getCacheAge() { try { const cached = localStorage.getItem(CACHE_KEY); if (!cached) return null; const data = JSON.parse(cached); return Date.now() - data.timestamp; } catch (e) { return null; } }
export function isCacheValid() { const age = getCacheAge(); return age !== null && age < CACHE_TTL; }
export function getCacheTTL() { return CACHE_TTL; }

const FILTERS_CACHE_KEY = 'uarps-saved-filters';
export function getSavedFilters() { try { const saved = localStorage.getItem(FILTERS_CACHE_KEY); return saved ? JSON.parse(saved) : []; } catch (e) { return []; } }
export function saveFilter(name: string, filter: unknown) { try { const filters = getSavedFilters(); filters.push({ id: Date.now(), name, filter, createdAt: Date.now() }); if (filters.length > 10) filters.shift(); localStorage.setItem(FILTERS_CACHE_KEY, JSON.stringify(filters)); notify('savedFilters'); return true; } catch (e) { return false; } }
export function removeSavedFilter(id: number) { try { const filters = getSavedFilters().filter((f: { id: number }) => f.id !== id); localStorage.setItem(FILTERS_CACHE_KEY, JSON.stringify(filters)); notify('savedFilters'); return true; } catch (e) { return false; } }

export function info() { return { moduleId: MODULE_ID, version: VERSION, cacheTTL: CACHE_TTL }; }
export function healthCheck() { const valid = isCacheValid(); return { status: valid ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { cacheValid: valid, cacheAge: getCacheAge() } }; }
