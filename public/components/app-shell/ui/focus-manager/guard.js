import { focusGuards } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.focus-manager.guard";
function createGuard(id, selector) {
  if (focusGuards.has(id)) {
    return { ok: false, error: "Guard already exists" };
  }
  const handleFocusin = (e) => {
    if (e.target.matches(selector)) {
      e.preventDefault();
      e.target.blur();
    }
  };
  document.addEventListener("focusin", handleFocusin, true);
  focusGuards.set(id, {
    id,
    selector,
    handler: handleFocusin
  });
  return { ok: true };
}
function removeGuard(id) {
  const guard = focusGuards.get(id);
  if (!guard) return false;
  document.removeEventListener("focusin", guard.handler, true);
  focusGuards.delete(id);
  return true;
}
export {
  MODULE_ID,
  VERSION,
  createGuard,
  removeGuard
};
