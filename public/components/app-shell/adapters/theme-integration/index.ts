// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-BLACK-BG)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-integration
// PURPOSE: Entry point da integração de temas
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, THEMES
//   ./core/theme-engine.js — init, destroy
//   ./core/theme-api.js — getTheme, getResolvedTheme, setTheme, toggleTheme, useSystemTheme, isDarkMode, isLightMode, isSystemTheme, getSystemPreference
//   ./regions/region-themes.js — setRegionTheme, clearRegionTheme, getRegionTheme, getRegionThemes
//   ./variables/css-variables.js — getThemeVariable, setThemeVariable, getThemeVariables
//   ./diagnostics/health.js — getMetrics, healthCheck, info
// SIDE EFFECTS: Auto-init on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════
/**
 * @module ThemeIntegration
 * @description Integração avançada com sistema de temas
 * @version 1.2.0-BLACK-BG-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, THEMES } from './constants.js';
import { addListener, removeListener } from './state.js';
import { init, destroy } from './core/theme-engine.js';
import {
    getTheme,
    getResolved as getResolvedTheme,
    setTheme,
    toggleTheme,
    useSystemTheme,
    isDarkMode,
    isLightMode,
    isSystemTheme,
    getSystemPref as getSystemPreference
} from './core/theme-api.js';
import {
    setRegionTheme,
    clearRegionTheme,
    getRegionTheme,
    getRegionThemes
} from './regions/region-themes.js';
import {
    getThemeVariable,
    setThemeVariable,
    getThemeVariables
} from './variables/css-variables.js';
import { getMetrics, healthCheck, info } from './diagnostics/health.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function subscribe(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    addListener(callback);
    
    return () => {
        removeListener(callback);
    };
}

// Auto-init
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); });
    } else {
        init();
    }
}

// Re-exports
export { VERSION, MODULE_ID, THEMES };
export { init, destroy };
export { getTheme, getResolvedTheme, setTheme, toggleTheme, useSystemTheme };
export { isDarkMode, isLightMode, isSystemTheme, getSystemPreference };
export { setRegionTheme, clearRegionTheme, getRegionTheme, getRegionThemes };
export { getThemeVariable, setThemeVariable, getThemeVariables };
export { getMetrics, healthCheck, info };


export default {
    VERSION, MODULE_ID, THEMES,
    init, destroy,
    getTheme, getResolvedTheme, setTheme, toggleTheme, useSystemTheme,
    isDarkMode, isLightMode, isSystemTheme, getSystemPreference,
    setRegionTheme, clearRegionTheme, getRegionTheme, getRegionThemes,
    getThemeVariable, setThemeVariable, getThemeVariables,
    subscribe, getMetrics, healthCheck, info
};
