// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/system/detection
// PURPOSE: Detecção de preferências de acessibilidade do sistema
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PRESETS from ../constants.js
//   activePresets from ../state.js
//   enable from ../presets/manager.js
// EXPORTS:
//   detectSystemPreferences — Detecta preferências do SO
//   applySystemPreferences — Aplica presets baseado no SO
// BROWSER APIs: window.matchMedia
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsSystemDetection
 * @description Detecção automática de preferências do sistema
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { PRESETS } from '../constants.js';
import { activePresets } from '../state.js';
import { enable } from '../presets/manager.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.system.detection';

/**
 * Detecta preferências de acessibilidade do sistema
 * @returns {Object} Preferências detectadas
 */
export function detectSystemPreferences() {
    const prefs = {
        reducedMotion: false,
        highContrast: false,
        darkMode: false
    };
    
    if (typeof window === 'undefined') return prefs;
    
    if (window.matchMedia) {
        prefs.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        prefs.highContrast = window.matchMedia('(prefers-contrast: more)').matches;
        prefs.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return prefs;
}

/**
 * Aplica presets baseado nas preferências do sistema
 * @returns {Object} Resultado { ok, applied, systemPrefs }
 */
export function applySystemPreferences() {
    const prefs = detectSystemPreferences();
    const applied = [];
    
    if (prefs.reducedMotion && !activePresets.has(PRESETS.REDUCED_MOTION)) {
        enable(PRESETS.REDUCED_MOTION);
        applied.push(PRESETS.REDUCED_MOTION);
    }
    
    if (prefs.highContrast && !activePresets.has(PRESETS.HIGH_CONTRAST)) {
        enable(PRESETS.HIGH_CONTRAST);
        applied.push(PRESETS.HIGH_CONTRAST);
    }
    
    return { ok: true, applied, systemPrefs: prefs };
}
