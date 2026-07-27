// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/settings/manager
// PURPOSE: Gerenciamento de configurações customizadas de a11y
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   customSettings, appliedCssVars, subscribers, incrementMetric from ../state.js
//   saveToStorage from ../storage/persistence.js
// EXPORTS:
//   setSetting — Define configuração
//   getSetting — Retorna configuração
//   getAllSettings — Retorna todas as configurações
//   removeSetting — Remove configuração
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsSettingsManager
 * @description Gerenciamento de settings customizados
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { customSettings, appliedCssVars, subscribers, incrementMetric } from '../state.js';
import { saveToStorage } from '../storage/persistence.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.settings.manager';

function notifySubscribers(event: DynObj) {
    for (let i = 0; i < subscribers.length; i++) {
        try { subscribers[i](event); } catch (e) {}
    }
}

/**
 * Define uma configuração
 * @param {string} key - Chave
 * @param {*} value - Valor
 * @returns {Object} { ok: true }
 */
export function setSetting(key: string, value: DynObj) {
    (customSettings as DynObj)[key] = value;
    incrementMetric('customizations');
    
    // CSS Variables são aplicadas diretamente
    if (key.startsWith('--')) {
        document.documentElement.style.setProperty(key, value);
        (appliedCssVars as DynObj)[key] = value;
    }
    
    saveToStorage();
    
    notifySubscribers({
        type: 'setting-changed',
        key,
        value,
        timestamp: Date.now()
    });
    
    return { ok: true };
}

export function getSetting(key: string) {
    return (customSettings as DynObj)[key];
}

export function getAllSettings() {
    return Object.assign({}, customSettings);
}

/**
 * Remove uma configuração
 * @param {string} key - Chave
 * @returns {boolean} Sucesso
 */
export function removeSetting(key: string) {
    if (key in customSettings) {
        delete (customSettings as DynObj)[key];
        
        if (key.startsWith('--')) {
            document.documentElement.style.removeProperty(key);
            delete (appliedCssVars as DynObj)[key];
        }
        
        saveToStorage();
        return true;
    }
    return false;
}
