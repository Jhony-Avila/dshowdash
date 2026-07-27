// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/constants
// PURPOSE: Constantes para sistema de navegação por teclado
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   NAVIGATION_ORDER — Ordem de navegação entre regiões
//   TRAPPABLE_REGIONS — Regiões com focus trap
//   KEYS — Enum de teclas especiais
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationConstants
 * @description Constantes para navegação por teclado (F6, Tab, Escape)
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-keyboard-navigation';

export const NAVIGATION_ORDER = [
    'header',
    'nav-rail',
    'sidebar',
    'main',
    'footer'
];

export const TRAPPABLE_REGIONS = ['login', 'toast'];

export const KEYS = {
    F6: 'F6',
    ESCAPE: 'Escape',
    TAB: 'Tab'
};
