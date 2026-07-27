// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/storage/persistence
// PURPOSE: Persistência de presets em localStorage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   activePresets, customSettings, config from ../state.js
// EXPORTS:
//   loadFromStorage — Carrega presets do localStorage
//   saveToStorage — Salva presets no localStorage
// BROWSER APIs: localStorage
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsStoragePersistence
 * @description Persistência de presets de acessibilidade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { activePresets, customSettings, config } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.storage.persistence';

/**
 * Carrega presets do localStorage
 */
export function loadFromStorage() {
    if (!config.persistPresets) return;
    
    try {
        const data = localStorage.getItem(config.storageKey);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.presets) {
                parsed.presets.forEach((p: DynObj) => {
                    activePresets.add(p);
                });
            }
            if (parsed.customSettings) {
                Object.assign(customSettings, parsed.customSettings);
            }
        }
    } catch (e) {
        // Silently ignore storage errors
    }
}

/**
 * Salva presets no localStorage
 */
export function saveToStorage() {
    if (!config.persistPresets) return;
    
    try {
        const data = {
            presets: Array.from(activePresets),
            customSettings,
            savedAt: Date.now()
        };
        localStorage.setItem(config.storageKey, JSON.stringify(data));
    } catch (e) {
        // Silently ignore storage errors
    }
}
