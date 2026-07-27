// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/helpers
// PURPOSE: Helpers para detecção de breakpoint e notificação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BREAKPOINTS from ./constants.js
//   listeners, metrics from ./state.js
// EXPORTS:
//   notifyListeners — Notifica todos os listeners
//   getViewportWidth — Retorna largura do viewport
//   detectBreakpoint — Detecta breakpoint atual
// BROWSER APIs: window.innerWidth
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterHelpers
 * @description Utilitários para responsividade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { BREAKPOINTS } from './constants.js';
import { listeners, metrics } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.helpers';

/**
 * Notifica todos os listeners de um evento
 * @param {string} event - Tipo do evento
 * @param {*} data - Dados do evento
 */
export function notifyListeners(event: string, data: DynObj) {
    for (let i = 0; i < listeners.length; i++) {
        try {
            listeners[i]({ type: event, data, timestamp: Date.now() });
        } catch (e) {
            metrics.errors++;
        }
    }
}

/**
 * Retorna largura do viewport
 * @returns {number} Largura em pixels
 */
export function getViewportWidth() {
    if (typeof window === 'undefined') return 1200;
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}

/**
 * Detecta breakpoint atual baseado na largura
 * @param {number} width - Largura (opcional, usa viewport)
 * @returns {string} Nome do breakpoint
 */
export function detectBreakpoint(width?: number) {
    if (width === undefined) width = getViewportWidth();
    
    const keys = Object.keys(BREAKPOINTS);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const bp = (BREAKPOINTS as DynObj)[key];
        if (width >= bp.min && width <= bp.max) {
            return key;
        }
    }
    return 'lg';
}
