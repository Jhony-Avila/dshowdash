// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/utils
// PURPOSE: Utilitários para gerenciamento de focus
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FOCUSABLE_SELECTOR from ./constants.js
//   focusHistory, subscribers, config from ./state.js
// EXPORTS:
//   getFocusableElements — Retorna elementos focáveis de container
//   notifySubscribers — Notifica todos os subscribers
//   addToHistory — Adiciona elemento ao histórico de focus
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerUtils
 * @description Utilitários para sistema de focus
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { FOCUSABLE_SELECTOR } from './constants.js';
import { focusHistory, subscribers, config } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.utils';

/**
 * Retorna elementos focáveis visíveis em um container
 * @param {HTMLElement} container - Container para buscar
 * @returns {Array} Array de elementos focáveis
 */
export function getFocusableElements(container: HTMLElement) {
    if (!container) return [];
    
    const elements = container.querySelectorAll(FOCUSABLE_SELECTOR);
    return Array.prototype.filter.call(elements, (el: HTMLElement) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');
}

/**
 * Notifica todos os subscribers de um evento
 * @param {Object} event - Evento a notificar
 */
export function notifySubscribers(event: DynObj) {
    for (let i = 0; i < subscribers.length; i++) {
        try {
            subscribers[i](event);
        } catch (e) {
            // Silently ignore subscriber errors
        }
    }
}

/**
 * Adiciona elemento ao histórico de focus
 * @param {HTMLElement} element - Elemento focado
 * @param {string} context - Contexto opcional
 */
export function addToHistory(element: HTMLElement, context: DynObj) {
    focusHistory.push({
        element,
        context: context || null,
        timestamp: Date.now()
    });
    
    // Mantém limite do histórico
    while (focusHistory.length > config.historyLimit) {
        focusHistory.shift();
    }
}
