// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters/theme-integration-wrapper
// PURPOSE: Wrapper de compatibilidade retroativa
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./theme-integration/index.js
// EXPORTS: * (all named + default export)
// DEPRECATION: Importar diretamente de './theme-integration/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module ThemeIntegrationWrapper
 * @description Compatibilidade retroativa para theme-integration modularizado
 * @version 1.0.0-AAA
 * @since 2025-02-02
 * @deprecated Use './theme-integration/index.js' diretamente
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.theme-integration';

export * from './theme-integration/index.js';
export { default } from './theme-integration/index.js';
