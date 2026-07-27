/**
 * @file Service Worker Manager - Updates
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/utils/service-worker-manager/updates/manager
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../state.js (_state, incrementMetric)
 * @provides checkForUpdates, applyUpdate, skipWaiting, hasUpdate
 * 
 * @browserAPI ServiceWorkerRegistration.update()
 * 
 * @description
 * Manages service worker updates. Checks for new versions, applies updates,
 * and handles skip waiting for immediate activation.
 * 
 * @example
 * import { checkForUpdates, applyUpdate, hasUpdate } from './manager.js';
 * const result = await checkForUpdates();
 * if (hasUpdate()) applyUpdate();
 * ============================================================================
 */
'use strict';

import { _state, incrementMetric } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.updates.manager';

export function checkForUpdates() {
  if (!_state.registration) {
    return Promise.resolve({ ok: false, error: 'No registration' });
  }
  
  return _state.registration.update()
    .then(() => ({
    ok: true,
    updateAvailable: _state.updateAvailable
  }))
    .catch((error: DynObj) => ({
    ok: false,
    error: error.message
  }));
}

export function applyUpdate() {
  if (!_state.waitingWorker) {
    return { ok: false, error: 'No waiting worker' };
  }
  
  skipWaiting();
  return { ok: true };
}

export function skipWaiting() {
  if (_state.waitingWorker) {
    _state.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    incrementMetric('messagesSent');
  }
}

export function hasUpdate() {
  return _state.updateAvailable;
}
