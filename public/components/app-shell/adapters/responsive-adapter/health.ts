// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/health
// PURPOSE: Health check e métricas do Responsive Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, BREAKPOINTS from ./constants.js
//   currentBreakpoint, previousBreakpoint, initialized, enabled,
//   autoApplyPolicies, listeners, metrics from ./state.js
//   getViewportWidth from ./helpers.js
//   getBreakpointInfo, getCurrentPolicy from ./breakpoints.js
//   isMobile, isTablet, isDesktop from ./device.js
//   getUserOverrides from ./overrides.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterHealth
 * @description Health e métricas do adapter responsivo
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, BREAKPOINTS } from './constants.js';
import { currentBreakpoint, previousBreakpoint, initialized, enabled, autoApplyPolicies, listeners, metrics } from './state.js';
import { getViewportWidth } from './helpers.js';
import { getBreakpointInfo, getCurrentPolicy } from './breakpoints.js';
import { isMobile, isTablet, isDesktop } from './device.js';
import { getUserOverrides } from './overrides.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return Object.assign({}, metrics);
}

export function healthCheck() {
    const checks = {
        initialized: initialized.value,
        enabled: enabled.value,
        hasBreakpoint: !!currentBreakpoint.value,
        noErrors: metrics.errors === 0
    };
    
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let i = 0; i < checkKeys.length; i++) {
        if ((checks as DynObj)[checkKeys[i]]) passed++;
    }
    const total = checkKeys.length;
    
    return {
        status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
        score: `${passed}/${total}`,
        checks,
        currentBreakpoint: currentBreakpoint.value,
        breakpointInfo: getBreakpointInfo(),
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop(),
        viewport: getViewportWidth(),
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        initialized: initialized.value,
        enabled: enabled.value,
        autoApplyPolicies: autoApplyPolicies.value,
        currentBreakpoint: currentBreakpoint.value,
        previousBreakpoint: previousBreakpoint.value,
        breakpointInfo: getBreakpointInfo(),
        currentPolicy: getCurrentPolicy(),
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop(),
        viewport: getViewportWidth(),
        userOverrides: getUserOverrides(),
        listenerCount: listeners.length,
        metrics: getMetrics(),
        breakpoints: BREAKPOINTS,
        timestamp: Date.now()
    };
}
