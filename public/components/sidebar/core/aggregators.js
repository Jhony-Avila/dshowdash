import { VERSION, MODULE_ID } from "./constants.js";
import * as MetricsHub from "../telemetry/metrics-hub.js";
const AGGREGATOR_VERSION = "6.1.0-P2-ENTERPRISE";
const AGGREGATOR_MODULE_ID = "sidebar-aggregators";
function getMetrics(instance) {
  const hubMetrics = MetricsHub.aggregate().data || {};
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
function info(instance) {
  const hubInfo = MetricsHub.info().data || {};
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    aggregatorVersion: AGGREGATOR_VERSION,
    architecture: "MetricsHub-Delegated",
    initialized: !!instance,
    status: instance?.status || "not-initialized",
    sidebar: instance?.info?.() || null,
    metricsHub: hubInfo,
    sourcesCount: hubInfo.sourcesCount || 0,
    timestamp: Date.now()
  };
}
function healthCheck() {
  const hubHealth = MetricsHub.healthCheck();
  return {
    status: hubHealth.status,
    score: hubHealth.score,
    version: AGGREGATOR_VERSION,
    moduleId: AGGREGATOR_MODULE_ID,
    metricsHub: hubHealth,
    architecture: "MetricsHub-Delegated",
    timestamp: Date.now()
  };
}
const aggregate = MetricsHub.aggregate;
const getSourceMetrics = MetricsHub.getSourceMetrics;
const getMetricsByCategory = MetricsHub.getMetricsByCategory;
const listSources = MetricsHub.listSources;
const takeSnapshot = MetricsHub.takeSnapshot;
const getSnapshots = MetricsHub.getSnapshots;
var aggregators_default = {
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
export {
  AGGREGATOR_MODULE_ID,
  AGGREGATOR_VERSION,
  aggregate,
  aggregators_default as default,
  getMetrics,
  getMetricsByCategory,
  getSnapshots,
  getSourceMetrics,
  healthCheck,
  info,
  listSources,
  takeSnapshot
};
