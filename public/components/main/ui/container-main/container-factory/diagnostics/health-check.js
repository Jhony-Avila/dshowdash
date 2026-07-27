import { VERSION, MODULE_ID } from "../constants.js";
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    modular: true
  };
}
var health_check_default = { healthCheck };
export {
  health_check_default as default,
  healthCheck
};
