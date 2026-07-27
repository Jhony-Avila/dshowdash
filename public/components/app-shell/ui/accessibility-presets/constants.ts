// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/constants
// PURPOSE: Constantes e enums para Accessibility Presets
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   PRESETS — Enum de presets disponíveis (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsConstants
 * @description Constantes para sistema de presets de acessibilidade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-accessibility-presets';

export const PRESETS = Object.freeze({
    DEFAULT: 'default',
    HIGH_CONTRAST: 'high-contrast',
    LARGE_TEXT: 'large-text',
    REDUCED_MOTION: 'reduced-motion',
    FOCUS_VISIBLE: 'focus-visible',
    DYSLEXIA_FRIENDLY: 'dyslexia-friendly',
    LOW_VISION: 'low-vision',
    COGNITIVE: 'cognitive'
});
