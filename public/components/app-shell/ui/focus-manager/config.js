import { config } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.focus-manager.config";
function configure(options) {
  if (options.historyLimit !== void 0) {
    config.historyLimit = Math.max(10, options.historyLimit);
  }
  if (options.announceOnFocus !== void 0) {
    config.announceOnFocus = !!options.announceOnFocus;
  }
  if (options.scrollIntoView !== void 0) {
    config.scrollIntoView = !!options.scrollIntoView;
  }
  if (options.preventScroll !== void 0) {
    config.preventScroll = !!options.preventScroll;
  }
  if (options.focusDelay !== void 0) {
    config.focusDelay = Math.max(0, options.focusDelay);
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
