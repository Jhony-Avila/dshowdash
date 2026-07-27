import { VERSION, MODULE_ID, SLOT_POSITIONS } from "../constants.js";
import { getSlots, getSlotContents, getListeners, getMetrics as _getMetrics } from "../state.js";
function getMetrics() {
  return _getMetrics();
}
function healthCheck() {
  const slots = getSlots();
  const metrics = getMetrics();
  let totalSlots = 0;
  const keys = Object.keys(slots);
  for (let i = 0; i < keys.length; i++) {
    totalSlots += Object.keys(slots[keys[i]]).length;
  }
  const checks = {
    initialized: true,
    noErrors: metrics.errors === 0,
    slotsTracked: totalSlots >= 0
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let j = 0; j < checkKeys.length; j++) {
    if (checks[checkKeys[j]]) passed++;
  }
  const total = checkKeys.length;
  let status = "UNHEALTHY";
  if (passed === total) status = "HEALTHY";
  else if (passed >= 1) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    totalSlots,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const slots = getSlots();
  const slotContents = getSlotContents();
  const slotsByRegion = {};
  const keys = Object.keys(slots);
  for (let i = 0; i < keys.length; i++) {
    slotsByRegion[keys[i]] = Object.keys(slots[keys[i]]).length;
  }
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    positions: SLOT_POSITIONS,
    slotsByRegion,
    totalContents: Object.keys(slotContents).length,
    listenerCount: getListeners().length,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var health_default = {
  getMetrics,
  healthCheck,
  info
};
export {
  health_default as default,
  getMetrics,
  healthCheck,
  info
};
