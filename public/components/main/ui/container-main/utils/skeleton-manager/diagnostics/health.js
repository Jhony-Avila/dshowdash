import { VERSION, MODULE_ID, SKELETON_TYPES } from "../constants.js";
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    types: Object.keys(SKELETON_TYPES).map((k) => SKELETON_TYPES[k])
  };
}
function healthCheck(instance) {
  if (instance && typeof instance.healthCheck === "function") {
    return instance.healthCheck();
  }
  return {
    status: "NOT_INITIALIZED",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var health_default = {
  info,
  healthCheck
};
export {
  health_default as default,
  healthCheck,
  info
};
