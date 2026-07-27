import { createCustomPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator-manager:ports";
const customPortsDef = { uiOrchestrator: "UIOrchestrator", eventTimeline: "EventTimeline", canvasEngine: "CanvasEngine" };
const Ports = createCustomPorts({ moduleId: MODULE_ID, ports: customPortsDef });
const initPorts = () => {
  Ports.init();
};
const getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const isInitialized = () => {
  const snapshot = Ports.snapshot();
  return snapshot._initialized;
};
const info = () => {
  const snapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, initialized: snapshot._initialized };
};
var ports_default = { initPorts, getPort, injectPorts, getPorts, isInitialized };
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  getPort,
  getPorts,
  info,
  initPorts,
  injectPorts,
  isInitialized
};
