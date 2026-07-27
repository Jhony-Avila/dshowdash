// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-aggregators
// PURPOSE: Sidebar Aggregators - Delegated to MetricsHub
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//
// PROVIDES:
//   AGGREGATOR_VERSION — exported value
//   AGGREGATOR_MODULE_ID — exported value
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   aggregate — exported value
//   getSourceMetrics — exported value
//   getMetricsByCategory — exported value
//   listSources — exported value
//   takeSnapshot — exported value
//   getSnapshots — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import * as MetricsHub from '../telemetry/metrics-hub.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const AGGREGATOR_VERSION = '6.1.0-P2-ENTERPRISE';
export const AGGREGATOR_MODULE_ID = 'sidebar-aggregators';

// Backward compatible getMetrics - now delegates to MetricsHub
export function getMetrics(instance: DynObj) {
  // Get aggregated metrics from MetricsHub
  const hubMetrics = MetricsHub.aggregate().data || {};
  
  // Add instance-specific metrics if available
  const instanceMetrics = instance?.getMetrics?.() || {};
  
  return {
    sidebar: instanceMetrics,
    hub: hubMetrics.hub || {},
    sources: hubMetrics.sources || {},
    byCategory: hubMetrics.byCategory || {},
    summary: hubMetrics.summary || { totalSources: 0, activeSources: 0 },
    version: VERSION,
    aggregatorVersion: AGGREGATOR_VERSION,
    timestamp: Date.now()
  };
}

// Backward compatible info - now delegates to MetricsHub
export function info(instance: DynObj) {
  const hubInfo = MetricsHub.info().data || {};
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    aggregatorVersion: AGGREGATOR_VERSION,
    architecture: 'MetricsHub-Delegated',
    initialized: !!instance,
    status: instance?.status || 'not-initialized',
    sidebar: instance?.info?.() || null,
    metricsHub: hubInfo,
    sourcesCount: hubInfo.sourcesCount || 0,
    timestamp: Date.now()
  };
}

// Health check delegates to MetricsHub
export function healthCheck() {
  const hubHealth = MetricsHub.healthCheck();
  
  return {
    status: hubHealth.status,
    score: hubHealth.score,
    version: AGGREGATOR_VERSION,
    moduleId: AGGREGATOR_MODULE_ID,
    metricsHub: hubHealth,
    architecture: 'MetricsHub-Delegated',
    timestamp: Date.now()
  };
}

// Expose MetricsHub methods for advanced usage
export const aggregate = MetricsHub.aggregate;
export const getSourceMetrics = MetricsHub.getSourceMetrics;
export const getMetricsByCategory = MetricsHub.getMetricsByCategory;
export const listSources = MetricsHub.listSources;
export const takeSnapshot = MetricsHub.takeSnapshot;
export const getSnapshots = MetricsHub.getSnapshots;

export default {
  getMetrics,
  info,
  healthCheck,
  aggregate,
  getSourceMetrics,
  getMetricsByCategory,
  listSources,
  takeSnapshot,
  getSnapshots,
  AGGREGATOR_VERSION,
  AGGREGATOR_MODULE_ID
};
