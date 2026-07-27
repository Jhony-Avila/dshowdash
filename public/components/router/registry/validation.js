import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { routes, VERSION as ROUTES_SCHEMA } from "./definitions.js";
import { aliasMap } from "./aliases.js";
import { getEnterpriseRoutes, getNoMountMainRoutes, getUniqueDomains } from "./helpers.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "router.registry.validation";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const validateRoutes = () => {
  const result = { valid: true, issues: [], warnings: [], stats: { total: 0, public: 0, protected: 0, enterprise: 0, withPermissions: 0, withFeatureFlags: 0, withAliases: 0, withDefaultView: 0, withVirtualDefaults: 0, withTags: 0, withMountMain: 0, withDomain: 0, missingId: 0, missingName: 0, missingTitle: 0, missingPage: 0 } };
  const seenIds = /* @__PURE__ */ new Set();
  try {
    for (const [path, config] of Object.entries(routes)) {
      result.stats.total++;
      if (config.public) result.stats.public++;
      else result.stats.protected++;
      if (config.panel) result.stats.enterprise++;
      if (config.permissions?.length > 0) result.stats.withPermissions++;
      if (config.featureFlags?.length > 0) result.stats.withFeatureFlags++;
      if (config.aliases?.length > 0) result.stats.withAliases++;
      if (config.defaultView) result.stats.withDefaultView++;
      if (config.virtualDefaults) result.stats.withVirtualDefaults++;
      if (config.tags?.length > 0) result.stats.withTags++;
      if (typeof config.mountMain === "boolean") result.stats.withMountMain++;
      if (config.domain) result.stats.withDomain++;
      if (!config.id) {
        result.warnings.push({ path, issue: "missing-id" });
        result.stats.missingId++;
      } else if (seenIds.has(config.id)) {
        result.issues.push({ path, issue: "duplicate-id", id: config.id });
        result.valid = false;
      } else {
        seenIds.add(config.id);
      }
      if (!config.name) {
        result.warnings.push({ path, issue: "missing-name" });
        result.stats.missingName++;
      }
      if (!config.title) {
        result.warnings.push({ path, issue: "missing-title" });
        result.stats.missingTitle++;
      }
      if (!config.page) {
        result.issues.push({ path, issue: "missing-page" });
        result.stats.missingPage++;
        result.valid = false;
      }
    }
    const essentialRoutes = ["/", "/login", "/404", "/forbidden"];
    for (const essential of essentialRoutes) {
      if (!routes[essential]) {
        result.issues.push({ path: essential, issue: "essential-route-missing" });
        result.valid = false;
      }
    }
  } catch (error) {
    result.valid = false;
    result.issues.push({ path: "unknown", issue: `validation-error: ${error.message}` });
  }
  return result;
};
const getRoutesInfo = () => {
  const validation = validateRoutes();
  return { version: VERSION, moduleId: MODULE_ID, schemaVersion: "v2", totalRoutes: Object.keys(routes).length, totalAliases: aliasMap.size, enterpriseRoutes: getEnterpriseRoutes().length, noMountMainRoutes: getNoMountMainRoutes(), uniqueDomains: getUniqueDomains(), validation: { valid: validation.valid, issuesCount: validation.issues.length, warningsCount: validation.warnings.length }, stats: validation.stats, portsInitialized: Ports.isInitialized() };
};
function healthCheck() {
  const validation = validateRoutes();
  return { status: validation.valid ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, routeCount: Object.keys(routes).length, issues: validation.issues.length, portsInitialized: Ports.isInitialized() };
}
var validation_default = { validateRoutes, getRoutesInfo, ROUTES_SCHEMA, VERSION, MODULE_ID, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  ROUTES_SCHEMA,
  VERSION,
  validation_default as default,
  getPorts,
  getRoutesInfo,
  healthCheck,
  injectPorts,
  validateRoutes
};
