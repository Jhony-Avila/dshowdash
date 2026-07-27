const VERSION = "1.0.0-P1-HEX";
const MODULE_ID = "main-globals-port";
const GlobalsPortContract = {
  getGlobal: "function",
  hasGlobal: "function",
  getDocument: "function",
  getBody: "function",
  getBodyAttribute: "function"
};
function createNullGlobalsPort() {
  const mockGlobals = /* @__PURE__ */ new Map();
  return {
    getGlobal: (name) => mockGlobals.get(name) || null,
    hasGlobal: (name) => mockGlobals.has(name),
    setMockGlobal: (name, value) => mockGlobals.set(name, value),
    getDocument: () => null,
    getBody: () => null,
    getBodyAttribute: (attr) => null,
    getBodyDataset: () => ({}),
    info: () => ({ type: "null", mockGlobals: Array.from(mockGlobals.keys()) })
  };
}
function validateGlobalsPort(port) {
  if (!port) return false;
  return typeof port.getGlobal === "function" && typeof port.hasGlobal === "function";
}
function healthCheck(port) {
  const isValid = validateGlobalsPort(port);
  return {
    status: isValid ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      hasGetGlobal: typeof port?.getGlobal === "function",
      hasHasGlobal: typeof port?.hasGlobal === "function",
      hasGetDocument: typeof port?.getDocument === "function",
      hasGetBody: typeof port?.getBody === "function",
      hasGetBodyAttribute: typeof port?.getBodyAttribute === "function"
    }
  };
}
var GlobalsPort_default = {
  GlobalsPortContract,
  createNullGlobalsPort,
  validateGlobalsPort,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  GlobalsPortContract,
  MODULE_ID,
  VERSION,
  createNullGlobalsPort,
  GlobalsPort_default as default,
  healthCheck,
  validateGlobalsPort
};
