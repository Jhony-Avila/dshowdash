import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.5.0-P2-ENTERPRISE";
const MODULE_ID = "security-container";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
export * from "./csrf-token-manager/index.js";
const info = () => ({ version: VERSION, moduleId: MODULE_ID, modules: ["csrf-token-manager"], portsInitialized: Ports.isInitialized(), timestamp: Date.now() });
const healthCheck = () => {
  const checks = { portsInitialized: Ports.isInitialized(), modulesAvailable: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const cleanup = () => ({ success: true, moduleId: MODULE_ID });
const reset = () => cleanup();
const destroy = () => cleanup();
var security_default = { VERSION, MODULE_ID, info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  security_default as default,
  destroy,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  reset
};
