import { elementHandlers, config } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.registration.element";
function handleElementTouch(element, phase, event) {
}
function addToElement(element, gesture, handler) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) return null;
  const key = el;
  if (!elementHandlers.has(key)) {
    elementHandlers.set(key, /* @__PURE__ */ new Map());
    el.addEventListener("touchstart", (e) => {
      handleElementTouch(el, "start", e);
    }, { passive: !config.preventDefaultSwipe });
    el.addEventListener("touchmove", (e) => {
      handleElementTouch(el, "move", e);
    }, { passive: !config.preventDefaultSwipe });
    el.addEventListener("touchend", (e) => {
      handleElementTouch(el, "end", e);
    }, { passive: true });
  }
  const gestures = elementHandlers.get(key);
  if (!gestures.has(gesture)) {
    gestures.set(gesture, /* @__PURE__ */ new Set());
  }
  gestures.get(gesture).add(handler);
  return function unsubscribeElement() {
    removeFromElement(el, gesture, handler);
  };
}
function removeFromElement(element, gesture, handler) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) return;
  const gestures = elementHandlers.get(el);
  if (!gestures) return;
  const gestureHandlers = gestures.get(gesture);
  if (gestureHandlers) {
    gestureHandlers.delete(handler);
  }
}
export {
  MODULE_ID,
  VERSION,
  addToElement,
  removeFromElement
};
