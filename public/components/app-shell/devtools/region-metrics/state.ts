// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-metrics/state
// PURPOSE: Estado centralizado do sistema de métricas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   REGIONS, createEmptyRegionData from ./constants.js
// EXPORTS:
//   getRegionStore — Store de métricas por região
//   getSubscribers — Lista de subscribers
//   isEnabled, setEnabled — Estado habilitado
//   getTrackingStartedAt, setTrackingStartedAt — Timestamp de início
//   getTimers — Timers ativos
//   getConfig, configure — Configuração
//   getGlobalMetrics — Métricas globais
//   notifySubscribers — Notifica subscribers
//   addSample — Adiciona amostra
//   resetAll, resetRegion — Reset
//   addSubscriber — Adiciona subscriber
//   initRegionMetrics — Inicializa métricas
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionMetricsState
 * @description Estado de métricas
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { REGIONS, createEmptyRegionData } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.region-metrics.state';

let _regionMetrics = {};
const _subscribers: DynObj[] = [];
let _enabled = true;
let _trackingStartedAt: DynObj = null;
const _timers = {};

const _config = {
    maxSamplesPerRegion: 100,
    trackRenderTime: true,
    trackUpdates: true,
    trackVisibility: true,
    trackInteractions: true,
    trackErrors: true,
    aggregationInterval: 60000
};

const _globalMetrics = {
    totalEvents: 0,
    totalErrors: 0,
    trackingDuration: 0
};

function initRegionMetrics() {
    for (let i = 0; i < REGIONS.length; i++) {
        (_regionMetrics as DynObj)[REGIONS[i]] = createEmptyRegionData();
    }
    _trackingStartedAt = Date.now();
}

initRegionMetrics();

function getRegionStore() { return _regionMetrics; }
function getSubscribers() { return _subscribers; }
function isEnabled() { return _enabled; }
function setEnabled(val: DynObj) { _enabled = !!val; }
function getTrackingStartedAt() { return _trackingStartedAt; }
function setTrackingStartedAt(val: DynObj) { _trackingStartedAt = val; }
function getTimers() { return _timers; }
function getConfig() { return _config; }
function getGlobalMetrics() { return _globalMetrics; }

function notifySubscribers(event: DynObj) {
    for (let i = 0; i < _subscribers.length; i++) {
        try { _subscribers[i](event); } catch (e) {}
    }
}

function addSample(region: DynObj, type: DynObj, sample: DynObj) {
    if (!(_regionMetrics as DynObj)[region]) {
        (_regionMetrics as DynObj)[region] = createEmptyRegionData();
    }

    const metrics = (_regionMetrics as DynObj)[region];
    const arr = metrics[`${type}s`] || metrics[type];

    if (arr) {
        arr.push(sample);
        if (arr.length > _config.maxSamplesPerRegion) {
            arr.shift();
        }
    }

    metrics.aggregated.lastActivity = Date.now();
    _globalMetrics.totalEvents++;
}

function resetAll() {
    initRegionMetrics();
    _globalMetrics.totalEvents = 0;
    _globalMetrics.totalErrors = 0;
    _globalMetrics.trackingDuration = 0;
}

function resetRegion(region: DynObj) {
    if ((_regionMetrics as DynObj)[region]) {
        (_regionMetrics as DynObj)[region] = createEmptyRegionData();
    }
}

function configure(options: DynObj) {
    if (options.maxSamplesPerRegion !== undefined) _config.maxSamplesPerRegion = options.maxSamplesPerRegion;
    if (options.trackRenderTime !== undefined) _config.trackRenderTime = !!options.trackRenderTime;
    if (options.trackUpdates !== undefined) _config.trackUpdates = !!options.trackUpdates;
    if (options.trackVisibility !== undefined) _config.trackVisibility = !!options.trackVisibility;
    if (options.trackInteractions !== undefined) _config.trackInteractions = !!options.trackInteractions;
    if (options.trackErrors !== undefined) _config.trackErrors = !!options.trackErrors;
}

function addSubscriber(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    _subscribers.push(callback);
    return () => {
        const idx = _subscribers.indexOf(callback);
        if (idx >= 0) _subscribers.splice(idx, 1);
    };
}

export {

    getRegionStore,
    getSubscribers,
    isEnabled,
    setEnabled,
    getTrackingStartedAt,
    setTrackingStartedAt,
    getTimers,
    getConfig,
    getGlobalMetrics,
    notifySubscribers,
    addSample,
    resetAll,
    resetRegion,
    configure,
    addSubscriber,
    initRegionMetrics
};
