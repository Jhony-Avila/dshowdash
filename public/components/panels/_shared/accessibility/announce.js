const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/_shared/accessibility/announce";
let _liveRegion = null;
function ensureLiveRegion() {
  if (_liveRegion && document.contains(_liveRegion)) return _liveRegion;
  _liveRegion = document.createElement("div");
  _liveRegion.setAttribute("role", "status");
  _liveRegion.setAttribute("aria-live", "polite");
  _liveRegion.setAttribute("aria-atomic", "true");
  _liveRegion.className = "sr-only";
  _liveRegion.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
  document.body.appendChild(_liveRegion);
  return _liveRegion;
}
function announce(message, priority = "polite") {
  const region = ensureLiveRegion();
  region.setAttribute("aria-live", priority);
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
function announcePolite(message) {
  announce(message, "polite");
}
function announceAssertive(message) {
  announce(message, "assertive");
}
function announceLoading(context = "") {
  announce(`Carregando ${context}...`.trim(), "polite");
}
function announceLoaded(context = "") {
  announce(`${context} carregado com sucesso`.trim(), "polite");
}
function announceError(message) {
  announce(`Erro: ${message}`, "assertive");
}
function destroy() {
  if (_liveRegion && _liveRegion.parentNode) {
    _liveRegion.parentNode.removeChild(_liveRegion);
  }
  _liveRegion = null;
}
var announce_default = { announce, announcePolite, announceAssertive, announceLoading, announceLoaded, announceError, destroy, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  announce,
  announceAssertive,
  announceError,
  announceLoaded,
  announceLoading,
  announcePolite,
  announce_default as default,
  destroy
};
