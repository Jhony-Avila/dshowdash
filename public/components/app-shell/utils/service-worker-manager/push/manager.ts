// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/push/manager
// PURPOSE: Gerenciamento de Push Notifications
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _state from ../state.js
//   urlBase64ToUint8Array from ../helpers/base64.js
// EXPORTS:
//   requestPushPermission — Solicita permissão de notificação
//   getPushSubscription — Retorna subscription atual
//   subscribePush — Cria subscription com VAPID key
// BROWSER APIs: Notification, PushManager
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerPushManager
 * @description API de Push Notifications
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { _state } from '../state.js';
import { urlBase64ToUint8Array } from '../helpers/base64.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.push.manager';

/**
 * Solicita permissão para notificações
 * @returns {Promise<Object>}
 */
export function requestPushPermission() {
    if (!('Notification' in window)) {
        return Promise.resolve({ ok: false, error: 'Notifications not supported' });
    }
    
    return Notification.requestPermission()
        .then(permission => ({
        ok: permission === 'granted',
        permission
    }));
}

/**
 * Retorna subscription atual de push
 * @returns {Promise<PushSubscription|null>}
 */
export function getPushSubscription() {
    if (!_state.registration || !_state.registration.pushManager) {
        return Promise.resolve(null);
    }
    
    return _state.registration.pushManager.getSubscription();
}

/**
 * Cria nova subscription de push
 * @param {string} vapidPublicKey - VAPID public key
 * @returns {Promise<Object>}
 */
export function subscribePush(vapidPublicKey: string) {
    if (!_state.registration || !_state.registration.pushManager) {
        return Promise.resolve({ ok: false, error: 'Push not supported' });
    }
    
    const options = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    };
    
    return _state.registration.pushManager.subscribe(options)
        .then((subscription: DynObj) => ({
        ok: true,
        subscription
    }))
        .catch((error: DynObj) => ({
        ok: false,
        error: error.message
    }));
}
