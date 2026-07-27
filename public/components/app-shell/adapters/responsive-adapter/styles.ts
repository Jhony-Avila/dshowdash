// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/styles
// PURPOSE: Injeção de CSS responsivo para layout
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   injectStyles — Injeta CSS responsivo no document
// BROWSER APIs: document.createElement, document.head
// SIDE EFFECTS: Auto-executa injectStyles() no load
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterStyles
 * @description CSS responsivo para shell regions
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.styles';

/**
 * Injeta estilos CSS responsivos
 */
export function injectStyles() {
    if (typeof document === 'undefined') return;
    
    const styleId = 'dsd-responsive-styles';
    if (document.getElementById(styleId)) return;
    
    const css = [
        '/* Responsive Layout Manager CSS */',
        '.dsd-shell__region--compact {',
        '  padding: 0.5rem !important;',
        '}',
        '',
        '/* Mobile adjustments */',
        '.dsd-mobile .dsd-shell__region--sidebar {',
        '  position: fixed;',
        '  left: 0;',
        '  top: 0;',
        '  bottom: 0;',
        '  z-index: 1000;',
        '  transform: translateX(-100%);',
        '  transition: transform 0.3s ease;',
        '}',
        '.dsd-mobile .dsd-shell__region--sidebar:not(.dsd-region--hidden) {',
        '  transform: translateX(0);',
        '}',
        '',
        '/* Tablet adjustments */',
        '.dsd-tablet .dsd-shell__region--main {',
        '  margin-left: 0;',
        '}',
        '',
        '@media (prefers-reduced-motion: reduce) {',
        '  .dsd-mobile .dsd-shell__region--sidebar {',
        '    transition: none !important;',
        '  }',
        '}'
    ].join('\n');
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
}

// Auto-inject
injectStyles();
