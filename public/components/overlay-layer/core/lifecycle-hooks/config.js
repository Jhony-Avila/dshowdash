import { config, updateConfig, setLogger } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lifecycle-hooks.config";
function inject(dependencies) {
  if (dependencies.logger) setLogger(dependencies.logger);
}
function configure(newConfig) {
  if (!newConfig || typeof newConfig !== "object") return false;
  updateConfig(newConfig);
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
  inject,
  isEnabled
};
