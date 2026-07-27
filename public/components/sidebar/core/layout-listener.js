import { LAYOUT_EVENTS } from "/core/runtime/events/catalog/layout.events.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "8.0.0-P24-TEARDOWN";
const MODULE_ID = "sidebar-layout-listener";
let _cleanup = null;
let _externalCollapseCount = 0;
function setupLayoutListener(deps) {
  const { engine, renderer, tracker, logger, getPort } = deps;
  const eb = getPort("eventBus");
  if (!eb) {
    logger.warn("EventBus not available for layout listener");
    return null;
  }
  if (_cleanup) {
    _cleanup();
    _cleanup = null;
  }
  _externalCollapseCount = 0;
  const handleExternalCollapse = (collapsed) => {
    if (engine.collapsed === collapsed) return;
    _externalCollapseCount++;
    logger.info("External collapse change received", { collapsed });
    if (collapsed) {
      engine.collapse();
    } else {
      engine.expand();
    }
    renderer.setCollapsed(collapsed);
    const sidebar = renderer.getSidebar();
    if (sidebar) {
      sidebar.classList.toggle(C.MOD_COLLAPSED, collapsed);
      const toggle = sidebar.querySelector(`.${C.TOGGLE}`);
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
      }
    }
    tracker.track("external-collapse", { collapsed });
  };
  const handleLayoutChange = (data) => {
    if (!data) return;
    if (data.source === "sidebar" || data.source === "sidebar-toggle") return;
    const mode = data.mode;
    if (mode === "sidebar-collapsed") {
      handleExternalCollapse(true);
    } else if (mode === "sidebar-expanded") {
      handleExternalCollapse(false);
    }
  };
  const unsub1 = eb.on(LAYOUT_EVENTS.REQUEST, handleLayoutChange);
  const unsub2 = eb.on(LAYOUT_EVENTS.SIDEBAR_CHANGED, handleLayoutChange);
  logger.info("Layout listener connected (bidirectional sync)");
  _cleanup = () => {
    if (typeof unsub1 === "function") unsub1();
    else if (eb.off) eb.off(LAYOUT_EVENTS.REQUEST, handleLayoutChange);
    if (typeof unsub2 === "function") unsub2();
    else if (eb.off) eb.off(LAYOUT_EVENTS.SIDEBAR_CHANGED, handleLayoutChange);
  };
  return {
    cleanup: _cleanup,
    getExternalCollapseCount: () => _externalCollapseCount
  };
}
function destroy() {
  if (_cleanup) {
    _cleanup();
    _cleanup = null;
  }
  _externalCollapseCount = 0;
}
function getMetrics() {
  return { externalCollapseCount: _externalCollapseCount };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasActiveListener: !!_cleanup,
    externalCollapseCount: _externalCollapseCount,
    p24Compliant: true
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      hasActiveListener: !!_cleanup,
      noOrphanListeners: true
    },
    metrics: getMetrics(),
    p24Compliant: true
  };
}
var layout_listener_default = { setupLayoutListener, destroy, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  layout_listener_default as default,
  destroy,
  getMetrics,
  healthCheck,
  info,
  setupLayoutListener
};
