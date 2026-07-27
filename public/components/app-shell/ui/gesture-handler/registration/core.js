import { handlers } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.registration.core";
function on(gesture, handler) {
  if (!handlers.has(gesture)) {
    handlers.set(gesture, /* @__PURE__ */ new Set());
  }
  handlers.get(gesture).add(handler);
  return () => {
    off(gesture, handler);
  };
}
function off(gesture, handler) {
  const gestureHandlers = handlers.get(gesture);
  if (gestureHandlers) {
    gestureHandlers.delete(handler);
  }
}
function once(gesture, handler) {
  const wrapper = (data) => {
    off(gesture, wrapper);
    handler(data);
  };
  return on(gesture, wrapper);
}
function offAll(gesture) {
  if (gesture) {
    handlers.delete(gesture);
  } else {
    handlers.clear();
  }
}
export {
  MODULE_ID,
  VERSION,
  off,
  offAll,
  on,
  once
};
