import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "router.core.aaa-constants";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const ROUTER_STRICT = { value: true };
const AAA_FLAGS = { INFERENCE_FROZEN: true, INFERENCE_FROZEN_DATE: "2025-12-23", LAYOUT_SEPARATION: true, LAYOUT_SEPARATION_DATE: "2025-12-23", REGISTRY_HARDENED: true, REGISTRY_HARDENED_DATE: "2025-12-23", ROUTER_STRICT: true, ROUTER_STRICT_DATE: "2025-12-23", AAA_COMPLETE: true, AAA_COMPLETE_DATE: "2025-12-23" };
const AAA_CONTRACT = { version: "1.0.0", methods: ["resolve", "canNavigate", "navigate", "getStatus", "healthCheck"], principles: ["Router resolve inten\xE7\xE3o, n\xE3o experi\xEAncia", "Router n\xE3o inventa rotas", "Router n\xE3o decide layout", "Router \xE9 determin\xEDstico"] };
function setStrictMode(enabled) {
  const previous = ROUTER_STRICT.value;
  ROUTER_STRICT.value = !!enabled;
  AAA_FLAGS.ROUTER_STRICT = ROUTER_STRICT.value;
  return { previous, current: ROUTER_STRICT.value };
}
function isStrictMode() {
  return ROUTER_STRICT.value;
}
function getAAAContract() {
  return Object.assign({}, AAA_CONTRACT);
}
function getAAAFlags() {
  return Object.assign({}, AAA_FLAGS);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, strict: ROUTER_STRICT.value, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, strict: ROUTER_STRICT.value, portsInitialized: Ports.isInitialized() };
}
var aaa_constants_default = { ROUTER_STRICT, AAA_FLAGS, AAA_CONTRACT, setStrictMode, isStrictMode, getAAAContract, getAAAFlags, healthCheck, injectPorts, getPorts };
export {
  AAA_CONTRACT,
  AAA_FLAGS,
  MODULE_ID,
  ROUTER_STRICT,
  VERSION,
  aaa_constants_default as default,
  getAAAContract,
  getAAAFlags,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isStrictMode,
  setStrictMode
};
