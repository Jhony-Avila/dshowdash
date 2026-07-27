// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/constants
// PURPOSE: Constantes de breakpoints e políticas de layout
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   BREAKPOINTS — Definições de breakpoints (frozen)
//   LAYOUT_POLICIES — Políticas por breakpoint (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterConstants
 * @description Breakpoints e políticas de layout responsivo
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-responsive-adapter';

export const BREAKPOINTS = Object.freeze({
    xs: { min: 0, max: 575, name: 'extra-small', device: 'mobile-portrait' },
    sm: { min: 576, max: 767, name: 'small', device: 'mobile-landscape' },
    md: { min: 768, max: 991, name: 'medium', device: 'tablet' },
    lg: { min: 992, max: 1199, name: 'large', device: 'desktop' },
    xl: { min: 1200, max: 1399, name: 'extra-large', device: 'desktop-large' },
    xxl: { min: 1400, max: Infinity, name: 'extra-extra-large', device: 'desktop-wide' }
});

export const LAYOUT_POLICIES = Object.freeze({
    xs: {
        sidebar: { visible: false, collapsed: true },
        navRail: { visible: false },
        footer: { visible: true },
        header: { visible: true, compact: true }
    },
    sm: {
        sidebar: { visible: false, collapsed: true },
        navRail: { visible: true },
        footer: { visible: true },
        header: { visible: true, compact: true }
    },
    md: {
        sidebar: { visible: false, collapsed: true },
        navRail: { visible: true },
        footer: { visible: true },
        header: { visible: true, compact: false }
    },
    lg: {
        sidebar: { visible: true, collapsed: false },
        navRail: { visible: true },
        footer: { visible: true },
        header: { visible: true, compact: false }
    },
    xl: {
        sidebar: { visible: true, collapsed: false },
        navRail: { visible: true },
        footer: { visible: true },
        header: { visible: true, compact: false }
    },
    xxl: {
        sidebar: { visible: true, collapsed: false },
        navRail: { visible: true },
        footer: { visible: true },
        header: { visible: true, compact: false }
    }
});
