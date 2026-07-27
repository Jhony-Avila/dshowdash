// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: cache-manager
// PURPOSE: navigation-model-loader/cache/cache-manager.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TOKENS from ../core/constants.js
//   track from ../telemetry/tracker.js
//
// PROVIDES:
//   getFromSession() — exported function
//   saveToSession() — exported function
//   getFromLocal() — exported function
//   saveToLocal() — exported function
//   invalidateAll() — exported function
//   getCached() — exported function
//   saveToCache() — exported function
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

import { TOKENS } from '../core/constants.js';
import { track } from '../telemetry/tracker.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.integration.navigation-model-loader.cache.cache-manager';

const isStorageAvailable = (type: string) => {
    try {
        const storage = (window as any)[type];
        const testKey = '__storage_test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        return true;
    } catch (e: any) {
        return false;
    }
};

const hasLocalStorage = isStorageAvailable('localStorage');
const hasSessionStorage = isStorageAvailable('sessionStorage');

export const getFromSession = () => {
    if (!hasSessionStorage) return null;
    try {
        const raw = sessionStorage.getItem(TOKENS.SESSION_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        if (!cached?.data || !cached?.timestamp) return null;
        const age = Date.now() - cached.timestamp;
        if (age > TOKENS.SESSION_TTL) {
            sessionStorage.removeItem(TOKENS.SESSION_KEY);
            return null;
        }
        return cached.data;
    } catch (e: any) {
        track('cache:session:error', { error: e.message });
        return null;
    }
};

export const saveToSession = (data: DynObj) => {
    if (!hasSessionStorage || !data) return false;
    try {
        const payload = {
            data,
            timestamp: Date.now(),
            version: TOKENS.SESSION_KEY
        };
        sessionStorage.setItem(TOKENS.SESSION_KEY, JSON.stringify(payload));
        return true;
    } catch (e: any) {
        track('cache:session:save-error', { error: e.message });
        return false;
    }
};

export const getFromLocal = () => {
    if (!hasLocalStorage) return null;
    try {
        const raw = localStorage.getItem(TOKENS.CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        if (!cached?.data || !cached?.timestamp) return null;
        const age = Date.now() - cached.timestamp;
        if (age > TOKENS.CACHE_TTL) {
            localStorage.removeItem(TOKENS.CACHE_KEY);
            return null;
        }
        return cached.data;
    } catch (e: any) {
        track('cache:local:error', { error: e.message });
        return null;
    }
};

export const saveToLocal = (data: DynObj) => {
    if (!hasLocalStorage || !data) return false;
    try {
        const payload = {
            data,
            timestamp: Date.now(),
            version: TOKENS.CACHE_KEY
        };
        localStorage.setItem(TOKENS.CACHE_KEY, JSON.stringify(payload));
        return true;
    } catch (e: any) {
        track('cache:local:save-error', { error: e.message });
        return false;
    }
};

export const invalidateAll = () => {
    try {
        if (hasSessionStorage) sessionStorage.removeItem(TOKENS.SESSION_KEY);
        if (hasLocalStorage) localStorage.removeItem(TOKENS.CACHE_KEY);
        track('cache:invalidate:all');
        return true;
    } catch (e: any) {
        return false;
    }
};

export const getCached = () => {
    const session = getFromSession();
    if (session) return { data: session, source: 'session' };
    const local = getFromLocal();
    if (local) return { data: local, source: 'local' };
    return null;
};

export const saveToCache = (data: DynObj) => {
    saveToSession(data);
    saveToLocal(data);
};
