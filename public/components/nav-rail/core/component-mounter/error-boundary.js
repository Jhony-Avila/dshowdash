import { MODULE_ID } from "./constants.js";
const VERSION = "3.1.0-ES6";
let _getPort = () => null;
let _retryFn = null;
function setDependencies(getPortFn, retryFn) {
  _getPort = getPortFn;
  _retryFn = retryFn;
}
function renderErrorButton(host, id, errorMsg) {
  const safeId = id.replace(/['"]/g, "");
  const safeMsg = (errorMsg || "Unknown error").replace(/['"<>]/g, "").substring(0, 100);
  host.innerHTML = `<button class="navrail-btn navrail-btn--error" data-component-id="${safeId}" data-error="true" title="Error loading ${safeId}: ${safeMsg}. Click to retry." aria-label="Retry loading ${safeId}"><span class="navrail-btn__icon navrail-btn__icon--error">\u26A0\uFE0F</span></button>`;
  const btn = host.querySelector(".navrail-btn--error");
  if (btn && _retryFn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      _retryFn(safeId);
    });
  }
}
function track(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(eventName, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data));
  }
  if (typeof window !== "undefined" && window.NavRailTracker && window.NavRailTracker.track) {
    window.NavRailTracker.track(eventName, data);
  }
}
var error_boundary_default = {
  renderErrorButton,
  track,
  setDependencies
};
export {
  VERSION,
  error_boundary_default as default,
  renderErrorButton,
  setDependencies,
  track
};
