import { FEATURE_CONTRACTS } from "./contracts-data/index.js";
import { CATEGORIES } from "./categories.js";
import { validateContracts, getAllLegacyMappings } from "./queries.js";
const VERSION = "1.0.1-FIX";
const MODULE_ID = "sidebar-feature-contracts-telemetry";
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalFeatures: Object.keys(FEATURE_CONTRACTS).length,
    // @ts-expect-error TS migration - TS2339, TS2365
    totalMethods: Object.values(FEATURE_CONTRACTS).reduce((acc, c) => acc + Object.keys(c.methods).length, 0),
    totalLegacyMappings: Object.keys(getAllLegacyMappings()).length,
    categories: Object.values(CATEGORIES),
    validation: validateContracts()
  };
}
function healthCheck() {
  const validation = validateContracts();
  return {
    status: validation.valid ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    validation,
    timestamp: Date.now()
  };
}
function getStatsByCategory() {
  const stats = {};
  for (const category of Object.values(CATEGORIES)) {
    stats[category] = {
      features: 0,
      methods: 0
    };
  }
  for (const contract of Object.values(FEATURE_CONTRACTS)) {
    if (stats[contract.category]) {
      stats[contract.category].features++;
      stats[contract.category].methods += Object.keys(contract.methods).length;
    }
  }
  return stats;
}
var telemetry_default = {
  info,
  healthCheck,
  getStatsByCategory
};
export {
  MODULE_ID,
  VERSION,
  telemetry_default as default,
  getStatsByCategory,
  healthCheck,
  info
};
