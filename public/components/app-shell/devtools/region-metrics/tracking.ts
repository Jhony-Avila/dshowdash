// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-metrics/tracking
// PURPOSE: Funções de tracking de métricas por região
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   METRIC_TYPES from ./constants.js
//   isEnabled, getConfig, getRegionStore, getGlobalMetrics, getTimers, addSample, notifySubscribers from ./state.js
// EXPORTS:
//   trackRender — Registra tempo de render
//   trackUpdate — Registra atualização
//   trackVisibility — Registra mudança de visibilidade
//   trackInteraction — Registra interação
//   trackError — Registra erro
//   trackLoad — Registra tempo de load
//   startTimer, endTimer — Helpers de timer
// BROWSER APIs: performance.now
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionMetricsTracking
 * @description Tracking de métricas
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { METRIC_TYPES } from './constants.js';
import {

    isEnabled,
    getConfig,
    getRegionStore,
    getGlobalMetrics,
    getTimers,
    addSample,
    notifySubscribers
} from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.1.0-AAA';
export const MODULE_ID = 'app-shell.devtools.region-metrics.tracking';

function updateAggregated(region: DynObj, type: DynObj, duration: number) {
    const store = getRegionStore();
    if (!(store as DynObj)[region]) return;
    const agg = (store as DynObj)[region].aggregated;

    switch (type) {
        case METRIC_TYPES.RENDER:
            agg.renderCount++;
            agg.totalRenderTime += duration || 0;
            agg.avgRenderTime = agg.totalRenderTime / agg.renderCount;
            break;
        case METRIC_TYPES.UPDATE:
            agg.updateCount++;
            agg.totalUpdateTime += duration || 0;
            agg.avgUpdateTime = agg.totalUpdateTime / agg.updateCount;
            break;
        case METRIC_TYPES.VISIBILITY:
            agg.visibilityChanges++;
            break;
        case METRIC_TYPES.INTERACTION:
            agg.interactionCount++;
            break;
        case METRIC_TYPES.ERROR:
            agg.errorCount++;
            getGlobalMetrics().totalErrors++;
            break;
        case METRIC_TYPES.LOAD:
            agg.loadCount++;
            break;
    }
}

function _track(metricType: DynObj, configKey: string, region: DynObj, sampleData?: DynObj, duration?: number) {
    if (!isEnabled()) return;
    const config = getConfig();
    if (configKey && !(config as DynObj)[configKey]) return;

    const sample = Object.assign({ type: metricType, timestamp: Date.now() }, sampleData);

    const typeKey = metricType === 'visibility' ? 'visibility' : metricType;
    addSample(region, typeKey, sample);
    // @ts-expect-error strict migration — TS2345
    updateAggregated(region, metricType, duration);

    notifySubscribers({
        type: 'metric',
        metricType,
        region,
        sample
    });
}

export function trackRender(region: DynObj, duration: number, context: DynObj) {
    _track(METRIC_TYPES.RENDER, 'trackRenderTime', region, { duration, context: context || {} }, duration);
}

export function trackUpdate(region: DynObj, duration: number, context: DynObj) {
    _track(METRIC_TYPES.UPDATE, 'trackUpdates', region, { duration, context: context || {} }, duration);
}

export function trackVisibility(region: DynObj, visible: boolean, context: DynObj) {
    _track(METRIC_TYPES.VISIBILITY, 'trackVisibility', region, { visible, context: context || {} });
}

export function trackInteraction(region: DynObj, interactionType: DynObj, context: DynObj) {
    _track(METRIC_TYPES.INTERACTION, 'trackInteractions', region, { interactionType, context: context || {} });
}

export function trackError(region: DynObj, error: DynObj, context: DynObj) {
    _track(METRIC_TYPES.ERROR, 'trackErrors', region, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        context: context || {}
    });
}

export function trackLoad(region: DynObj, duration: number, context: DynObj) {
    // @ts-expect-error strict migration — TS2345
    _track(METRIC_TYPES.LOAD, null, region, { duration, context: context || {} }, duration);
}

export function startTimer(region: DynObj, type: DynObj) {
    const timers = getTimers();
    const timerId = `${region}:${type}:${Date.now()}`;
    (timers as DynObj)[timerId] = {
        region,
        type,
        startTime: performance.now()
    };
    return timerId;
}

export function endTimer(timerId: string, context: DynObj) {
    const timers = getTimers();
    const timer = (timers as DynObj)[timerId];
    if (!timer) return 0;

    const duration = performance.now() - timer.startTime;
    delete (timers as DynObj)[timerId];

    switch (timer.type) {
        case 'render': trackRender(timer.region, duration, context); break;
        case 'update': trackUpdate(timer.region, duration, context); break;
        case 'load':   trackLoad(timer.region, duration, context);   break;
    }

    return duration;
}
