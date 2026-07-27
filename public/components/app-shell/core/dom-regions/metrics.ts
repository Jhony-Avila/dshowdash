// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-regions/metrics
// PURPOSE: Métricas de uso de regiões (legacy vs enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//   initPorts, getPort from ./ports.js
// EXPORTS:
//   usageMetrics — Objeto de métricas
//   trackUsage — Registra uso de região
//   trackEvent — Emite evento de telemetria
// ═══════════════════════════════════════════════════════════════
/**
 * @module DOMRegionsMetrics
 * @description Métricas de uso de regiões DOM
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { MODULE_ID } from './constants.js';
import { initPorts, getPort } from './ports.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.3.0-P2-ENTERPRISE';

export const usageMetrics = {
    legacyHits: 0,
    enterpriseHits: 0,
    misses: 0,
    byRegion: {},
    accessCount: {}
};

/**
 * Registra uso de uma região
 * @param {string} region - Nome da região
 * @param {boolean} usedLegacy - Se usou ID legado
 * @param {boolean} found - Se encontrou o elemento
 */
export function trackUsage(region: DynObj, usedLegacy: DynObj, found: DynObj) {
    if (!(usageMetrics.byRegion as DynObj)[region]) {
        (usageMetrics.byRegion as DynObj)[region] = { legacy: 0, enterprise: 0, misses: 0 };
    }
    if (!(usageMetrics.accessCount as DynObj)[region]) {
        (usageMetrics.accessCount as DynObj)[region] = 0;
    }
    
    (usageMetrics.accessCount as DynObj)[region]++;
    
    if (!found) {
        usageMetrics.misses++;
        (usageMetrics.byRegion as DynObj)[region].misses++;
    } else if (usedLegacy) {
        usageMetrics.legacyHits++;
        (usageMetrics.byRegion as DynObj)[region].legacy++;
    } else {
        usageMetrics.enterpriseHits++;
        (usageMetrics.byRegion as DynObj)[region].enterprise++;
    }
}

/**
 * Emite evento de telemetria
 * @param {string} event - Nome do evento
 * @param {Object} data - Dados do evento
 */
export function trackEvent(event: string, data: DynObj) {
    if (!data) data = {};
    initPorts();
    try {
        const telemetry = getPort('telemetry');
        if (telemetry && telemetry.event) {
            telemetry.event(`${MODULE_ID}:${event}`, data);
        }
    } catch (e) {
        // Silently ignore
    }
}
