import { state, config } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.offline-manager.storage.queue";
function loadQueue() {
  if (!config.queuePersist) return;
  try {
    const data = localStorage.getItem(config.storageKey);
    if (data) {
      state.pendingActions = JSON.parse(data);
    }
  } catch (e) {
  }
}
function saveQueue() {
  if (!config.queuePersist) return;
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(state.pendingActions));
  } catch (e) {
  }
}
function clearQueue() {
  state.pendingActions = [];
  try {
    localStorage.removeItem(config.storageKey);
  } catch (e) {
  }
}
export {
  MODULE_ID,
  VERSION,
  clearQueue,
  loadQueue,
  saveQueue
};
