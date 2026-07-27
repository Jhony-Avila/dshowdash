// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/breakpoints
// PURPOSE: Gerenciamento de breakpoints responsivos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BREAKPOINTS, LAYOUT_POLICIES from ./constants.js
//   currentBreakpoint, previousBreakpoint, metrics from ./state.js
//   notifyListeners, getViewportWidth from ./helpers.js
//   applyLayoutPolicy from ./policies.js
// EXPORTS:
//   handleBreakpointChange — Processa mudança de breakpoint
//   getCurrentBreakpoint — Retorna breakpoint atual
//   getBreakpointInfo — Retorna info do breakpoint atual
//   getBreakpoints — Retorna todos os breakpoints
//   getCurrentPolicy — Retorna policy atual
//   reapplyPolicy — Reaplica policy forçadamente
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterBreakpoints
 * @description Gerenciamento de breakpoints de viewport
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { BREAKPOINTS, LAYOUT_POLICIES } from './constants.js';
import { currentBreakpoint, previousBreakpoint, metrics } from './state.js';
import { notifyListeners, getViewportWidth } from './helpers.js';
import { applyLayoutPolicy } from './policies.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.breakpoints';

/**
 * Processa mudança de breakpoint
 * @param {string} newBreakpoint - Novo breakpoint
 * @param {Object} [options] - Opções
 * @returns {boolean} Se houve mudança
 */
export function handleBreakpointChange(newBreakpoint: DynObj, options: DynObj) {
    if (newBreakpoint === currentBreakpoint.value) return false;
    
    previousBreakpoint.value = currentBreakpoint.value;
    currentBreakpoint.value = newBreakpoint;
    metrics.breakpointChanges++;
    metrics.lastChangeAt = Date.now();
    
    applyLayoutPolicy(newBreakpoint, options);
    
    notifyListeners('breakpoint-change', {
        previous: previousBreakpoint.value,
        current: currentBreakpoint.value,
        breakpoint: (BREAKPOINTS as DynObj)[currentBreakpoint.value],
        viewport: getViewportWidth()
    });
    
    return true;
}

export function getCurrentBreakpoint() {
    return currentBreakpoint.value;
}

export function getBreakpointInfo() {
    return currentBreakpoint.value
        ? Object.assign({}, (BREAKPOINTS as DynObj)[currentBreakpoint.value], { key: currentBreakpoint.value })
        : null;
}

export function getBreakpoints() {
    return Object.assign({}, BREAKPOINTS);
}

export function getCurrentPolicy() {
    return currentBreakpoint.value
        ? Object.assign({}, (LAYOUT_POLICIES as DynObj)[currentBreakpoint.value])
        : null;
}

export function reapplyPolicy(options: DynObj) {
    if (currentBreakpoint.value) {
        applyLayoutPolicy(currentBreakpoint.value, Object.assign({ force: true }, options || {}));
    }
}
