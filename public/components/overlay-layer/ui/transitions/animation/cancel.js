import { getActiveTransitions } from "../state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.transitions.animation.cancel";
function cancel(element) {
  if (!element) return { ok: false, error: "invalid-element" };
  let cancelled = 0;
  if (typeof element.getAnimations === "function") {
    const animations = element.getAnimations();
    for (const anim of animations) {
      anim.cancel();
      cancelled++;
    }
  }
  element.style.transition = "";
  element.style.transform = "";
  element.style.opacity = "";
  return { ok: true, cancelled };
}
function cancelAll() {
  let cancelled = 0;
  const activeTransitions = getActiveTransitions();
  for (const [id, animation] of activeTransitions) {
    try {
      animation.cancel();
      cancelled++;
    } catch (e) {
    }
  }
  activeTransitions.clear();
  return { ok: true, cancelled };
}
function getActiveCount() {
  return getActiveTransitions().size;
}
export {
  MODULE_ID,
  VERSION,
  cancel,
  cancelAll,
  getActiveCount
};
