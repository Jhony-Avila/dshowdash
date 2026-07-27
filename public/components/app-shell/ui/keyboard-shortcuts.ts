// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui/keyboard-shortcuts-wrapper
// PURPOSE: Wrapper de compatibilidade retroativa
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./keyboard-shortcuts/index.js
// EXPORTS: * (all named + default export)
// DEPRECATION: Importar diretamente de './keyboard-shortcuts/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardShortcutsWrapper
 * @description Compatibilidade retroativa para keyboard-shortcuts modularizado
 * @version 1.0.0-AAA
 * @since 2025-02-02
 * @deprecated Use './keyboard-shortcuts/index.js' diretamente
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-shortcuts';

export * from './keyboard-shortcuts/index.js';
export { default } from './keyboard-shortcuts/index.js';
