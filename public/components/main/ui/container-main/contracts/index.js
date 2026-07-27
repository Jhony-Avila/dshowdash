const VERSION = "3.2.0-HARDENED";
const MODULE_ID = "container-main:contracts";
export * from "./lifecycle-contract.js";
export * from "./slot-contract.js";
export * from "./resource-contract.js";
export * from "./panel-contract.js";
export * from "./capability-contract.js";
export * from "./utils-contract.js";
export * from "./container-contract.js";
export * from "./layout-contract.js";
import { default as default2 } from "./lifecycle-contract.js";
import { default as default3 } from "./slot-contract.js";
import { default as default4 } from "./resource-contract.js";
import { default as default5 } from "./panel-contract.js";
import { default as default6 } from "./capability-contract.js";
import { default as default7 } from "./utils-contract.js";
import { default as default8 } from "./container-contract.js";
import { default as default9 } from "./layout-contract.js";
import { healthCheck as lifecycleHealth } from "./lifecycle-contract.js";
import { healthCheck as slotHealth } from "./slot-contract.js";
import { healthCheck as resourceHealth } from "./resource-contract.js";
import { healthCheck as panelHealth } from "./panel-contract.js";
import { healthCheck as capabilityHealth } from "./capability-contract.js";
import { healthCheck as utilsHealth } from "./utils-contract.js";
import { healthCheck as containerHealth } from "./container-contract.js";
import { healthCheck as layoutHealth } from "./layout-contract.js";
const CONTRACTS = Object.freeze([
  "lifecycle",
  "slot",
  "resource",
  "panel",
  "capability",
  "utils",
  "container",
  "layout"
]);
const _healthFns = {
  lifecycle: lifecycleHealth,
  slot: slotHealth,
  resource: resourceHealth,
  panel: panelHealth,
  capability: capabilityHealth,
  utils: utilsHealth,
  container: containerHealth,
  layout: layoutHealth
};
function contractsHealthCheck() {
  const results = {};
  for (const name in _healthFns) {
    if (_healthFns.hasOwnProperty(name)) {
      try {
        results[name] = _healthFns[name]();
      } catch (e) {
        results[name] = {
          status: "ERROR",
          error: e.message || "Unknown error",
          moduleId: `container-main:contracts:${name}`,
          version: "unknown"
        };
      }
    }
  }
  return results;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    contracts: CONTRACTS,
    totalContracts: CONTRACTS.length
  };
}
function healthCheck() {
  let checks;
  try {
    checks = contractsHealthCheck();
  } catch (e) {
    return {
      status: "ERROR",
      version: VERSION,
      moduleId: MODULE_ID,
      error: e.message || "contractsHealthCheck failed",
      contracts: null,
      totalContracts: CONTRACTS.length
    };
  }
  const statuses = Object.values(checks).map((c) => c.status);
  const hasError = statuses.indexOf("ERROR") !== -1;
  const hasDegraded = statuses.indexOf("DEGRADED") !== -1;
  const allHealthy = !hasError && !hasDegraded && statuses.every((s) => s === "HEALTHY");
  return {
    status: allHealthy ? "HEALTHY" : hasError ? "ERROR" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    contracts: checks,
    totalContracts: CONTRACTS.length,
    healthy: statuses.filter((s) => s === "HEALTHY").length,
    degraded: statuses.filter((s) => s === "DEGRADED").length,
    errors: statuses.filter((s) => s === "ERROR").length
  };
}
var contracts_default = {
  VERSION,
  MODULE_ID,
  CONTRACTS,
  contractsHealthCheck,
  info,
  healthCheck
};
export {
  CONTRACTS,
  default6 as CapabilityContract,
  default8 as ContainerContract,
  default9 as LayoutContract,
  default2 as LifecycleContract,
  MODULE_ID,
  default5 as PanelContract,
  default4 as ResourceContract,
  default3 as SlotContract,
  default7 as UtilsContract,
  VERSION,
  contractsHealthCheck,
  contracts_default as default,
  healthCheck,
  info
};
