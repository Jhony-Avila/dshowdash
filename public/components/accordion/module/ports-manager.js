import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID as ACCORDION_MODULE_ID } from "./constants.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.module.ports-manager";
const Ports = createUiPorts({ moduleId: ACCORDION_MODULE_ID });
function initPorts() {
  Ports.init();
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function getPort(name) {
  return Ports.get(name);
}
function isPortsInitialized() {
  return Ports.isInitialized();
}
function healthCheck() {
  const checks = {
    portsAvailable: !!Ports,
    portsInitialized: isPortsInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: isPortsInitialized(),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var ports_manager_default = {
  initPorts,
  injectPorts,
  getPorts,
  getPort,
  isPortsInitialized,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  ports_manager_default as default,
  getPort,
  getPorts,
  healthCheck,
  info,
  initPorts,
  injectPorts,
  isPortsInitialized
};
