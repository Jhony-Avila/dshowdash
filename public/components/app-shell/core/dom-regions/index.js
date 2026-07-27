import { VERSION, MODULE_ID, ENTERPRISE_STRICT, REGION_MAP, REGION_IDS } from "./constants.js";
import { injectPorts, getPorts } from "./ports.js";
import { setCacheTTL, getCacheTTL, setCacheConfig, getCacheConfig, getCacheStats } from "./cache-config.js";
import { getRegion, getRegionWithMode, listRegions, hasRegion, getAllRegions } from "./core.js";
import { clearRegion, clearAllRegions, clearCache, invalidateCache } from "./clear.js";
import { getRegionsHealth, validateRegions, getLegacyMetrics, getAccessCounts, healthCheck, info } from "./health.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, ENTERPRISE_STRICT as ENTERPRISE_STRICT2, REGION_MAP as REGION_MAP2, REGION_IDS as REGION_IDS2 } from "./constants.js";
import { injectPorts as injectPorts2, getPorts as getPorts2 } from "./ports.js";
import { setCacheTTL as setCacheTTL2, getCacheTTL as getCacheTTL2, setCacheConfig as setCacheConfig2, getCacheConfig as getCacheConfig2, getCacheStats as getCacheStats2 } from "./cache-config.js";
import { getRegion as getRegion2, getRegionWithMode as getRegionWithMode2, listRegions as listRegions2, hasRegion as hasRegion2, getAllRegions as getAllRegions2 } from "./core.js";
import { clearRegion as clearRegion2, clearAllRegions as clearAllRegions2, clearCache as clearCache2, invalidateCache as invalidateCache2 } from "./clear.js";
import { getRegionsHealth as getRegionsHealth2, validateRegions as validateRegions2, getLegacyMetrics as getLegacyMetrics2, getAccessCounts as getAccessCounts2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var dom_regions_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  ENTERPRISE_STRICT: ENTERPRISE_STRICT2,
  REGION_MAP: REGION_MAP2,
  REGION_IDS: REGION_IDS2,
  injectPorts: injectPorts2,
  getPorts: getPorts2,
  setCacheTTL: setCacheTTL2,
  getCacheTTL: getCacheTTL2,
  setCacheConfig: setCacheConfig2,
  getCacheConfig: getCacheConfig2,
  getCacheStats: getCacheStats2,
  getRegion: getRegion2,
  getRegionWithMode: getRegionWithMode2,
  listRegions: listRegions2,
  hasRegion: hasRegion2,
  getAllRegions: getAllRegions2,
  clearRegion: clearRegion2,
  clearAllRegions: clearAllRegions2,
  clearCache: clearCache2,
  invalidateCache: invalidateCache2,
  getRegionsHealth: getRegionsHealth2,
  validateRegions: validateRegions2,
  getLegacyMetrics: getLegacyMetrics2,
  getAccessCounts: getAccessCounts2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  ENTERPRISE_STRICT,
  MODULE_ID,
  REGION_IDS,
  REGION_MAP,
  VERSION,
  clearAllRegions,
  clearCache,
  clearRegion,
  dom_regions_default as default,
  getAccessCounts,
  getAllRegions,
  getCacheConfig,
  getCacheStats,
  getCacheTTL,
  getLegacyMetrics,
  getPorts,
  getRegion,
  getRegionWithMode,
  getRegionsHealth,
  hasRegion,
  healthCheck,
  info,
  injectPorts,
  invalidateCache,
  listRegions,
  setCacheConfig,
  setCacheTTL,
  validateRegions
};
