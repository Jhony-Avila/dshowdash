// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/history
// PURPOSE: Gerenciamento de histórico de focus
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   focusHistory from ./state.js
//   focusElement from ./core.js
// EXPORTS:
//   getHistory — Retorna histórico recente
//   goBack — Volta para focus anterior
//   clearHistory — Limpa histórico
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerHistory
 * @description Histórico de navegação de focus
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { focusHistory } from './state.js';
import { focusElement } from './core.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.history';

/**
 * Retorna histórico de focus recente
 * @param {number} limit - Limite de entradas (default: 10)
 * @returns {Array} Histórico simplificado
 */
export function getHistory(limit: number) {
    limit = limit || 10;
    return focusHistory.slice(-limit).map(entry => ({
        tagName: entry.element?.tagName,
        id: entry.element?.id,
        context: entry.context,
        timestamp: entry.timestamp
    }));
}

/**
 * Volta para elemento anterior no histórico
 * @returns {Object} Resultado { ok, error? }
 */
export function goBack() {
    if (focusHistory.length < 2) {
        return { ok: false, error: 'No previous focus in history' };
    }
    
    focusHistory.pop();
    const previous = focusHistory[focusHistory.length - 1];
    
    if (previous && previous.element && document.contains(previous.element)) {
        return focusElement(previous.element, { context: 'history-back' });
    }
    
    return { ok: false, error: 'Previous element not in DOM' };
}

/**
 * Limpa todo o histórico
 */
export function clearHistory() {
    focusHistory.length = 0;
}
