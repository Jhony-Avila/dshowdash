// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:geolocation-manager
// PURPOSE: Geolocation Manager - Gerenciamento de localização
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   GEO_ERRORS — exported value
//   createGeolocationManager() — exported function
//   getGeolocationManager() — exported function
//   resetGeolocationManager() — exported function
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

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE7';
export const MODULE_ID = 'container-main:geolocation-manager';

export const GEO_ERRORS = Object.freeze({ PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, UNSUPPORTED: 4 });

export function createGeolocationManager(options: Record<string, unknown> = {}) {
  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 60000, cacheTimeout = 300000 } = options;

  const _logger = createLogger(MODULE_ID);
  let _lastPosition: unknown = null;
  let _lastTimestamp = 0;
  let _watchId = null;
  const _listeners = new Map<string, Record<string, unknown>>();
  let _counter = 0;
  let _metrics = { requests: 0, successes: 0, errors: 0, watches: 0 };

  function _isSupported() { return 'geolocation' in navigator; }

  function _formatPosition(position: GeolocationPosition) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };
  }

  const manager = {
    isSupported() { return _isSupported(); },

    async getCurrentPosition(options: Record<string, unknown> = {}) {
      if (!_isSupported()) return Promise.reject({ code: GEO_ERRORS.UNSUPPORTED, message: 'Geolocation not supported' });

      // Retornar cache se válido
      if (_lastPosition && (Date.now() - _lastTimestamp) < Number(cacheTimeout)) {
        return _lastPosition;
      }

      _metrics.requests++;

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            _lastPosition = _formatPosition(position);
            _lastTimestamp = Date.now();
            _metrics.successes++;
            resolve(_lastPosition);
          },
          (error) => {
            _metrics.errors++;
            reject({ code: error.code, message: error.message });
          },
          { enableHighAccuracy: (options.enableHighAccuracy ?? enableHighAccuracy) as boolean, timeout: (options.timeout ?? timeout) as number, maximumAge: (options.maximumAge ?? maximumAge) as number }
        );
      });
    },

    watchPosition(callback: (...args: unknown[]) => void, errorCallback: unknown = null, options: Record<string, unknown> = {}) {
      // @ts-expect-error TS migration - TS2349
      if (!_isSupported()) { errorCallback?.({ code: GEO_ERRORS.UNSUPPORTED, message: 'Geolocation not supported' }); return null; }

      _metrics.watches++;
      const id = `watch-${++_counter}`;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const formatted = _formatPosition(position);
          _lastPosition = formatted;
          _lastTimestamp = Date.now();
          callback(formatted);
        },
        (error) => {
          _metrics.errors++;
          // @ts-expect-error TS migration - TS2349
          errorCallback?.({ code: error.code, message: error.message });
        },
        { enableHighAccuracy: (options.enableHighAccuracy ?? enableHighAccuracy) as boolean, timeout: (options.timeout ?? timeout) as number, maximumAge: (options.maximumAge ?? maximumAge) as number }
      );

      // @ts-expect-error TS migration - TS2345
      _listeners.set(id, watchId);
      return id;
    },

    clearWatch(id: string) {
      const watchId = _listeners.get(id);
      if (watchId !== undefined) {
        // @ts-expect-error TS migration - TS2345
        navigator.geolocation.clearWatch(watchId);
        _listeners.delete(id);
        return true;
      }
      return false;
    },

    clearAllWatches() {
      // @ts-expect-error TS migration - TS2345
      _listeners.forEach(watchId => navigator.geolocation.clearWatch(watchId));
      _listeners.clear();
    },

    getLastPosition() { return _lastPosition; },
    clearCache() { _lastPosition = null; _lastTimestamp = 0; },

    distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    async distanceFromCurrent(lat: unknown, lon: unknown) {
      const current = await this.getCurrentPosition();
      // @ts-expect-error strict migration — TS18046, TS2345
      return this.distanceBetween(current.latitude, current.longitude, lat, lon);
    },

    getMetrics() { return { ..._metrics, hasLastPosition: !!_lastPosition, activeWatches: _listeners.size }; },
    resetMetrics() { _metrics = { requests: 0, successes: 0, errors: 0, watches: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, supported: _isSupported(), hasLastPosition: !!_lastPosition, activeWatches: _listeners.size, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, supported: _isSupported(), lastPosition: _lastPosition, activeWatches: _listeners.size }; },

    destroy() { this.clearAllWatches(); this.clearCache(); }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getGeolocationManager(options: Record<string, unknown> = {}) { if (!_instance) _instance = createGeolocationManager(options); return _instance; }
export function resetGeolocationManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export async function getCurrentPosition(options: Record<string, unknown>) { return (getGeolocationManager().getCurrentPosition as (...args: unknown[]) => unknown)(options); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, errors: Object.keys(GEO_ERRORS) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, GEO_ERRORS, createGeolocationManager, getGeolocationManager, resetGeolocationManager, getCurrentPosition, info, healthCheck };
