// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-shortcuts/constants
// PURPOSE: Constantes e configuração para sistema de atalhos
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   MODIFIER_KEYS — Enum de teclas modificadoras (frozen)
//   SHORTCUT_SCOPES — Enum de escopos de atalho (frozen)
//   DEFAULT_CONFIG — Configuração padrão (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardShortcutsConstants
 * @description Constantes para sistema de atalhos de teclado
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-keyboard-shortcuts';

export const MODIFIER_KEYS = Object.freeze({
    CTRL: 'ctrl',
    ALT: 'alt',
    SHIFT: 'shift',
    META: 'meta'
});

export const SHORTCUT_SCOPES = Object.freeze({
    GLOBAL: 'global',
    REGION: 'region',
    MODAL: 'modal',
    INPUT: 'input'
});

export const DEFAULT_CONFIG = Object.freeze({
    preventDefault: true,
    stopPropagation: true,
    allowInInputs: false,
    debounceMs: 100,
    showHelp: true,
    helpKey: 'shift+?'
});
