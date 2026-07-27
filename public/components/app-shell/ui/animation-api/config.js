import { config } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.animation-api.config";
function configure(options) {
  if (options.defaultDuration !== void 0) {
    config.defaultDuration = Math.max(0, options.defaultDuration);
  }
  if (options.defaultEasing !== void 0) {
    config.defaultEasing = options.defaultEasing;
  }
  if (options.respectReducedMotion !== void 0) {
    config.respectReducedMotion = !!options.respectReducedMotion;
  }
  if (options.defaultFill !== void 0) {
    config.defaultFill = options.defaultFill;
  }
}
function getConfig() {
  return Object.assign({}, config);
}
export {
  MODULE_ID,
  VERSION,
  configure,
  getConfig
};
