import { handlers, subscribers, incrementMetric } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.helpers.notify";
function notifySubscribers(event) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event);
    } catch (e) {
    }
  }
}
function triggerHandlers(gesture, data) {
  const gestureHandlers = handlers.get(gesture);
  if (!gestureHandlers) return;
  gestureHandlers.forEach((handler) => {
    try {
      handler(data);
    } catch (e) {
    }
  });
  incrementMetric("gesturesDetected");
  notifySubscribers({
    type: "gesture-detected",
    gesture,
    data,
    timestamp: Date.now()
  });
}
export {
  MODULE_ID,
  VERSION,
  notifySubscribers,
  triggerHandlers
};
