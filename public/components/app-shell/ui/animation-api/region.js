import { ANIMATIONS } from "./constants.js";
import { config } from "./state.js";
import { animate } from "./core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.animation-api.region";
function transitionIn(regionName, animation, options) {
  animation = animation || ANIMATIONS.FADE_IN;
  const regionId = `shell-${regionName}-region`;
  return animate(`#${regionId}`, animation, options);
}
function transitionOut(regionName, animation, options) {
  animation = animation || ANIMATIONS.FADE_OUT;
  const regionId = `shell-${regionName}-region`;
  return animate(`#${regionId}`, animation, options);
}
function crossfade(regionName, updateFn, options) {
  options = options || {};
  const duration = options.duration || config.defaultDuration;
  return transitionOut(regionName, ANIMATIONS.FADE_OUT, { duration: duration / 2 }).then(() => {
    if (typeof updateFn === "function") {
      updateFn();
    }
    return transitionIn(regionName, ANIMATIONS.FADE_IN, { duration: duration / 2 });
  });
}
export {
  MODULE_ID,
  VERSION,
  crossfade,
  transitionIn,
  transitionOut
};
