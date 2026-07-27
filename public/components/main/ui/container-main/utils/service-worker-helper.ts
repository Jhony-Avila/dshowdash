// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-sw-helper
// PURPOSE: Container-Main Service Worker Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   skipWaiting() — exported function
//   postMessage() — exported function
//   onMessage() — exported function
//   isOnline() — exported function
//   onOnlineStatusChange() — exported function
//   getStatus() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'message'
//   'offline'
//   'online'
//   'statechange'
//   'updatefound'
// WINDOW ACCESS:
//   window.addEventListener
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-sw-helper';

const logger = createLogger(MODULE_ID);

let _registration: HTMLElement | null = null;
let _isSupported = 'serviceWorker' in navigator;

// Register service worker
export async function register(swPath = '/sw.js', options: Record<string, unknown> = {}) {
  if (!_isSupported) {
    logger.warn('Service Workers not supported');
    return null;
  }
  
  try {
    // @ts-expect-error TS migration - TS2740
    _registration = await navigator.serviceWorker.register(swPath, options);
    
    _registration!.addEventListener('updatefound', () => {
      // @ts-expect-error TS migration - TS2339
      const newWorker = _registration.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          dispatchEvent(new CustomEvent('sw:update-available'));
        }
      });
    });
    
    return _registration;
  } catch (error: any) {
    logger.error('Registration failed', { error: error.message });
    return null;
  }
}

// Unregister service worker
export async function unregister() {
  if (!_registration) return false;
  // @ts-expect-error TS migration - TS2339
  return _registration.unregister();
}

// Check for updates
export async function checkForUpdates() {
  if (!_registration) return null;
  // @ts-expect-error TS migration - TS2339
  await _registration.update();
  return _registration;
}

// Skip waiting and activate new SW
export function skipWaiting() {
  // @ts-expect-error TS migration - TS2551
  if (_registration?.waiting) {
    // @ts-expect-error TS migration - TS2551
    _registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }
  return false;
}

// Send message to service worker
export function postMessage(message: string) {
  if (!navigator.serviceWorker.controller) return false;
  navigator.serviceWorker.controller.postMessage(message);
  return true;
}

// Listen for messages from SW
export function onMessage(callback: (...args: unknown[]) => void) {
  if (!_isSupported) return () => {};
  
  // @ts-expect-error TS migration - TS2339
  const handler = (event: Event) => callback(event.data);
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}

// Cache management
export async function getCacheNames() {
  if (!('caches' in window)) return [];
  return caches.keys();
}

export async function clearCache(cacheName: unknown) {
  if (!('caches' in window)) return false;
  return caches.delete((cacheName as string));
}

export async function clearAllCaches() {
  const names = await getCacheNames();
  await Promise.all(names.map(name => caches.delete(name)));
  return names.length;
}

export async function getCacheSize(cacheName: unknown) {
  if (!('caches' in window)) return 0;
  const cache = await caches.open((cacheName as string));
  const keys = await cache.keys();
  let size = 0;
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      size += blob.size;
    }
  }
  
  return size;
}

// Precache resources
export async function precache(urls: Record<string, unknown>, cacheName = 'precache-v1') {
  if (!('caches' in window)) return 0;
  const cache = await caches.open(cacheName);
  // @ts-expect-error TS migration - TS2769
  await cache.addAll(urls);
  return urls.length;
}

// Check online status
export function isOnline() {
  return navigator.onLine;
}

export function onOnlineStatusChange(callback: (...args: unknown[]) => void) {
  const onlineHandler = () => callback(true);
  const offlineHandler = () => callback(false);
  
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  
  return () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  };
}

// Get registration status
export function getStatus() {
  return {
    isSupported: _isSupported,
    isRegistered: !!_registration,
    isControlled: !!navigator.serviceWorker?.controller,
    isOnline: navigator.onLine,
    // @ts-expect-error TS migration - TS2339
    state: _registration?.active?.state || 'none'
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, ...getStatus() };
}

export function healthCheck() {
  const status = getStatus();
  return {
    status: status.isSupported ? 'HEALTHY' : 'UNSUPPORTED',
    version: VERSION,
    moduleId: MODULE_ID,
    ...status
  };
}

export default {
  register, unregister, checkForUpdates, skipWaiting,
  postMessage, onMessage,
  getCacheNames, clearCache, clearAllCaches, getCacheSize, precache,
  isOnline, onOnlineStatusChange, getStatus,
  info, healthCheck, VERSION, MODULE_ID
};
