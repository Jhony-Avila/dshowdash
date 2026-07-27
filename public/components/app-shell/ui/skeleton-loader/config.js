import { config } from "./state.js";
import { injectStyles, removeStyles } from "./styles.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.skeleton-loader.config";
function configure(options) {
  if (options.animationType) config.animationType = options.animationType;
  if (options.animationDuration) config.animationDuration = options.animationDuration;
  if (options.baseColor) config.baseColor = options.baseColor;
  if (options.highlightColor) config.highlightColor = options.highlightColor;
  if (options.borderRadius) config.borderRadius = options.borderRadius;
  removeStyles();
  injectStyles();
}
function getConfig() {
  return {
    animationType: config.animationType,
    animationDuration: config.animationDuration,
    baseColor: config.baseColor,
    highlightColor: config.highlightColor,
    borderRadius: config.borderRadius
  };
}
export {
  MODULE_ID,
  VERSION,
  configure,
  getConfig
};
