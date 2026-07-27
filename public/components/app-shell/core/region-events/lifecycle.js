const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-events.lifecycle";
import { initialized, domListenersAttached } from "./state.js";
import { onFocusIn, onFocusOut, onClick } from "./dom-listeners.js";
function init() {
  if (initialized.value) return true;
  if (typeof document === "undefined") return false;
  document.addEventListener("focusin", onFocusIn, true);
  document.addEventListener("focusout", onFocusOut, true);
  document.addEventListener("click", onClick, true);
  domListenersAttached.value = true;
  initialized.value = true;
  return true;
}
function destroy() {
  if (!initialized.value) return true;
  if (domListenersAttached.value) {
    document.removeEventListener("focusin", onFocusIn, true);
    document.removeEventListener("focusout", onFocusOut, true);
    document.removeEventListener("click", onClick, true);
    domListenersAttached.value = false;
  }
  initialized.value = false;
  return true;
}
export {
  MODULE_ID,
  VERSION,
  destroy,
  init
};
