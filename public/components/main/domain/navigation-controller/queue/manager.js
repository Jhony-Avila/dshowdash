const MODULE_ID = "navigation-controller-queue";
const VERSION = "8.1.0-ABORT-FIX";
function queueNavigation(state, telemetry, route, options) {
  state.metrics.navigationsQueued++;
  return new Promise((resolve, reject) => {
    state.navigationQueue.push({
      route,
      options,
      resolve,
      reject
    });
    if (telemetry && telemetry.track) {
      telemetry.track("navigation:queued", {
        route,
        queueSize: state.navigationQueue.length
      });
    }
  });
}
function processQueue(state, navigateFn) {
  const queue = state.navigationQueue;
  if (queue.length === 0) return;
  const next = queue.shift();
  navigateFn(next.route, next.options).then((result) => {
    next.resolve(result);
  }).catch((err) => {
    next.reject(err);
  });
}
function clearQueue(state) {
  const queue = state.navigationQueue;
  const cleared = queue.length;
  for (let i = 0; i < queue.length; i++) {
    queue[i].reject(new Error("Navigation queue cleared"));
  }
  state.navigationQueue = [];
  return cleared;
}
function getQueueSize(state) {
  return state.navigationQueue.length;
}
var manager_default = {
  queueNavigation,
  processQueue,
  clearQueue,
  getQueueSize
};
export {
  MODULE_ID,
  VERSION,
  clearQueue,
  manager_default as default,
  getQueueSize,
  processQueue,
  queueNavigation
};
