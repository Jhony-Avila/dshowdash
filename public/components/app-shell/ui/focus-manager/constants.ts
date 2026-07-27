// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/constants
// PURPOSE: Constantes e seletores para gerenciamento de focus
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   FOCUSABLE_SELECTOR — Seletor CSS para elementos focáveis
//   FOCUS_STRATEGIES — Enum de estratégias de focus (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerConstants
 * @description Constantes para sistema de gerenciamento de focus
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-focus-manager';

export const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
].join(', ');

export const FOCUS_STRATEGIES = Object.freeze({
    FIRST: 'first',
    LAST: 'last',
    PREVIOUS: 'previous',
    SPECIFIC: 'specific',
    RESTORE: 'restore'
});
