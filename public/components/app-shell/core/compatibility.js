import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { getRegion } from "./dom-regions/index.js";
const VERSION = "3.3.1-P2-ENTERPRISE";
const MODULE_ID = "app-shell-compatibility";
const DEPRECATED = true;
const REMOVAL_DATE = "2025-06-30";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _usageMetrics = {
  createCalls: 0,
  removeCalls: 0,
  checkCalls: 0,
  containersCreated: 0,
  containersRemoved: 0,
  lastUsedAt: null
};
function _trackUsage(action) {
  Ports.init();
  _usageMetrics.lastUsedAt = Date.now();
  try {
    const telemetry = Ports.get("telemetry");
    const logger = Ports.get("logger");
    if (telemetry && telemetry.event) {
      telemetry.event(`${MODULE_ID}:deprecated:${action}`, {
        deprecated: true,
        removalDate: REMOVAL_DATE,
        usageCount: _usageMetrics.createCalls + _usageMetrics.removeCalls
      });
    }
    if (logger && logger.info) {
      logger.info(`[DEPRECATED] ${MODULE_ID}:${action} - Scheduled for removal on ${REMOVAL_DATE}`);
    }
  } catch (e) {
  }
}
const LEGACY_MAPPINGS = Object.freeze({
  preloader: [{ id: "preloader-root", tag: "div" }],
  header: [{ id: "header-container", tag: "div" }],
  sidebar: [{ id: "sidebar-root", tag: "div" }],
  footer: [{ id: "footer-root", tag: "div" }],
  login: [{ id: "login-container", tag: "div" }],
  toast: [{ id: "toast-container", tag: "div" }]
});
function createLegacyContainers() {
  _usageMetrics.createCalls++;
  _trackUsage("createLegacyContainers");
  const created = [];
  const failed = [];
  const skipped = [];
  const regionNames = Object.keys(LEGACY_MAPPINGS);
  for (let i = 0; i < regionNames.length; i++) {
    const regionName = regionNames[i];
    const containers = LEGACY_MAPPINGS[regionName];
    const region = getRegion(regionName);
    if (!region) {
      failed.push({ region: regionName, reason: "region_not_found" });
      continue;
    }
    for (let j = 0; j < containers.length; j++) {
      const config = containers[j];
      if (document.getElementById(config.id)) {
        skipped.push({ id: config.id, region: regionName, reason: "already_exists" });
        continue;
      }
      try {
        const el = document.createElement(config.tag);
        el.id = config.id;
        if (config.className) el.className = config.className;
        el.setAttribute("data-legacy-container", "true");
        el.setAttribute("data-shell-region", regionName);
        el.setAttribute("data-deprecated", "true");
        region.appendChild(el);
        created.push({ id: config.id, region: regionName });
        _usageMetrics.containersCreated++;
      } catch (error) {
        failed.push({ id: config.id, region: regionName, error: error.message });
      }
    }
  }
  return { created, failed, skipped, deprecated: true, removalDate: REMOVAL_DATE };
}
function removeLegacyContainers() {
  _usageMetrics.removeCalls++;
  _trackUsage("removeLegacyContainers");
  const removed = [];
  const errors = [];
  const elements = document.querySelectorAll('[data-legacy-container="true"]');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    try {
      const id = el.id;
      if (el.parentNode) {
        el.parentNode.removeChild(el);
        removed.push(id);
        _usageMetrics.containersRemoved++;
      }
    } catch (error) {
      errors.push({ id: el.id, error: error.message });
    }
  }
  return { removed, errors, deprecated: true };
}
function hasLegacyContainer(id) {
  _usageMetrics.checkCalls++;
  const el = document.getElementById(id);
  return el && el.getAttribute("data-legacy-container") === "true";
}
function getLegacyMappings() {
  return Object.assign({}, LEGACY_MAPPINGS);
}
function createMainLayoutWrapper() {
  _trackUsage("createMainLayoutWrapper");
  const mainRegion = getRegion("main");
  if (!mainRegion) return null;
  let wrapper = mainRegion.querySelector(".main-layout");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "main-layout";
    wrapper.setAttribute("data-legacy-container", "true");
    wrapper.setAttribute("data-deprecated", "true");
    mainRegion.appendChild(wrapper);
  }
  return wrapper;
}
function getUsageMetrics() {
  const ps = Ports.snapshot();
  return Object.assign({}, _usageMetrics, {
    portsStatus: { initialized: ps._initialized }
  });
}
function getCompatibilityInfo() {
  const ps = Ports.snapshot();
  const legacyContainers = document.querySelectorAll('[data-legacy-container="true"]');
  const containersByRegion = {};
  for (let i = 0; i < legacyContainers.length; i++) {
    const el = legacyContainers[i];
    const region = el.getAttribute("data-shell-region") || "unknown";
    if (!containersByRegion[region]) containersByRegion[region] = [];
    containersByRegion[region].push(el.id);
  }
  return {
    deprecated: true,
    removalDate: REMOVAL_DATE,
    totalLegacyContainers: legacyContainers.length,
    containersByRegion,
    mappingsCount: Object.keys(LEGACY_MAPPINGS).length,
    supportedRegions: Object.keys(LEGACY_MAPPINGS),
    usageMetrics: getUsageMetrics(),
    recommendation: "Migrate to enterprise regions before removal date",
    version: VERSION,
    portsInitialized: ps._initialized
  };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const info2 = getCompatibilityInfo();
  const checks = {
    noActiveContainers: info2.totalLegacyContainers === 0,
    lowUsage: _usageMetrics.createCalls < 100,
    migrationReady: info2.totalLegacyContainers === 0 && _usageMetrics.createCalls === 0,
    portsInitialized: ps._initialized
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    deprecated: true,
    removalDate: REMOVAL_DATE,
    activeContainers: info2.totalLegacyContainers,
    usageMetrics: getUsageMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return getCompatibilityInfo();
}
var compatibility_default = {
  createLegacyContainers,
  removeLegacyContainers,
  hasLegacyContainer,
  getLegacyMappings,
  createMainLayoutWrapper,
  getUsageMetrics,
  getCompatibilityInfo,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  DEPRECATED,
  REMOVAL_DATE,
  VERSION,
  MODULE_ID
};
export {
  DEPRECATED,
  MODULE_ID,
  REMOVAL_DATE,
  VERSION,
  createLegacyContainers,
  createMainLayoutWrapper,
  compatibility_default as default,
  getCompatibilityInfo,
  getLegacyMappings,
  getPorts,
  getUsageMetrics,
  hasLegacyContainer,
  healthCheck,
  info,
  injectPorts,
  removeLegacyContainers
};
