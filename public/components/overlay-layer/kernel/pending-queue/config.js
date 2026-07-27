import { config } from "./state.js";
import { stopAutoProcess } from "./process.js";
const VERSION = "3.0.0-ELEVATION";
const MODULE_ID = "overlay-layer.kernel.pending-queue.config";
function configure(newConfig) {
  if (!newConfig || typeof newConfig !== "object") return false;
  Object.assign(config, newConfig);
  if (config.maxSize < 1) config.maxSize = 1;
  if (config.maxAge < 1e3) config.maxAge = 1e3;
  if (config.processInterval < 1e3) config.processInterval = 1e3;
  return true;
}
function getConfig() {
  return { ...config };
}
function enable() {
  config.enabled = true;
}
function disable() {
  config.enabled = false;
  stopAutoProcess();
}
function isEnabled() {
  return config.enabled;
}
export {
  MODULE_ID,
  VERSION,
  configure,
  disable,
  enable,
  getConfig,
  isEnabled
};
