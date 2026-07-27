// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-visibility/helpers
// PURPOSE: Helpers e injeção de CSS para visibilidade de regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   TRANSITION_DURATION — Duração padrão de transição
//   HIDDEN_CLASS, HIDING_CLASS, SHOWING_CLASS — Classes CSS
//   prefersReducedMotion — Detecta preferência de reduced motion
//   getDuration — Retorna duração ajustada
//   injectCSS — Injeta estilos no document
// BROWSER APIs: window.matchMedia, document.createElement
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionVisibilityHelpers
 * @description Helpers e CSS para transições de visibilidade
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-visibility.helpers';

// ── Constants ───────────────────────────────────────────────────────

export const TRANSITION_DURATION = 300;
export const HIDDEN_CLASS = 'dsd-region--hidden';
export const HIDING_CLASS = 'dsd-region--hiding';
export const SHOWING_CLASS = 'dsd-region--showing';

// ── Helpers ─────────────────────────────────────────────────────────

export function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    return mq && mq.matches;
}

export function getDuration(customDuration: number) {
    if (prefersReducedMotion()) return 0;
    return typeof customDuration === 'number' ? customDuration : TRANSITION_DURATION;
}

// ── CSS Injection ───────────────────────────────────────────────────

export function injectCSS() {
    if (typeof document === 'undefined') return;
    
    const styleId = 'dsd-region-visibility-styles';
    if (document.getElementById(styleId)) return;
    
    const css = [
        '.dsd-region--hidden {',
        '  display: none !important;',
        '  visibility: hidden !important;',
        '}',
        '.dsd-region--hiding {',
        '  opacity: 0;',
        `  transition: opacity ${TRANSITION_DURATION}ms ease-out;`,
        '  pointer-events: none;',
        '}',
        '.dsd-region--showing {',
        '  opacity: 1;',
        `  transition: opacity ${TRANSITION_DURATION}ms ease-in;`,
        '}',
        '@media (prefers-reduced-motion: reduce) {',
        '  .dsd-region--hiding,',
        '  .dsd-region--showing {',
        '    transition: none !important;',
        '  }',
        '}'
    ].join('\n');
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
}
