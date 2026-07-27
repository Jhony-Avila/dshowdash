const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-uarps-monitor:ui/events";
function bindEvents(container, callbacks) {
  if (!container) return;
  container.querySelectorAll('[data-action="refresh"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      if (callbacks.canRefresh()) callbacks.refresh();
    });
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  bindEvents,
  info
};
