// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.3.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-regions
// PURPOSE: Entry point do sistema de DOM Regions com Cache TTL
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, ENTERPRISE_STRICT, REGION_MAP, REGION_IDS
//   ./ports.js — injectPorts, getPorts
//   ./cache-config.js — setCacheTTL, getCacheTTL, setCacheConfig, getCacheConfig, getCacheStats
//   ./core.js — getRegion, getRegionWithMode, listRegions, hasRegion, getAllRegions
//   ./clear.js — clearRegion, clearAllRegions, clearCache, invalidateCache
//   ./health.js — getRegionsHealth, validateRegions, getLegacyMetrics, getAccessCounts, healthCheck, info
// ═══════════════════════════════════════════════════════════════
/**
 * @module DOMRegions
 * @description Sistema de regiões DOM com cache LRU
 * @version 4.3.0-ENTERPRISE-AAA
 * @since 2025-02-02
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, ENTERPRISE_STRICT, REGION_MAP, REGION_IDS } from './constants.js';

// Ports
export { injectPorts, getPorts } from './ports.js';

// Cache Config
export { setCacheTTL, getCacheTTL, setCacheConfig, getCacheConfig, getCacheStats } from './cache-config.js';

// Core
export { getRegion, getRegionWithMode, listRegions, hasRegion, getAllRegions } from './core.js';

// Clear
export { clearRegion, clearAllRegions, clearCache, invalidateCache } from './clear.js';

// Health
export { getRegionsHealth, validateRegions, getLegacyMetrics, getAccessCounts, healthCheck, info } from './health.js';

// Default export
import { VERSION, MODULE_ID, ENTERPRISE_STRICT, REGION_MAP, REGION_IDS } from './constants.js';
import { injectPorts, getPorts } from './ports.js';
import { setCacheTTL, getCacheTTL, setCacheConfig, getCacheConfig, getCacheStats } from './cache-config.js';
import { getRegion, getRegionWithMode, listRegions, hasRegion, getAllRegions } from './core.js';
import { clearRegion, clearAllRegions, clearCache, invalidateCache } from './clear.js';
import { getRegionsHealth, validateRegions, getLegacyMetrics, getAccessCounts, healthCheck, info } from './health.js';

export default {
    VERSION, MODULE_ID, ENTERPRISE_STRICT, REGION_MAP, REGION_IDS,
    injectPorts, getPorts,
    setCacheTTL, getCacheTTL, setCacheConfig, getCacheConfig, getCacheStats,
    getRegion, getRegionWithMode, listRegions, hasRegion, getAllRegions,
    clearRegion, clearAllRegions, clearCache, invalidateCache,
    getRegionsHealth, validateRegions, getLegacyMetrics, getAccessCounts,
    healthCheck, info
};
