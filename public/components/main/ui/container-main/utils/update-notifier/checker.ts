// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: checker
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   applyUpdate() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
/**
 * Update Notifier - Update Checker
 * @module update-notifier/checker
 */
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.update-notifier.checker';

export async function checkViaEndpoint(versionEndpoint: unknown, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  try {
    // @ts-expect-error TS migration - TS2769
    const response = await fetch(versionEndpoint, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return {
      version: data.version,
      releaseDate: data.releaseDate,
      changelog: data.changelog,
      features: data.features,
      critical: data.critical || false
    };
  } catch (error: any) {
    logger.debug('Version endpoint check failed:', error.message);
    return null;
  }
}

export async function checkViaServiceWorker(logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if (!('serviceWorker' in navigator)) return null;
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    
    await registration.update();
    
    if (registration.waiting) {
      return {
        version: 'new',
        type: 'service-worker',
        worker: registration.waiting,
        registration
      };
    }
    
    return { registration };
  } catch (error: any) {
    logger.debug('Service Worker check failed:', error.message);
    return null;
  }
}

export function applyUpdate(swRegistration: Record<string, unknown>, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  logger.info('Applying update...');
  
  if (swRegistration?.waiting) {
    ((swRegistration.waiting as Record<string, unknown>).postMessage as (...args: unknown[]) => unknown)({ type: 'SKIP_WAITING' });
  }
  
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    }).finally(() => {

      // @ts-expect-error TS migration - TS2554
      window.location.reload(true);
    });
  } else {

    // @ts-expect-error TS migration - TS2339
    window.location.reload(true);
  }
}
