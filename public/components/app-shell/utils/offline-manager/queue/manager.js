import { state, config, incrementMetric, notifySubscribers } from "../state.js";
import { saveQueue, clearQueue } from "../storage/queue.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.offline-manager.queue.manager";
function queueAction(action) {
  if (!action || !action.type) {
    return { ok: false, error: "Invalid action" };
  }
  if (state.pendingActions.length >= config.maxQueueSize) {
    return { ok: false, error: "Queue full" };
  }
  const queuedAction = {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: action.type,
    data: action.data || {},
    endpoint: action.endpoint || null,
    method: action.method || "POST",
    createdAt: Date.now(),
    retries: 0
  };
  state.pendingActions.push(queuedAction);
  incrementMetric("actionsQueued");
  saveQueue();
  notifySubscribers({
    type: "action-queued",
    action: queuedAction,
    queueSize: state.pendingActions.length,
    timestamp: Date.now()
  });
  return { ok: true, actionId: queuedAction.id };
}
function removeAction(actionId) {
  let index = -1;
  for (let i = 0; i < state.pendingActions.length; i++) {
    if (state.pendingActions[i].id === actionId) {
      index = i;
      break;
    }
  }
  if (index >= 0) {
    state.pendingActions.splice(index, 1);
    saveQueue();
    return true;
  }
  return false;
}
function getPendingActions() {
  return state.pendingActions.slice();
}
function getPendingCount() {
  return state.pendingActions.length;
}
function clearPending() {
  clearQueue();
  notifySubscribers({
    type: "queue-cleared",
    timestamp: Date.now()
  });
  return { ok: true };
}
export {
  MODULE_ID,
  VERSION,
  clearPending,
  getPendingActions,
  getPendingCount,
  queueAction,
  removeAction
};
