import { config, queue } from "./state.js";
const VERSION = "3.0.0-ELEVATION";
const MODULE_ID = "overlay-layer.kernel.pending-queue.size";
function size() {
  return queue.length;
}
function isEmpty() {
  return queue.length === 0;
}
function isFull() {
  return queue.length >= config.maxSize;
}
export {
  MODULE_ID,
  VERSION,
  isEmpty,
  isFull,
  size
};
