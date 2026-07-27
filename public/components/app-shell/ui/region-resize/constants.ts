// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-resize/constants
// PURPOSE: Constantes e configuração de resize por região
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   RESIZE_CONFIGS — Configurações de resize por região
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionResizeConstants
 * @description Configuração de resize para regiões do shell
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-region-resize';

export const RESIZE_CONFIGS = {
    sidebar: {
        property: 'width',
        min: 200,
        max: 500,
        default: 280,
        unit: 'px',
        cssVar: '--dsd-sidebar-width',
        persist: true,
        persistKey: 'sidebar.width'
    },
    footer: {
        property: 'height',
        min: 32,
        max: 120,
        default: 48,
        unit: 'px',
        cssVar: '--dsd-footer-height',
        persist: true,
        persistKey: 'footer.height'
    },
    'nav-rail': {
        property: 'width',
        min: 48,
        max: 280,
        default: 64,
        unit: 'px',
        cssVar: '--dsd-navrail-width',
        persist: false
    },
    header: {
        property: 'height',
        min: 48,
        max: 80,
        default: 56,
        unit: 'px',
        cssVar: '--dsd-header-height',
        persist: false
    }
};
