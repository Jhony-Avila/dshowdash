import { _state, _subscribers } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.helpers.notify";
function notifySubscribers(event) {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](event);
    } catch (e) {
    }
  }
}
function updateState(newState, data) {
  const oldState = _state.state;
  _state.state = newState;
  if (data) {
    if (data.registration !== void 0) _state.registration = data.registration;
    if (data.updateAvailable !== void 0) _state.updateAvailable = data.updateAvailable;
    if (data.waitingWorker !== void 0) _state.waitingWorker = data.waitingWorker;
    if (data.error !== void 0) _state.error = data.error;
  }
  notifySubscribers({
    type: "state-changed",
    from: oldState,
    to: newState,
    data,
    timestamp: Date.now()
  });
}
export {
  MODULE_ID,
  VERSION,
  notifySubscribers,
  updateState
};
