import { VERSION, MODULE_ID } from "./constants.js";
import { notifications, queue, containerElement, stylesInjected, config, metrics, subscribers } from "./state.js";
import { getConfig } from "./config.js";
import { getAll } from "./queries.js";
function getMetrics() {
  return {
    shown: metrics.shown,
    dismissed: metrics.dismissed,
    clicked: metrics.clicked,
    expired: metrics.expired,
    queued: metrics.queued,
    activeCount: notifications.size,
    queueSize: queue.length
  };
}
function healthCheck() {
  const checks = {
    containerExists: !!containerElement.value,
    stylesInjected: stylesInjected.value,
    notOverloaded: notifications.size <= config.maxVisible * 2,
    queueReasonable: queue.length < 20
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed >= 3 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function getInfo() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    metrics: getMetrics(),
    activeNotifications: getAll().length,
    queueSize: queue.length,
    subscriberCount: subscribers.length,
    timestamp: Date.now()
  };
}
export {
  getInfo,
  getMetrics,
  healthCheck
};
