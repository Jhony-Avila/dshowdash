// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-integration/core/theme-api
// PURPOSE: API pública de controle de temas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   THEMES from ../constants.js
//   getCurrentTheme, setCurrentTheme, getResolvedTheme, setResolvedTheme,
//   getSystemPreference, getListeners, incrementMetric from ../state.js
//   resolveTheme, applyTheme from ./theme-engine.js
//   LayoutPersistence from ../../../state/layout-persistence.js
// EXPORTS:
//   getTheme, getResolved — Consulta de tema
//   setTheme, toggleTheme, useSystemTheme — Controle de tema
//   isDarkMode, isLightMode, isSystemTheme — Verificações
//   getSystemPref — Preferência do sistema
// ═══════════════════════════════════════════════════════════════
/**
 * @module ThemeIntegrationCoreThemeAPI
 * @description API pública de controle de temas
 * @version 1.2.1-IMPORT-FIX-AAA
 * @since 2025-02-02
 */
'use strict';

import { THEMES } from '../constants.js';
import {
    getCurrentTheme,
    setCurrentTheme,
    getResolvedTheme,
    setResolvedTheme,
    getSystemPreference,
    getListeners,
    incrementMetric
} from '../state.js';
import { resolveTheme, applyTheme } from './theme-engine.js';
import LayoutPersistence from '../../../state/layout-persistence.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.3.0-FIX-MISSING-EXPORTS';
export const MODULE_ID = 'app-shell.adapters.theme-integration.core.theme-api';

function _notifyListeners(event: string, data: DynObj) {
    const listeners = getListeners();
    for (let i = 0; i < listeners.length; i++) {
        try {
            listeners[i]({ type: event, data, timestamp: Date.now() });
        } catch (e) {
            incrementMetric('errors');
        }
    }
}

export function getTheme() {
    return getCurrentTheme();
}

export function getResolved() {
    return getResolvedTheme();
}

export function setTheme(theme: DynObj, options?: DynObj) {
    options = options || {};
    const persist = options.persist !== false;
    
    if (theme !== THEMES.LIGHT && theme !== THEMES.DARK && theme !== THEMES.SYSTEM) {
        incrementMetric('errors');
        return false;
    }
    
    const oldTheme = getCurrentTheme();
    const oldResolved = getResolvedTheme();
    
    setCurrentTheme(theme);
    const newResolved = resolveTheme(theme);
    setResolvedTheme(newResolved);
    
    applyTheme(newResolved);
    
    if (persist) {
        LayoutPersistence.setThemeMode(theme);
    }
    
    incrementMetric('themeChanges');
    _notifyListeners('theme-change', {
        oldTheme,
        newTheme: theme,
        oldResolved,
        newResolved
    });
    
    return true;
}

export function toggleTheme() {
    const resolved = getResolvedTheme();
    const newTheme = resolved === 'light' ? THEMES.DARK : THEMES.LIGHT;
    setTheme(newTheme);
    return newTheme;
}

export function useSystemTheme() {
    return setTheme(THEMES.SYSTEM);
}

export function isDarkMode() {
    return getResolvedTheme() === 'dark';
}

export function isLightMode() {
    return getResolvedTheme() === 'light';
}

export function isSystemTheme() {
    return getCurrentTheme() === THEMES.SYSTEM;
}

export function getSystemPref() {
    return getSystemPreference();
}

export default {
    getTheme, getResolved, setTheme, toggleTheme, useSystemTheme,
    isDarkMode, isLightMode, isSystemTheme, getSystemPref
};
