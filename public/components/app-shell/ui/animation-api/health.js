import { VERSION, MODULE_ID } from "./constants.js";
import { activeAnimations, customAnimations, subscribers, config, metrics } from "./state.js";
import { shouldAnimate } from "./utils.js";
import { getConfig } from "./config.js";
import { getActive } from "./control.js";
import { listAnimations } from "./custom.js";
function getMetrics() {
  return {
    animationsStarted: metrics.animationsStarted,
    animationsCompleted: metrics.animationsCompleted,
    animationsCancelled: metrics.animationsCancelled,
    activeAnimations: activeAnimations.size,
    customAnimations: customAnimations.size,
    reducedMotionActive: !shouldAnimate()
  };
}
function healthCheck() {
  const checks = {
    webAnimationsSupported: typeof Element !== "undefined" && typeof Element.prototype.animate === "function",
    noExcessiveActive: activeAnimations.size < 20,
    configValid: config.defaultDuration > 0
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    metrics: getMetrics(),
    reducedMotion: !shouldAnimate(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    metrics: getMetrics(),
    activeAnimations: getActive(),
    availableAnimations: listAnimations().length,
    reducedMotion: !shouldAnimate(),
    subscriberCount: subscribers.length,
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
