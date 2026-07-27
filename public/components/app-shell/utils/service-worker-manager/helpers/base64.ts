// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/helpers/base64
// PURPOSE: Conversão de Base64 URL-safe para Uint8Array (Push API)
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   urlBase64ToUint8Array — Converte string base64 URL-safe para Uint8Array
// BROWSER APIs: window.atob
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerBase64Helper
 * @description Utilitário para conversão base64 em Push Notifications
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.helpers.base64';

/**
 * Converte string Base64 URL-safe para Uint8Array
 * Usado principalmente para VAPID keys em Push Notifications
 * @param {string} base64String - String base64 URL-safe
 * @returns {Uint8Array} Array de bytes
 */
export function urlBase64ToUint8Array(base64String: DynObj) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
