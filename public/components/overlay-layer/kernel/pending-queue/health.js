import { VERSION, MODULE_ID } from "./constants.js";
import { config, queue, state, refs } from "./state.js";
import { getAll } from "./queue.js";
import { getConfig } from "./config.js";
import { isFull } from "./size.js";
import { isAutoProcessEnabled } from "./process.js";
function getMetrics() {
  return {
    enabled: config.enabled,
    autoProcess: isAutoProcessEnabled(),
    currentSize: queue.length,
    maxSize: config.maxSize,
    totalEnqueued: state.totalEnqueued,
    totalProcessed: state.totalProcessed,
    totalExpired: state.totalExpired,
    totalFailed: state.totalFailed,
    lastProcess: state.lastProcess
  };
}
function healthCheck() {
  const metrics = getMetrics();
  const utilizationPercent = metrics.currentSize / metrics.maxSize * 100;
  const checks = {
    enabled: config.enabled,
    notFull: !isFull(),
    lowUtilization: utilizationPercent < 80,
    hasOpenFunction: !!refs.openOverlay
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!checks.hasOpenFunction) status = "UNHEALTHY";
  else if (isFull()) status = "DEGRADED";
  else if (passed < total) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    queue: {
      size: metrics.currentSize,
      maxSize: metrics.maxSize,
      utilization: `${utilizationPercent.toFixed(0)}%`
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    config: getConfig(),
    metrics: getMetrics(),
    queue: getAll(),
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
