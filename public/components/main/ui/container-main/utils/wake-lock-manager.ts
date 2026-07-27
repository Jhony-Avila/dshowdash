// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:wake-lock-manager
// PURPOSE: Wake Lock Manager - Screen Wake Lock API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createWakeLockManager() — exported function
//   getWakeLockManager() — exported function
//   resetWakeLockManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'release'
//   'visibilitychange'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE7';
export const MODULE_ID = 'container-main:wake-lock-manager';

export function createWakeLockManager(options: Record<string, any> = {}) {
  const { autoReacquire = true, onAcquire = null, onRelease = null, onError = null } = options;

  const _logger = createLogger(MODULE_ID);
  let _wakeLock: HTMLElement | null = null;
  let _isActive = false;
  const _listeners = new Map<string, Record<string, unknown>>();
  let _counter = 0;
  let _metrics = { acquires: 0, releases: 0, reacquires: 0, errors: 0 };

  function _notifyListeners(event: string, data: Record<string, unknown>) {
    _listeners.forEach((config: Record<string, unknown>) => {
      if (config.event === event || config.event === 'all') {
        try { (config.callback as (...args: unknown[]) => void)(data); } catch (e) { _logger.error('Listener error:', e); }
      }
    });
  }

  async function _handleVisibilityChange() {
    if (autoReacquire && document.visibilityState === 'visible' && _isActive && !_wakeLock) {
      try {
        await manager.acquire();
        _metrics.reacquires++;
      } catch (e) {
        // @ts-expect-error strict migration — TS2345
        _logger.warn('Failed to reacquire wake lock:', e);
      }
    }
  }

  document.addEventListener('visibilitychange', _handleVisibilityChange);

  const manager = {
    isSupported() { return 'wakeLock' in navigator; },
    isActive() { return _isActive && _wakeLock !== null; },

    async acquire() {
      if (!this.isSupported()) {
        const error = new Error('Wake Lock API not supported');
        onError?.(error);
        throw error;
      }

      try {
        // @ts-expect-error TS migration - TS2740
        _wakeLock = await navigator.wakeLock.request('screen');
        _isActive = true;
        _metrics.acquires++;

        _wakeLock!.addEventListener('release', () => {
          _wakeLock = null;
          if (_isActive) {
            _metrics.releases++;
            _notifyListeners('release', { reason: 'system' });
            onRelease?.({ reason: 'system' });
          }
        });

        _notifyListeners('acquire', {});
        onAcquire?.({});
        return true;
      } catch (e) {
        _metrics.errors++;
        _notifyListeners('error', { error: e });
        onError?.(e);
        throw e;
      }
    },

    async release() {
      if (_wakeLock) {
        _isActive = false;
        // @ts-expect-error TS migration - TS2339
        await _wakeLock.release();
        _wakeLock = null;
        _metrics.releases++;
        _notifyListeners('release', { reason: 'manual' });
        onRelease?.({ reason: 'manual' });
        return true;
      }
      return false;
    },

    async toggle() {
      if (this.isActive()) { await this.release(); return false; }
      else { await this.acquire(); return true; }
    },

    onAcquire(callback: (...args: unknown[]) => void) { const id = `acq-${++_counter}`; _listeners.set(id, { event: 'acquire', callback }); return id; },
    onRelease(callback: (...args: unknown[]) => void) { const id = `rel-${++_counter}`; _listeners.set(id, { event: 'release', callback }); return id; },
    onError(callback: (...args: unknown[]) => void) { const id = `err-${++_counter}`; _listeners.set(id, { event: 'error', callback }); return id; },
    onChange(callback: (...args: unknown[]) => void) { const id = `all-${++_counter}`; _listeners.set(id, { event: 'all', callback }); return id; },
    off(id: string) { return _listeners.delete(id); },

    getMetrics() { return { ..._metrics, supported: this.isSupported(), active: this.isActive(), listeners: _listeners.size }; },
    resetMetrics() { _metrics = { acquires: 0, releases: 0, reacquires: 0, errors: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, supported: this.isSupported(), active: this.isActive(), metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, supported: this.isSupported(), active: this.isActive() }; },

    async destroy() {
      document.removeEventListener('visibilitychange', _handleVisibilityChange);
      // @ts-expect-error TS migration - TS2339
      if (_wakeLock) { _isActive = false; await _wakeLock.release(); _wakeLock = null; }
      _listeners.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getWakeLockManager(options: Record<string, any> = {}) { if (!_instance) _instance = createWakeLockManager(options); return _instance; }
export function resetWakeLockManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export async function acquireWakeLock() { return (getWakeLockManager().acquire as (...args: unknown[]) => unknown)(); }
export async function releaseWakeLock() { return (getWakeLockManager().release as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, createWakeLockManager, getWakeLockManager, resetWakeLockManager, acquireWakeLock, releaseWakeLock, info, healthCheck };
