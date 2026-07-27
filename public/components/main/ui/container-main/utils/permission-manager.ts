// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:permission-manager
// PURPOSE: Permission Manager - Gestão de permissões do navegador
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PERMISSIONS — exported value
//   PERMISSION_STATES — exported value
//   createPermissionManager() — exported function
//   getPermissionManager() — exported function
//   resetPermissionManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE7';
export const MODULE_ID = 'container-main:permission-manager';

export const PERMISSIONS = Object.freeze({
  NOTIFICATIONS: 'notifications', GEOLOCATION: 'geolocation', CAMERA: 'camera', MICROPHONE: 'microphone',
  CLIPBOARD_READ: 'clipboard-read', CLIPBOARD_WRITE: 'clipboard-write', PERSISTENT_STORAGE: 'persistent-storage',
  MIDI: 'midi', SCREEN_WAKE_LOCK: 'screen-wake-lock'
});

export const PERMISSION_STATES = Object.freeze({ GRANTED: 'granted', DENIED: 'denied', PROMPT: 'prompt', UNSUPPORTED: 'unsupported' });

export function createPermissionManager(options: Record<string, any> = {}) {
  const { onPermissionChange = null } = options;

  const _logger = createLogger(MODULE_ID);
  const _cache = new Map();
  const _listeners = new Map<string, Record<string, unknown>>();
  let _metrics = { queries: 0, requests: 0, granted: 0, denied: 0 };

  async function _queryPermission(name: string) {
    if (!navigator.permissions) return PERMISSION_STATES.UNSUPPORTED;
    try {
      // @ts-expect-error TS migration - TS2322
      const result = await navigator.permissions.query({ name });
      return result.state;
    } catch (e: any) {
      return PERMISSION_STATES.UNSUPPORTED;
    }
  }

  const manager = {
    async query(permission: string) {
      _metrics.queries++;
      if (_cache.has(permission)) return _cache.get(permission);
      const state = await _queryPermission(permission);
      _cache.set(permission, state);
      return state;
    },

    async queryAll() {
      const results: Record<string, any> = {};
      for (const perm of Object.values(PERMISSIONS)) {
        results[perm] = await this.query(perm);
      }
      return results;
    },

    async request(permission: string) {
      _metrics.requests++;
      let state: unknown = PERMISSION_STATES.UNSUPPORTED;

      try {
        switch (permission) {
          case PERMISSIONS.NOTIFICATIONS:
            if (!('Notification' in window)) break;
            const notifResult = await Notification.requestPermission();
            state = notifResult;
            break;
          case PERMISSIONS.GEOLOCATION:
            if (!navigator.geolocation) break;
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(() => { state = PERMISSION_STATES.GRANTED; resolve(undefined as any); }, (err) => { state = err.code === 1 ? PERMISSION_STATES.DENIED : PERMISSION_STATES.PROMPT; resolve(undefined as any); }, { timeout: 5000 });
            });
            break;
          case PERMISSIONS.CAMERA:
          case PERMISSIONS.MICROPHONE:
            if (!navigator.mediaDevices) break;
            const constraints = permission === PERMISSIONS.CAMERA ? { video: true } : { audio: true };
            try {
              const stream = await navigator.mediaDevices.getUserMedia(constraints);
              stream.getTracks().forEach(t => t.stop());
              state = PERMISSION_STATES.GRANTED;
            } catch (e: any) {
              state = e.name === 'NotAllowedError' ? PERMISSION_STATES.DENIED : PERMISSION_STATES.PROMPT;
            }
            break;
          case PERMISSIONS.CLIPBOARD_READ:
            if (!navigator.clipboard?.readText) break;
            try { await navigator.clipboard.readText(); state = PERMISSION_STATES.GRANTED; } catch { state = PERMISSION_STATES.DENIED; }
            break;
          case PERMISSIONS.PERSISTENT_STORAGE:
            if (!navigator.storage?.persist) break;
            const persisted = await navigator.storage.persist();
            state = persisted ? PERMISSION_STATES.GRANTED : PERMISSION_STATES.DENIED;
            break;
          default:
            state = await this.query(permission);
        }
      } catch (e: any) {
        _logger.warn(`Permission request failed for ${permission}:`, e);
      }

      _cache.set(permission, state);
      if (state === PERMISSION_STATES.GRANTED) _metrics.granted++;
      else if (state === PERMISSION_STATES.DENIED) _metrics.denied++;

      return state;
    },

    async isGranted(permission: string) { return (await this.query(permission)) === PERMISSION_STATES.GRANTED; },
    async isDenied(permission: string) { return (await this.query(permission)) === PERMISSION_STATES.DENIED; },
    async canRequest(permission: string) { return (await this.query(permission)) === PERMISSION_STATES.PROMPT; },

    watch(permission: string, callback: (...args: unknown[]) => void) {
      if (!navigator.permissions) return null;
      const id = `watch-${Date.now()}`;
      // @ts-expect-error TS migration - TS2322
      navigator.permissions.query({ name: permission }).then(status => {
        const handler = () => {
          _cache.set(permission, status.state);
          callback(status.state, permission);
          onPermissionChange?.(permission, status.state);
        };
        status.addEventListener('change', handler);
        _listeners.set(id, { status, handler, permission });
      }).catch(() => {});
      return id;
    },

    unwatch(id: string) {
      const listener = _listeners.get(id);
      if (listener) {
        // @ts-expect-error TS migration - TS2769
        (listener.status as HTMLElement).removeEventListener('change', listener.handler);
        _listeners.delete(id);
        return true;
      }
      return false;
    },

    clearCache() { _cache.clear(); },
    getMetrics() { return { ..._metrics, cached: _cache.size, watching: _listeners.size }; },
    resetMetrics() { _metrics = { queries: 0, requests: 0, granted: 0, denied: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, permissionsAPI: !!navigator.permissions, cached: _cache.size, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, permissions: Object.keys(PERMISSIONS), states: Object.keys(PERMISSION_STATES) }; },

    destroy() { _listeners.forEach((_, id) => this.unwatch(id)); _cache.clear(); }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getPermissionManager(options: Record<string, any> = {}) { if (!_instance) _instance = createPermissionManager(options); return _instance; }
export function resetPermissionManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export async function queryPermission(permission: string) { return (getPermissionManager().query as (...args: unknown[]) => unknown)(permission); }
export async function requestPermission(permission: string) { return (getPermissionManager().request as (...args: unknown[]) => unknown)(permission); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, permissions: Object.keys(PERMISSIONS) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, PERMISSIONS, PERMISSION_STATES, createPermissionManager, getPermissionManager, resetPermissionManager, queryPermission, requestPermission, info, healthCheck };
