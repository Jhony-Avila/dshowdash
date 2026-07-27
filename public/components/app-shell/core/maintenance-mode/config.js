import { config } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.maintenance-mode.config";
function configure(options) {
  if (options.showBanner !== void 0) {
    config.showBanner = !!options.showBanner;
  }
  if (options.bannerPosition !== void 0) {
    config.bannerPosition = options.bannerPosition;
  }
  if (options.blockInteraction !== void 0) {
    config.blockInteraction = !!options.blockInteraction;
  }
  if (options.allowDismiss !== void 0) {
    config.allowDismiss = !!options.allowDismiss;
  }
  if (options.persistState !== void 0) {
    config.persistState = !!options.persistState;
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
