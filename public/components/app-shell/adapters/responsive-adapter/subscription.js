import { listeners } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.responsive-adapter.subscription";
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  listeners.push(callback);
  return function unsubscribe() {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
export {
  MODULE_ID,
  VERSION,
  subscribe
};
