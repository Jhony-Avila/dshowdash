import { animationKeyframes } from "./keyframes.js";
import { config, customAnimations, subscribers } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.animation-api.utils";
function shouldAnimate() {
  if (!config.respectReducedMotion) return true;
  if (typeof window !== "undefined" && window.matchMedia) {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return true;
}
function notifySubscribers(event) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event);
    } catch (e) {
    }
  }
}
function getKeyframes(name) {
  if (animationKeyframes[name]) return animationKeyframes[name];
  if (customAnimations.has(name)) return customAnimations.get(name).keyframes;
  return null;
}
export {
  MODULE_ID,
  VERSION,
  getKeyframes,
  notifySubscribers,
  shouldAnimate
};
