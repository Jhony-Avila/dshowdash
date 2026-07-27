/**
 * @file Service Worker Manager - Registration
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/utils/service-worker-manager/registration/manager
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../constants.js (SW_STATES, UPDATE_STRATEGIES)
 * @requires ../state.js (_state, getConfig, incrementMetric)
 * @requires ../helpers/notify.js (notifySubscribers, updateState)
 * @requires ../updates/manager.js (skipWaiting)
 * 
 * @provides isSupported, register, unregister
 * 
 * @browserAPI navigator.serviceWorker.register(), ServiceWorkerRegistration
 * 
 * @description
 * Handles service worker registration and unregistration.
 * Monitors installation states and handles update detection.
 * 
 * @example
 * import { register, unregister, isSupported } from './manager.js';
 * if (isSupported()) {
 *   const result = await register({ swPath: '/sw.js' });
 * }
 * ============================================================================
 */
'use strict';

import { SW_STATES, UPDATE_STRATEGIES } from '../constants.js';
import { _state, getConfig, incrementMetric } from '../state.js';
import { notifySubscribers, updateState } from '../helpers/notify.js';
import { skipWaiting } from '../updates/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.registration.manager';

export function isSupported() {
  _state.supported = 'serviceWorker' in navigator;
  return _state.supported;
}

export function register(options?: DynObj) {
  options = options || {};
  
  if (!isSupported()) {
    updateState(SW_STATES.NOT_SUPPORTED);
    return Promise.resolve({ ok: false, error: 'Service Workers not supported' });
  }
  
  const config = getConfig();
  const swPath = options.swPath || config.swPath;
  const scope = options.scope || config.scope;
  
  return navigator.serviceWorker.register(swPath, { scope })
    .then(registration => {
      _state.registration = registration;
      incrementMetric('registrations');
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker!.addEventListener('statechange', () => {
          if (newWorker!.state === 'installed' && navigator.serviceWorker.controller) {
            _state.updateAvailable = true;
            _state.waitingWorker = newWorker;
            incrementMetric('updates');
            
            notifySubscribers({
              type: 'update-available',
              worker: newWorker,
              timestamp: Date.now()
            });
            
            if ((config.updateStrategy as string) === UPDATE_STRATEGIES.IMMEDIATE) {
              skipWaiting();
            }
          }
        });
      });
      
      if (registration.installing) {
        updateState(SW_STATES.INSTALLING, { registration });
      } else if (registration.waiting) {
        _state.updateAvailable = true;
        _state.waitingWorker = registration.waiting;
        updateState(SW_STATES.INSTALLED, { registration, updateAvailable: true });
      } else if (registration.active) {
        updateState(SW_STATES.ACTIVATED, { registration });
      }
      
      notifySubscribers({
        type: 'registered',
        registration,
        timestamp: Date.now()
      });
      
      return { ok: true, registration };
    })
    .catch(error => {
      incrementMetric('errors');
      updateState(SW_STATES.ERROR, { error: error.message });
      return { ok: false, error: error.message };
    });
}

export function unregister() {
  if (!_state.registration) {
    return Promise.resolve({ ok: false, error: 'No registration' });
  }
  
  return _state.registration.unregister()
    .then((success: DynObj) => {
      if (success) {
        _state.registration = null;
        updateState(SW_STATES.NOT_REGISTERED);
        
        notifySubscribers({
          type: 'unregistered',
          timestamp: Date.now()
        });
      }
      return { ok: success };
    });
}
