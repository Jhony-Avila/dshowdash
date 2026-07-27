const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-integration-mercado-livre/accessibility/announce";
let _liveRegion = null;
let _container = null;
function _ensureContainer() {
  if (!_container) {
    _container = document.createElement("div");
    _container.className = "panel-announcer-container";
    _container.setAttribute("data-announcer-owner", MODULE_ID);
    const panel = document.querySelector('[data-panel="panel-integration-mercado-livre"]') || document.querySelector(".panel-integration-mercado-livre");
    (panel || document.documentElement).appendChild(_container);
  }
  return _container;
}
function announce(message, priority = "polite") {
  if (!_liveRegion) {
    _liveRegion = document.createElement("div");
    _liveRegion.setAttribute("role", "status");
    _liveRegion.setAttribute("aria-live", "polite");
    _liveRegion.setAttribute("aria-atomic", "true");
    _liveRegion.className = "sr-only";
    _liveRegion.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;";
    _ensureContainer().appendChild(_liveRegion);
  }
  _liveRegion.setAttribute("aria-live", priority);
  _liveRegion.textContent = "";
  setTimeout(() => {
    _liveRegion.textContent = message;
  }, 100);
}
function announcePolite(message) {
  announce(message, "polite");
}
function announceAssertive(message) {
  announce(message, "assertive");
}
function destroy() {
  if (_container) {
    _container.remove();
    _container = null;
    _liveRegion = null;
  }
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID, hasLiveRegion: !!_liveRegion, noBodyAppend: true };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}
var announce_default = { announce, announcePolite, announceAssertive, destroy, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  announce,
  announceAssertive,
  announcePolite,
  announce_default as default,
  destroy,
  healthCheck,
  info
};
