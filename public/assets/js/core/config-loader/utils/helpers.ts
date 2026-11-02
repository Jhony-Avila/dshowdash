// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P13-COMPLIANT)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-loader-helpers
// PURPOSE: Config Loader - Helper Utilities v2.1.1-P13-COMPLIANT
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   getApiProfileConfig() — exported function
//   safeGet() — exported function
//   isObject() — exported function
//   getTimestamp() — exported function
//   generateSessionId() — exported function
//   loadLocalOverrides() — exported function
//   persistLocalOverrides() — exported function
//   loadQueryParamOverrides() — exported function
//   setNestedValue() — exported function
//   shallowEqual() — exported function
//   deepFreeze() — exported function
//   getActiveOverrideKeys() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
//   window.APIClient
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.1-P13-COMPLIANT';
export const MODULE_ID = 'config-loader-helpers';

export function getVersion() { return VERSION; }

let REQUEST_PROFILES: Record<string, Record<string, unknown>> | null = null;

function loadRequestProfiles() {
  if (REQUEST_PROFILES) return REQUEST_PROFILES;

  // @ts-expect-error TS migration - TS2339
  try { if (typeof window !== 'undefined' && window.APIClient?.profiles) { REQUEST_PROFILES = window.APIClient.profiles; return REQUEST_PROFILES; } } catch (e) { }
  REQUEST_PROFILES = { auth: { timeout: 5000, retries: 0, retryDelay: 0, backoffMultiplier: 1, maxRetryDelay: 0 }, default: { timeout: 10000, retries: 2, retryDelay: 1000, backoffMultiplier: 2, maxRetryDelay: 8000 }, longRun: { timeout: 30000, retries: 1, retryDelay: 2000, backoffMultiplier: 2, maxRetryDelay: 10000 }, realtime: { timeout: 3000, retries: 0, retryDelay: 0, backoffMultiplier: 1, maxRetryDelay: 0 } };
  return REQUEST_PROFILES;
}

export function getApiProfileConfig(profile = 'default') { const profiles = loadRequestProfiles(); const cfg = profiles![profile] || profiles!.default; return { timeout: cfg.timeout, retries: cfg.retries, retryDelay: cfg.retryDelay, backoff: cfg.backoffMultiplier, maxRetryDelay: cfg.maxRetryDelay }; }

export function safeGet(obj: Record<string, unknown>, path: string | string[], fallback: unknown = undefined) {
  if (!path) return obj ?? fallback;
  if (!obj || typeof obj !== 'object') return typeof fallback !== 'undefined' ? fallback : undefined;
  const segments = Array.isArray(path) ? path : String(path).split('.');
  let current: unknown = obj;
  for (const segment of segments) { if (current === null || current === undefined) return typeof fallback !== 'undefined' ? fallback : undefined; if (typeof current !== 'object') return typeof fallback !== 'undefined' ? fallback : undefined; if (Object.prototype.hasOwnProperty.call(current, segment)) current = (current as Record<string, unknown>)[segment]; else return typeof fallback !== 'undefined' ? fallback : undefined; }
  return current === undefined ? fallback : current;
}

export function isObject(value: unknown) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
export function getTimestamp() { return new Date().toISOString(); }
export function generateSessionId() { return `cfg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }

export function loadLocalOverrides() { try { if (typeof localStorage === 'undefined') return {}; const stored = localStorage.getItem('__dshowdash_config_overrides__'); if (stored) { const parsed = JSON.parse(stored); if (isObject(parsed)) return parsed; } } catch (err) { } return {}; }
export function persistLocalOverrides(overrides: Record<string, unknown>) { try { if (typeof localStorage === 'undefined') return false; if (isObject(overrides)) { localStorage.setItem('__dshowdash_config_overrides__', JSON.stringify(overrides)); return true; } } catch (err) { } return false; }

export function loadQueryParamOverrides() {
  const overrides: Record<string, unknown> = {};
  try {
    if (typeof window === 'undefined' || !window.location?.search) return {}; // CONTRACT_OK_P13: Read-only (config)
    const params = new URLSearchParams(window.location.search); // CONTRACT_OK_P13: Read-only (config)
    for (const [key, value] of params.entries()) {
      if (key.startsWith('config.')) {
        const path = key.replace('config.', '');
        let parsedValue = value;

        // @ts-expect-error TS migration - TS2322
        if (value === 'true') parsedValue = true;

        // @ts-expect-error TS migration - TS2322
        else if (value === 'false') parsedValue = false;

        // @ts-expect-error TS migration - TS2322, TS2345
        else if (!isNaN(value) && value !== '') parsedValue = Number(value);
        setNestedValue(overrides, path, parsedValue);
      }
    }
  } catch (err) { }
  return overrides;
}

export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) { if (!obj || !path) return obj; const keys = String(path).split('.'); let current: Record<string, unknown> = obj; for (let i = 0; i < keys.length - 1; i++) { const key = keys[i]; if (!current[key] || typeof current[key] !== 'object') current[key] = {}; current = current[key] as Record<string, unknown>; } current[keys[keys.length - 1]] = value; return obj; }
export function shallowEqual(objA: Record<string, unknown>, objB: Record<string, unknown>) { if (objA === objB) return true; if (!objA || !objB) return false; const keysA = Object.keys(objA); const keysB = Object.keys(objB); if (keysA.length !== keysB.length) return false; for (const key of keysA) { if (objA[key] !== objB[key]) return false; } return true; }
// @ts-expect-error strict migration — TS7053
export function deepFreeze(obj: unknown) { if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) { Object.keys(obj).forEach(key => deepFreeze(obj[key])); Object.freeze(obj); } return obj; }
export function getActiveOverrideKeys() { const localKeys = Object.keys(loadLocalOverrides()); const queryKeys = Object.keys(loadQueryParamOverrides()); return { localStorage: localKeys, queryParams: queryKeys, total: [...new Set([...localKeys, ...queryKeys])] }; }
