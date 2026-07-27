// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/device
// PURPOSE: Funções de detecção de tipo de dispositivo
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   currentBreakpoint from ./state.js
// EXPORTS:
//   isMobile — Retorna true se xs ou sm
//   isTablet — Retorna true se md
//   isDesktop — Retorna true se lg, xl ou xxl
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterDevice
 * @description Detecção de tipo de dispositivo baseada em breakpoint
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { currentBreakpoint } from './state.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.device';

/**
 * Verifica se é dispositivo mobile
 * @returns {boolean}
 */
export function isMobile() {
    return currentBreakpoint.value === 'xs' || currentBreakpoint.value === 'sm';
}

/**
 * Verifica se é tablet
 * @returns {boolean}
 */
export function isTablet() {
    return currentBreakpoint.value === 'md';
}

/**
 * Verifica se é desktop
 * @returns {boolean}
 */
export function isDesktop() {
    return currentBreakpoint.value === 'lg' || 
           currentBreakpoint.value === 'xl' || 
           currentBreakpoint.value === 'xxl';
}
