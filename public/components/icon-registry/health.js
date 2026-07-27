import { info as registryInfo, healthCheck as registryHealth } from "./registry.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "icon-registry:health";
function healthCheck() {
  const registryStatus = registryHealth();
  return {
    status: registryStatus.status,
    totalIcons: registryStatus.totalIcons,
    namespaces: registryStatus.namespaces,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now(),
    checks: {
      registryLoaded: registryStatus.totalIcons > 0,
      namespacesValid: registryStatus.namespaces.length > 0
    }
  };
}
function info() {
  const registryData = registryInfo();
  return {
    ...registryData,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
function validate() {
  const status = healthCheck();
  const errors = [];
  if (status.totalIcons === 0) {
    errors.push("No icons registered");
  }
  if (status.namespaces.length === 0) {
    errors.push("No namespaces registered");
  }
  return {
    valid: errors.length === 0,
    errors,
    ...status
  };
}
var health_default = { healthCheck, info, validate };
export {
  MODULE_ID,
  VERSION,
  health_default as default,
  healthCheck,
  info,
  validate
};
