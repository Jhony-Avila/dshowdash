// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-center/queries
// PURPOSE: Queries para busca de notificações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   notifications, queue from ./state.js
// EXPORTS:
//   get — Busca notificação por ID
//   getAll — Retorna todas as notificações
//   getByType — Filtra por tipo
//   getQueueSize — Retorna tamanho da fila
//   getVisibleCount — Conta notificações visíveis
//   findByGroup — Busca por grupo
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationCenterQueries
 * @description Queries de busca para notificações
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { notifications, queue } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.notification-center.queries';

/**
 * Busca notificação por ID
 * @param {string} id - ID da notificação
 * @returns {Object|null}
 */
export function get(id: DynObj) {
    return notifications.get(id) || null;
}

/**
 * Retorna todas as notificações
 * @returns {Array}
 */
export function getAll() {
    const list: DynObj[] = [];
    notifications.forEach(n => { list.push(n); });
    return list;
}

/**
 * Filtra notificações por tipo
 * @param {string} type - Tipo da notificação
 * @returns {Array}
 */
export function getByType(type: DynObj) {
    const list: DynObj[] = [];
    notifications.forEach(n => {
        if (n.type === type) list.push(n);
    });
    return list;
}

/**
 * Retorna tamanho da fila
 * @returns {number}
 */
export function getQueueSize() {
    return queue.length;
}

/**
 * Conta notificações atualmente visíveis
 * @returns {number}
 */
export function getVisibleCount() {
    let count = 0;
    notifications.forEach(n => {
        if (n._element) count++;
    });
    return count;
}

/**
 * Busca notificação por grupo
 * @param {string} group - Nome do grupo
 * @returns {Object|null}
 */
export function findByGroup(group: DynObj): DynObj  {
    let found = null;
    notifications.forEach(n => {
        if (n.group === group) found = n;
    });
    return found;
}
