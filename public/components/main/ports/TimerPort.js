const VERSION = "1.0.0-P1-HEX";
const MODULE_ID = "main-timer-port";
const TimerPortContract = {
  setTimeout: "function",
  clearTimeout: "function",
  setInterval: "function",
  clearInterval: "function",
  delay: "function"
};
function createNullTimerPort() {
  const nullTimeouts = /* @__PURE__ */ new Set();
  let nextId = 1;
  return {
    setTimeout: (fn, ms) => {
      const id = nextId++;
      nullTimeouts.add(id);
      return id;
    },
    clearTimeout: (id) => {
      nullTimeouts.delete(id);
    },
    setInterval: (fn, ms) => {
      const id = nextId++;
      nullTimeouts.add(id);
      return id;
    },
    clearInterval: (id) => {
      nullTimeouts.delete(id);
    },
    delay: (ms) => Promise.resolve(),
    info: () => ({ type: "null", pendingTimers: nullTimeouts.size })
  };
}
function validateTimerPort(port) {
  if (!port) return false;
  return typeof port.setTimeout === "function" && typeof port.clearTimeout === "function" && typeof port.setInterval === "function" && typeof port.clearInterval === "function";
}
function healthCheck(port) {
  const isValid = validateTimerPort(port);
  return {
    status: isValid ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      hasSetTimeout: typeof port?.setTimeout === "function",
      hasClearTimeout: typeof port?.clearTimeout === "function",
      hasSetInterval: typeof port?.setInterval === "function",
      hasClearInterval: typeof port?.clearInterval === "function",
      hasDelay: typeof port?.delay === "function"
    }
  };
}
var TimerPort_default = {
  TimerPortContract,
  createNullTimerPort,
  validateTimerPort,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  TimerPortContract,
  VERSION,
  createNullTimerPort,
  TimerPort_default as default,
  healthCheck,
  validateTimerPort
};
