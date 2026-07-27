import { animationKeyframes } from "./keyframes.js";
import { customAnimations } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.animation-api.custom";
function registerAnimation(name, keyframes) {
  if (animationKeyframes[name]) {
    return { ok: false, error: "Cannot override built-in animation" };
  }
  customAnimations.set(name, { keyframes });
  return { ok: true };
}
function unregisterAnimation(name) {
  return customAnimations.delete(name);
}
function listAnimations() {
  const result = Object.keys(animationKeyframes).map((name) => ({
    name,
    isBuiltIn: true
  }));
  customAnimations.forEach((cfg, name) => {
    result.push({ name, isBuiltIn: false });
  });
  return result;
}
export {
  MODULE_ID,
  VERSION,
  listAnimations,
  registerAnimation,
  unregisterAnimation
};
