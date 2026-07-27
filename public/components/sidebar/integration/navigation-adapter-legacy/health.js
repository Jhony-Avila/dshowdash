import { VERSION, MODULE_ID, TRIGGER_PATTERNS, SECTION_MAPPING, DEFAULT_REGION } from "./constants.js";
import { getAuditLogSize } from "./audit.js";
import { getMetrics as getTriggerMetrics } from "./trigger-normalizer.js";
import { getMetrics as getItemMetrics } from "./item-adapter.js";
import { getMetrics as getSectionMetrics } from "./section-adapter.js";
let _adaptationCount = 0;
let _deduplicationCount = 0;
function incrementAdaptations() {
  _adaptationCount++;
}
function incrementDeduplications() {
  _deduplicationCount++;
}
function getMetrics() {
  const triggerMetrics = getTriggerMetrics();
  const itemMetrics = getItemMetrics();
  const sectionMetrics = getSectionMetrics();
  return {
    adaptations: _adaptationCount,
    triggerNormalizations: triggerMetrics.triggerNormalizations,
    regionAssignments: itemMetrics.regionAssignments,
    deduplications: _deduplicationCount,
    errors: itemMetrics.errors + sectionMetrics.errors
  };
}
function resetMetrics() {
  _adaptationCount = 0;
  _deduplicationCount = 0;
  return { success: true };
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    moduleLoaded: true,
    patternsReady: Object.keys(TRIGGER_PATTERNS).length > 0,
    noErrors: metrics.errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    metrics,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    triggerPatterns: Object.keys(TRIGGER_PATTERNS),
    sectionMappings: Object.keys(SECTION_MAPPING),
    defaultRegion: DEFAULT_REGION,
    metrics: getMetrics(),
    auditLogSize: getAuditLogSize(),
    phase: "P0 - Compatibility"
  };
}
var health_default = {
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  incrementAdaptations,
  incrementDeduplications
};
export {
  health_default as default,
  getMetrics,
  healthCheck,
  incrementAdaptations,
  incrementDeduplications,
  info,
  resetMetrics
};
