import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin:ports";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const initPorts = () => {
  Ports.init();
};
const getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const isDebug = () => {
  const cfg = getPort("config");
  return cfg?.app?.debug ? true : false;
};
const info = () => {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, initialized: ps._initialized };
};
var ports_default = { initPorts, getPort, injectPorts, getPorts, isDebug };
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  getPort,
  getPorts,
  info,
  initPorts,
  injectPorts,
  isDebug
};
