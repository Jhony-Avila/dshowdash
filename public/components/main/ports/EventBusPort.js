const VERSION = "2.0.0-AAA-P4";
const MODULE_ID = "main-eventbus-port";
const EventBusPortContract = { emit: "function", on: "function", off: "function" };
function createNullEventBusPort() {
  return { emit: () => {
  }, on: () => () => {
  }, off: () => {
  } };
}
function validateEventBusPort(port) {
  return port && typeof port.emit === "function" && typeof port.on === "function";
}
function healthCheck(port) {
  const isValid = validateEventBusPort(port);
  return {
    status: isValid ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { hasEmit: typeof port?.emit === "function", hasOn: typeof port?.on === "function", hasOff: typeof port?.off === "function" }
  };
}
var EventBusPort_default = { EventBusPortContract, createNullEventBusPort, validateEventBusPort, healthCheck, VERSION, MODULE_ID };
export {
  EventBusPortContract,
  MODULE_ID,
  VERSION,
  createNullEventBusPort,
  EventBusPort_default as default,
  healthCheck,
  validateEventBusPort
};
