import { OFFLINE_STATES } from "../constants.js";
import { getConfig, getState, setState, getOfflineQueue, setOfflineQueue, addToQueue, incrementMetric } from "../state.js";
import { _log, _emit } from "../helpers/logger.js";
import { _saveState } from "../helpers/storage.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.offline-mode-manager.network.queue";
async function _processOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0 || getState() !== OFFLINE_STATES.ONLINE) return;
  const config = getConfig();
  setState(OFFLINE_STATES.SYNCING);
  _emit("syncStart", { queueSize: queue.length });
  incrementMetric("syncAttempts");
  const currentQueue = [...queue];
  setOfflineQueue([]);
  let successCount = 0;
  for (const request of currentQueue) {
    try {
      const response = await fetch(request.url, request.options);
      if (response.ok) {
        successCount++;
        if (request.callback) {
          request.callback(null, response);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      _log("warn", "Failed to process queued request:", request.url, error.message);
      if (request.attempts < config.retryAttempts) {
        addToQueue({ ...request, attempts: request.attempts + 1 });
      } else if (request.callback) {
        request.callback(error, null);
      }
    }
  }
  setState(OFFLINE_STATES.ONLINE);
  _saveState();
  if (successCount > 0) {
    incrementMetric("syncSuccesses");
  }
  _emit("syncComplete", { processed: currentQueue.length, successful: successCount, remaining: getOfflineQueue().length });
  _log("info", `Sync complete: ${successCount}/${currentQueue.length} requests processed`);
}
function queueRequest(url, options = {}, callback = null) {
  const config = getConfig();
  if (!config.queueOfflineRequests) {
    _log("warn", "Offline queue disabled");
    return false;
  }
  addToQueue({
    url,
    options,
    callback,
    attempts: 0,
    timestamp: Date.now()
  });
  incrementMetric("queuedRequests");
  _saveState();
  _emit("requestQueued", { url, queueSize: getOfflineQueue().length });
  return true;
}
export {
  MODULE_ID,
  VERSION,
  _processOfflineQueue,
  queueRequest
};
