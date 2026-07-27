const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.notification-center.state";
const notifications = /* @__PURE__ */ new Map();
const notificationId = { value: 0 };
const containerElement = { value: null };
const subscribers = [];
const queue = [];
const processing = { value: false };
const stylesInjected = { value: false };
const config = {
  position: "top-right",
  maxVisible: 5,
  defaultDuration: 5e3,
  animationDuration: 300,
  pauseOnHover: true,
  stackSpacing: 12,
  showProgress: true,
  groupSimilar: true,
  soundEnabled: false,
  queueOverflow: true
};
const metrics = {
  shown: 0,
  dismissed: 0,
  clicked: 0,
  expired: 0,
  queued: 0
};
function resetMetrics() {
  metrics.shown = 0;
  metrics.dismissed = 0;
  metrics.clicked = 0;
  metrics.expired = 0;
  metrics.queued = 0;
}
function incrementMetric(key) {
  if (metrics.hasOwnProperty(key)) {
    metrics[key]++;
  }
}
function notifySubscribers(event, data) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event, data);
    } catch (e) {
    }
  }
}
function getConfig() {
  return Object.assign({}, config);
}
function setConfig(key, value) {
  if (config.hasOwnProperty(key)) {
    config[key] = value;
  }
}
function getMetrics() {
  return Object.assign({}, metrics);
}
export {
  MODULE_ID,
  VERSION,
  config,
  containerElement,
  getConfig,
  getMetrics,
  incrementMetric,
  metrics,
  notificationId,
  notifications,
  notifySubscribers,
  processing,
  queue,
  resetMetrics,
  setConfig,
  stylesInjected,
  subscribers
};
