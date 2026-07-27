import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "3.0.0-ELEVATION";
const MODULE_ID = "overlay-layer.kernel.pending-queue.state";
const config = { ...DEFAULT_CONFIG };
let queue = [];
const state = {
  processIntervalId: null,
  totalEnqueued: 0,
  totalProcessed: 0,
  totalExpired: 0,
  totalFailed: 0,
  lastProcess: null
};
const refs = {
  openOverlay: null,
  canOpenOverlay: null,
  eventBus: null
};
function setQueue(newQueue) {
  queue = newQueue;
}
function getQueue() {
  return queue;
}
export {
  MODULE_ID,
  VERSION,
  config,
  getQueue,
  queue,
  refs,
  setQueue,
  state
};
