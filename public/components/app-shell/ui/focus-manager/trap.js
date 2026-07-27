import { focusTraps, metrics } from "./state.js";
import { getFocusableElements, notifySubscribers } from "./utils.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.focus-manager.trap";
function createTrap(id, container, options) {
  options = options || {};
  const element = typeof container === "string" ? document.querySelector(container) : container;
  if (!element) {
    return { ok: false, error: "Container not found" };
  }
  if (focusTraps.has(id)) {
    return { ok: false, error: `Trap already exists: ${id}` };
  }
  const focusables = getFocusableElements(element);
  if (focusables.length === 0) {
    return { ok: false, error: "No focusable elements in container" };
  }
  const handleKeydown = (e) => {
    if (e.key !== "Tab") return;
    const currentFocusables = getFocusableElements(element);
    if (currentFocusables.length === 0) return;
    const first = currentFocusables[0];
    const last = currentFocusables[currentFocusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  element.addEventListener("keydown", handleKeydown);
  const trap = {
    id,
    container: element,
    handler: handleKeydown,
    active: true,
    previousFocus: document.activeElement,
    createdAt: Date.now()
  };
  focusTraps.set(id, trap);
  metrics.trapsActivated++;
  if (options.autoFocus !== false) {
    focusables[0].focus();
  }
  notifySubscribers({
    type: "trap-created",
    id,
    container: element,
    timestamp: Date.now()
  });
  return { ok: true, trap: id };
}
function releaseTrap(id, options) {
  options = options || {};
  const trap = focusTraps.get(id);
  if (!trap) {
    return { ok: false, error: `Trap not found: ${id}` };
  }
  trap.container.removeEventListener("keydown", trap.handler);
  focusTraps.delete(id);
  if (options.restoreFocus !== false && trap.previousFocus && document.contains(trap.previousFocus)) {
    trap.previousFocus.focus();
  }
  notifySubscribers({
    type: "trap-released",
    id,
    timestamp: Date.now()
  });
  return { ok: true };
}
function hasTrap(id) {
  return focusTraps.has(id);
}
function getActiveTraps() {
  const traps = [];
  focusTraps.forEach((trap, id) => {
    traps.push({ id, active: trap.active, createdAt: trap.createdAt });
  });
  return traps;
}
export {
  MODULE_ID,
  VERSION,
  createTrap,
  getActiveTraps,
  hasTrap,
  releaseTrap
};
