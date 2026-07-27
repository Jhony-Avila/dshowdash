// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-BLACK-BG)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-integration/diagnostics/health
// PURPOSE: Health check e diagnóstico do sistema de temas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, THEMES from ../constants.js
//   isInitialized, getCurrentTheme, getResolvedTheme, getSystemPreference,
//   getRegionThemes, getListeners, getMetrics from ../state.js
//   getThemeVariables from ../variables/css-variables.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module ThemeIntegrationDiagnosticsHealth
 * @description Health e diagnóstico de temas
 * @version 1.2.0-BLACK-BG-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, THEMES } from '../constants.js';
import {
    isInitialized,
    getCurrentTheme,
    getResolvedTheme,
    getSystemPreference,
    getRegionThemes,
    getListeners,
    getMetrics as _getMetrics
} from '../state.js';
import { getThemeVariables } from '../variables/css-variables.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return _getMetrics();
}

export function healthCheck() {
    const currentTheme = getCurrentTheme();
    const resolvedTheme = getResolvedTheme();
    const metrics = getMetrics();
    const regionThemes = getRegionThemes();
    
    const checks = {
        initialized: isInitialized(),
        hasTheme: !!currentTheme,
        hasResolved: !!resolvedTheme,
        noErrors: metrics.errors === 0
    };
    
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let i = 0; i < checkKeys.length; i++) {
        if ((checks as DynObj)[checkKeys[i]]) passed++;
    }
    const total = checkKeys.length;
    
    let status = 'UNHEALTHY';
    if (passed === total) status = 'HEALTHY';
    else if (passed >= 2) status = 'DEGRADED';
    
    return {
        status,
        score: `${passed}/${total}`,
        checks,
        currentTheme,
        resolvedTheme,
        systemPreference: getSystemPreference(),
        isDarkMode: resolvedTheme === 'dark',
        regionOverrides: Object.keys(regionThemes).length,
        metrics,
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    const currentTheme = getCurrentTheme();
    const resolvedTheme = getResolvedTheme();
    
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        initialized: isInitialized(),
        currentTheme,
        resolvedTheme,
        systemPreference: getSystemPreference(),
        isDarkMode: resolvedTheme === 'dark',
        isLightMode: resolvedTheme === 'light',
        isSystemTheme: currentTheme === THEMES.SYSTEM,
        regionThemes: getRegionThemes(),
        availableThemes: THEMES,
        themeVariables: getThemeVariables(),
        listenerCount: getListeners().length,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export default {
    getMetrics, healthCheck, info
};
