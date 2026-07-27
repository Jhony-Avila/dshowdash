// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.4.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/helpers
// PURPOSE: Funcoes utilitarias para o Header (error handling, UARPS)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log from ./logger.js
// PROVIDES:
//   getErrorMessage(error) — extrai mensagem de erro de forma segura
//   ensureUARPSRegion(container) — aplica data-uarps-region (P0 contract)
//   healthCheck() — status de saude do modulo
//   info() — informacoes completas do modulo
// ═══════════════════════════════════════════════════════════════
// Header - Helpers
// @version 6.4.0-ES6
// @changelog v6.4.0-ES6 - Task 10.1 B03: var → const/let
'use strict';

import { log } from './logger.js';

export const VERSION = '6.4.0-ES6';
export const MODULE_ID = 'header/core/helpers';

let _metrics = { getErrorMessageCalls: 0, ensureUARPSCalls: 0, lastCallAt: (null as unknown|null) };

// Helper to extract error message safely
export function getErrorMessage(error: unknown) {
    _metrics.getErrorMessageCalls++;
    _metrics.lastCallAt = Date.now();
    if (!error) return 'Erro desconhecido (undefined)';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message || error.name || 'Error sem mensagem';
    // @ts-expect-error TS migration - TS2339
    if (typeof error.message === 'string') return error.message;
    if (typeof error.toString === 'function') {
        const str = error.toString();
        if (str !== '[object Object]') return str;
    }
    try { return JSON.stringify(error); }
    catch (e) { return 'Erro nao serializavel'; }
}

// P0 CONTRACT: Ensure UARPS region on container (idempotent)
export function ensureUARPSRegion(container: HTMLElement|null) {
    _metrics.ensureUARPSCalls++;
    _metrics.lastCallAt = Date.now();
    if (!container) return;
    const region = container.closest('#shell-header-region') || container;
    if (!region.hasAttribute('data-uarps-region')) {
        region.setAttribute('data-uarps-region', 'region:app:header');
        log('info', 'P0: data-uarps-region aplicado ao header');
    }
}

export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { _metrics.getErrorMessageCalls = 0; _metrics.ensureUARPSCalls = 0; _metrics.lastCallAt = null; }

export function healthCheck() {
    const checks = { getErrorMessageAvailable: typeof getErrorMessage === 'function', ensureUARPSAvailable: typeof ensureUARPSRegion === 'function' };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), healthCheck: healthCheck() };
}

export default { VERSION, MODULE_ID, getErrorMessage, ensureUARPSRegion, getMetrics, resetMetrics, healthCheck, info };
