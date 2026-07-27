import { config } from "./state.js";
import { updateContainerPosition } from "./container.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.notification-center.config";
function configure(options) {
  if (options.position !== void 0) {
    config.position = options.position;
    updateContainerPosition();
  }
  if (options.maxVisible !== void 0) {
    config.maxVisible = Math.max(1, options.maxVisible);
  }
  if (options.defaultDuration !== void 0) {
    config.defaultDuration = options.defaultDuration;
  }
  if (options.animationDuration !== void 0) {
    config.animationDuration = options.animationDuration;
  }
  if (options.pauseOnHover !== void 0) {
    config.pauseOnHover = !!options.pauseOnHover;
  }
  if (options.showProgress !== void 0) {
    config.showProgress = !!options.showProgress;
  }
  if (options.groupSimilar !== void 0) {
    config.groupSimilar = !!options.groupSimilar;
  }
}
function getConfig() {
  return Object.assign({}, config);
}
function setPosition(position) {
  config.position = position;
  updateContainerPosition();
}
export {
  MODULE_ID,
  VERSION,
  configure,
  getConfig,
  setPosition
};
