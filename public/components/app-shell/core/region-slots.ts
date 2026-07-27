// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core/region-slots-wrapper
// PURPOSE: Wrapper de compatibilidade retroativa
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./region-slots/index.js
// EXPORTS: * (all named + default export)
// DEPRECATION: Importar diretamente de './region-slots/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionSlotsWrapper
 * @description Compatibilidade retroativa para region-slots modularizado
 * @version 1.0.0-AAA
 * @since 2025-02-02
 * @deprecated Use './region-slots/index.js' diretamente
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-slots';

export * from './region-slots/index.js';
export { default } from './region-slots/index.js';
