import { VERSION, MODULE_ID, BOOTSTRAP_STATES } from "../constants.js";
let _instance = null;
function getInstance(createFn, options) {
  options = options || {};
  if (!_instance) {
    _instance = createFn(options);
  }
  return _instance;
}
function resetInstance() {
  if (_instance) {
    if (typeof _instance.shutdown === "function") {
      _instance.shutdown().catch(() => {
      });
    }
    _instance = null;
  }
}
function hasInstance() {
  return _instance !== null;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    exports: ["createBootstrap", "getBootstrap", "boot"],
    states: Object.keys(BOOTSTRAP_STATES),
    sprint1: true,
    sprint2: true,
    sprint3: true,
    sprint4: true,
    sprint5: true,
    sprint6: true
  };
}
function healthCheck() {
  if (_instance && typeof _instance.healthCheck === "function") {
    return _instance.healthCheck();
  }
  return {
    status: "NOT_INITIALIZED",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var instance_default = {
  getInstance,
  resetInstance,
  hasInstance,
  info,
  healthCheck
};
export {
  instance_default as default,
  getInstance,
  hasInstance,
  healthCheck,
  info,
  resetInstance
};
