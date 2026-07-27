// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/region-metrics/constants
// PURPOSE: Constantes para métricas de região
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   METRIC_TYPES — Enum de tipos de métrica (frozen)
//   REGIONS — Lista de regiões monitoradas
//   createEmptyRegionData — Factory para dados de região
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionMetricsConstants
 * @description Constantes para sistema de métricas de região
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-AAA';
export const MODULE_ID = 'app-shell-region-metrics';

export const METRIC_TYPES = Object.freeze({
    RENDER: 'render',
    UPDATE: 'update',
    VISIBILITY: 'visibility',
    RESIZE: 'resize',
    INTERACTION: 'interaction',
    ERROR: 'error',
    LOAD: 'load'
});

export const REGIONS = ['header', 'nav-rail', 'sidebar', 'main', 'footer', 'overlay'];

/**
 * Cria estrutura vazia de dados para região
 * @returns {Object} Estrutura de dados
 */
export function createEmptyRegionData() {
    return {
        renders: [] as DynObj,
        updates: [] as DynObj,
        visibility: [] as DynObj,
        interactions: [] as DynObj,
        errors: [] as DynObj,
        loads: [] as DynObj,
        aggregated: {
            renderCount: 0,
            updateCount: 0,
            visibilityChanges: 0,
            interactionCount: 0,
            errorCount: 0,
            loadCount: 0,
            avgRenderTime: 0,
            avgUpdateTime: 0,
            totalRenderTime: 0,
            totalUpdateTime: 0,
            lastActivity: null as DynObj
        }
    };
}
