import { config } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.template-registry.config";
function configure(newConfig) {
  if (!newConfig || typeof newConfig !== "object") return false;
  Object.assign(config, newConfig);
  return true;
}
function getConfig() {
  return { ...config };
}
export {
  MODULE_ID,
  VERSION,
  configure,
  getConfig
};
