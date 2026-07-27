// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: utils/lazy-loader-wrapper
// PURPOSE: Wrapper de compatibilidade retroativa
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./lazy-loader/index.js
// EXPORTS: * (all named + default export)
// DEPRECATION: Importar diretamente de './lazy-loader/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module LazyLoaderWrapper
 * @description Compatibilidade retroativa para lazy-loader modularizado
 * @version 1.0.0-AAA
 * @since 2025-02-02
 * @deprecated Use './lazy-loader/index.js' diretamente
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.lazy-loader';

export * from './lazy-loader/index.js';
export { default } from './lazy-loader/index.js';
