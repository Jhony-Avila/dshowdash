// Metrics Dashboard - Collector Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 1.1.0-ENTERPRISE
// @changelog v1.1.0-ENTERPRISE - Added healthCheck() and info()
'use strict';

const MODULE_ID = 'metrics-dashboard-collector';
const VERSION = '1.1.0-P2-ENTERPRISE';

let collectedMetrics: Record<string, unknown> = {};

const collect = (source: string, data: Record<string, unknown>) => {
  collectedMetrics[source] = { ...(collectedMetrics[source] as Record<string, unknown>), ...data, timestamp: Date.now() };
  return getMetrics();
};

const getMetrics = () => ({ ...collectedMetrics });

const clearMetrics = () => { collectedMetrics = {}; return getMetrics(); };

const getMetricsBySource = (source: string) => collectedMetrics[source] || null;

const aggregateMetrics = () => {
  const aggregate: Record<string, number> = {};
  for (const source of Object.keys(collectedMetrics)) {
    const data = collectedMetrics[source] as Record<string, unknown>;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') { aggregate[key] = (aggregate[key] || 0) + value; }
    }
  }
  return aggregate;
};

const healthCheck = () => {
  const sourcesCount = Object.keys(collectedMetrics).length;
  const checks = { hasMetrics: sourcesCount > 0, ready: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 2 ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/2`,
    checks,
    sourcesCount,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
};

const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  sourcesCount: Object.keys(collectedMetrics).length,
  sources: Object.keys(collectedMetrics)
});

export { collect, getMetrics, clearMetrics, getMetricsBySource, aggregateMetrics, healthCheck, info, MODULE_ID, VERSION };
