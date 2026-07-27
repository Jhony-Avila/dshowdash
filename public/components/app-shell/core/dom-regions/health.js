import { VERSION, MODULE_ID, REGION_MAP, ENTERPRISE_STRICT } from "./constants.js";
import { Ports } from "./ports.js";
import { cacheConfig } from "./cache.js";
import { getCacheConfig, getCacheStats } from "./cache-config.js";
import { usageMetrics } from "./metrics.js";
import { getRegionWithMode, listRegions } from "./core.js";
function getRegionsHealth() {
  const health = {};
  let existsCount = 0, totalCount = 0, legacyCount = 0;
  const regionNames = Object.keys(REGION_MAP);
  for (let i = 0; i < regionNames.length; i++) {
    const name = regionNames[i];
    const config = REGION_MAP[name];
    totalCount++;
    const info2 = getRegionWithMode(name);
    if (info2.exists) existsCount++;
    if (info2.usingLegacy) legacyCount++;
    let isVisible = false;
    if (info2.element) {
      isVisible = info2.element.offsetParent !== null || getComputedStyle(info2.element).position === "fixed";
    }
    health[name] = {
      id: config.id,
      legacyId: config.legacyId,
      exists: info2.exists,
      usingLegacy: info2.usingLegacy,
      mode: info2.mode,
      childrenCount: info2.element ? info2.element.children.length : 0,
      hasChildren: info2.element ? info2.element.children.length > 0 : false,
      isVisible,
      accessCount: usageMetrics.accessCount[name] || 0
    };
  }
  health._summary = {
    total: totalCount,
    exists: existsCount,
    missing: totalCount - existsCount,
    usingLegacy: legacyCount,
    allPresent: existsCount === totalCount,
    allEnterprise: existsCount === totalCount && legacyCount === 0,
    mode: legacyCount > 0 ? "mixed" : existsCount === totalCount ? "enterprise" : "incomplete",
    strictMode: ENTERPRISE_STRICT,
    cacheStats: getCacheStats()
  };
  return health;
}
function validateRegions() {
  const health = getRegionsHealth();
  const issues = [], warnings = [];
  const regionNames = Object.keys(health);
  for (let i = 0; i < regionNames.length; i++) {
    const name = regionNames[i];
    if (name === "_summary") continue;
    const regionInfo = health[name];
    if (!regionInfo.exists) {
      issues.push({ region: name, type: "missing", message: `Region '${name}' not found (ID: ${regionInfo.id})` });
    } else if (regionInfo.usingLegacy) {
      warnings.push({ region: name, type: "legacy", message: `Region '${name}' using legacy ID`, action: "Migrate to enterprise ID" });
    }
  }
  return {
    valid: issues.length === 0,
    enterprise: issues.length === 0 && warnings.length === 0,
    strictMode: ENTERPRISE_STRICT,
    issues,
    warnings,
    summary: health._summary,
    usageMetrics: Object.assign({}, usageMetrics),
    recommendation: warnings.length > 0 ? "Migrate legacy IDs to enterprise IDs" : null
  };
}
function getLegacyMetrics() {
  const total = usageMetrics.legacyHits + usageMetrics.enterpriseHits;
  return Object.assign({}, usageMetrics, {
    legacyPercentage: total > 0 ? Math.round(usageMetrics.legacyHits / total * 100) : 0,
    cacheStats: getCacheStats()
  });
}
function getAccessCounts() {
  return Object.assign({}, usageMetrics.accessCount);
}
function healthCheck() {
  const health = getRegionsHealth();
  const metrics = getLegacyMetrics();
  const cacheStats = getCacheStats();
  const portsSnapshot = Ports.snapshot();
  const checks = {
    allRegionsPresent: health._summary.allPresent,
    allEnterprise: health._summary.allEnterprise,
    noLegacyUsage: metrics.legacyPercentage === 0,
    cacheEfficient: cacheStats.hits + cacheStats.misses === 0 || parseInt(cacheStats.hitRate) > 50,
    cacheNotFull: cacheStats.size < cacheConfig.maxSize * 0.9,
    portsInitialized: portsSnapshot._initialized
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    summary: health._summary,
    cacheStats,
    cacheConfig: getCacheConfig(),
    strictMode: ENTERPRISE_STRICT,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: ENTERPRISE_STRICT,
    regionCount: Object.keys(REGION_MAP).length,
    regions: listRegions(),
    health: getRegionsHealth(),
    usageMetrics: getLegacyMetrics(),
    accessCounts: getAccessCounts(),
    cacheConfig: getCacheConfig(),
    cacheStats: getCacheStats(),
    portsStatus: { initialized: portsSnapshot._initialized },
    timestamp: Date.now()
  };
}
export {
  getAccessCounts,
  getLegacyMetrics,
  getRegionsHealth,
  healthCheck,
  info,
  validateRegions
};
