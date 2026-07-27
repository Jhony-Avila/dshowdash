import { REGION_MAP, ENTERPRISE_STRICT } from "./constants.js";
import { getCacheEntry, setCacheEntry, cacheHits } from "./cache.js";
import { usageMetrics, trackUsage, trackEvent } from "./metrics.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.dom-regions.core";
function getRegion(name) {
  const config = REGION_MAP[name];
  if (!config) {
    usageMetrics.misses++;
    return document.getElementById(name) || null;
  }
  const cached = getCacheEntry(name);
  if (cached) {
    cacheHits.hits++;
    trackUsage(name, false, true);
    return cached.element;
  }
  cacheHits.misses++;
  const enterpriseEl = document.getElementById(config.id);
  if (enterpriseEl) {
    setCacheEntry(name, enterpriseEl);
    trackUsage(name, false, true);
    return enterpriseEl;
  }
  if (ENTERPRISE_STRICT) {
    trackUsage(name, false, false);
    trackEvent("strict-miss", { region: name, enterpriseId: config.id });
    return null;
  }
  const legacyEl = document.getElementById(config.legacyId);
  if (legacyEl) {
    setCacheEntry(name, legacyEl);
    trackUsage(name, true, true);
    trackEvent("legacy-fallback", { region: name, legacyId: config.legacyId });
    return legacyEl;
  }
  trackUsage(name, false, false);
  return null;
}
function getRegionWithMode(name) {
  const config = REGION_MAP[name];
  if (!config) {
    const el = document.getElementById(name);
    return { element: el, id: name, legacyId: null, usingLegacy: false, exists: !!el, mode: el ? "direct" : "missing" };
  }
  const newEl = document.getElementById(config.id);
  if (newEl) {
    trackUsage(name, false, true);
    return { element: newEl, id: config.id, legacyId: config.legacyId, usingLegacy: false, exists: true, mode: "enterprise" };
  }
  if (ENTERPRISE_STRICT) {
    return { element: null, id: config.id, legacyId: config.legacyId, usingLegacy: false, exists: false, mode: "strict-miss" };
  }
  const legacyEl = document.getElementById(config.legacyId);
  if (legacyEl) {
    trackUsage(name, true, true);
    return { element: legacyEl, id: config.id, legacyId: config.legacyId, usingLegacy: true, exists: true, mode: "legacy-compat" };
  }
  return { element: null, id: config.id, legacyId: config.legacyId, usingLegacy: false, exists: false, mode: "missing" };
}
function listRegions() {
  const result = {};
  const keys = Object.keys(REGION_MAP);
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = REGION_MAP[keys[i]].id;
  }
  return result;
}
function hasRegion(name) {
  return getRegion(name) !== null;
}
function getAllRegions() {
  const regions = {};
  const keys = Object.keys(REGION_MAP);
  for (let i = 0; i < keys.length; i++) {
    regions[keys[i]] = getRegion(keys[i]);
  }
  return regions;
}
export {
  MODULE_ID,
  VERSION,
  getAllRegions,
  getRegion,
  getRegionWithMode,
  hasRegion,
  listRegions
};
