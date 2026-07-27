import { subscribers } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.notification-center.subscription";
function notifySubscribers(event) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event);
    } catch (e) {
    }
  }
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  subscribers.push(callback);
  return function unsubscribe() {
    const idx = subscribers.indexOf(callback);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}
export {
  MODULE_ID,
  VERSION,
  notifySubscribers,
  subscribe
};
