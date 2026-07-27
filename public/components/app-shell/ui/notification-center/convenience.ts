// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-center/convenience
// PURPOSE: Métodos de conveniência para notificações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   NOTIFICATION_TYPES from ./constants.js
//   show, dismiss from ./core.js
// EXPORTS:
//   info — Notificação de info
//   success — Notificação de sucesso
//   warning — Notificação de aviso
//   error — Notificação de erro
//   loading — Notificação de loading
//   promise — Wrapper de promise com notificações
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationCenterConvenience
 * @description Atalhos para tipos comuns de notificação
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { NOTIFICATION_TYPES } from './constants.js';
import { show, dismiss } from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.notification-center.convenience';

export function info(message: string, options: DynObj) {
    return show(Object.assign({ type: NOTIFICATION_TYPES.INFO, message }, options || {}));
}

export function success(message: string, options: DynObj) {
    return show(Object.assign({ type: NOTIFICATION_TYPES.SUCCESS, message }, options || {}));
}

export function warning(message: string, options: DynObj) {
    return show(Object.assign({ type: NOTIFICATION_TYPES.WARNING, message }, options || {}));
}

export function error(message: string, options: DynObj) {
    return show(Object.assign({ type: NOTIFICATION_TYPES.ERROR, message, duration: 0 }, options || {}));
}

export function loading(message: string, options: DynObj) {
    return show(Object.assign({
        type: NOTIFICATION_TYPES.LOADING,
        message,
        duration: 0,
        dismissible: false
    }, options || {}));
}

/**
 * Wrapper de promise com notificações automáticas
 * @param {Promise|Function} promiseOrFn - Promise ou função que retorna promise
 * @param {Object} messages - Mensagens { loading, success, error }
 * @returns {Promise}
 */
export function promise(promiseOrFn: DynObj, messages: DynObj) {
    messages = messages || {};

    // @ts-expect-error TS migration - TS2554
    const loadingId = loading(messages.loading || 'Carregando...');
    
    const thePromise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
    
    return thePromise
        .then((result: DynObj) => {
            dismiss(loadingId);
            if (messages.success) {

                // @ts-expect-error TS migration - TS2554
                success(typeof messages.success === 'function' ? messages.success(result) : messages.success);
            }
            return result;
        })
        .catch((err: DynObj) => {
            dismiss(loadingId);
            if (messages.error) {

                // @ts-expect-error TS migration - TS2554
                error(typeof messages.error === 'function' ? messages.error(err) : messages.error);
            }
            throw err;
        });
}
