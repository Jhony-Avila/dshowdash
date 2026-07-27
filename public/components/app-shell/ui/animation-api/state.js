import { EASINGS } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.animation-api.state";
const activeAnimations = /* @__PURE__ */ new Map();
const customAnimations = /* @__PURE__ */ new Map();
const subscribers = [];
const animationId = { value: 0 };
const config = {
  defaultDuration: 300,
  defaultEasing: EASINGS.EASE_OUT,
  respectReducedMotion: true,
  defaultFill: "forwards"
};
const metrics = {
  animationsStarted: 0,
  animationsCompleted: 0,
  animationsCancelled: 0,
  errors: 0
};
function incrementMetric(name, value) {
  if (metrics[name] !== void 0) {
    metrics[name] += value || 1;
  }
}
function getMetrics() {
  return Object.assign({}, metrics);
}
function notifySubscribers(event, data) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event, data);
    } catch (e) {
    }
  }
}
function resetMetrics() {
  metrics.animationsStarted = 0;
  metrics.animationsCompleted = 0;
  metrics.animationsCancelled = 0;
  metrics.errors = 0;
}
export {
  MODULE_ID,
  VERSION,
  activeAnimations,
  animationId,
  config,
  customAnimations,
  getMetrics,
  incrementMetric,
  metrics,
  notifySubscribers,
  resetMetrics,
  subscribers
};
