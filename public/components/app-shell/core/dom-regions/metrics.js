import { MODULE_ID } from "./constants.js";
import { initPorts, getPort } from "./ports.js";
const VERSION = "4.3.0-P2-ENTERPRISE";
const usageMetrics = {
  legacyHits: 0,
  enterpriseHits: 0,
  misses: 0,
  byRegion: {},
  accessCount: {}
};
function trackUsage(region, usedLegacy, found) {
  if (!usageMetrics.byRegion[region]) {
    usageMetrics.byRegion[region] = { legacy: 0, enterprise: 0, misses: 0 };
  }
  if (!usageMetrics.accessCount[region]) {
    usageMetrics.accessCount[region] = 0;
  }
  usageMetrics.accessCount[region]++;
  if (!found) {
    usageMetrics.misses++;
    usageMetrics.byRegion[region].misses++;
  } else if (usedLegacy) {
    usageMetrics.legacyHits++;
    usageMetrics.byRegion[region].legacy++;
  } else {
    usageMetrics.enterpriseHits++;
    usageMetrics.byRegion[region].enterprise++;
  }
}
function trackEvent(event, data) {
  if (!data) data = {};
  initPorts();
  try {
    const telemetry = getPort("telemetry");
    if (telemetry && telemetry.event) {
      telemetry.event(`${MODULE_ID}:${event}`, data);
    }
  } catch (e) {
  }
}
export {
  VERSION,
  trackEvent,
  trackUsage,
  usageMetrics
};
