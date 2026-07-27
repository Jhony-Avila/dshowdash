const VERSION = "2.0.0-AAA-P4";
const MODULE_ID = "ui-port";
const UIPortContract = { mount: "function", unmount: "function", update: "function" };
function createNullUIPort() {
  return { mount: () => null, unmount: () => {
  }, update: () => false };
}
function validateUIPort(port) {
  return port && typeof port.mount === "function";
}
function healthCheck(port) {
  const hasMount = typeof port?.mount === "function";
  const hasUnmount = typeof port?.unmount === "function";
  return {
    status: hasMount ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { hasMount, hasUnmount }
  };
}
var UIPort_default = { UIPortContract, createNullUIPort, validateUIPort, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  UIPortContract,
  VERSION,
  createNullUIPort,
  UIPort_default as default,
  healthCheck,
  validateUIPort
};
