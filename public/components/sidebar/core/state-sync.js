import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.core.state-sync";
function syncInitialCollapsedState(deps) {
  const { engine, renderer, logger, getPort } = deps;
  const lm = getPort("layoutManager");
  let shouldBeCollapsed = false;
  let source = "default";
  if (lm && typeof lm.isSidebarCollapsed === "function") {
    shouldBeCollapsed = lm.isSidebarCollapsed();
    source = "LayoutManager";
    logger.info("Collapsed state from LayoutManager", { collapsed: shouldBeCollapsed });
  } else {
    shouldBeCollapsed = document.body.classList.contains("sidebar-collapsed");
    source = "body-class";
    logger.warn("LayoutManager not available, using body class as fallback", { collapsed: shouldBeCollapsed });
  }
  if (shouldBeCollapsed) {
    engine.collapse();
  } else {
    engine.expand();
  }
  renderer.setCollapsed(shouldBeCollapsed);
  const sidebar = renderer.getSidebar();
  if (sidebar) {
    sidebar.classList.toggle(C.MOD_COLLAPSED, shouldBeCollapsed);
    const toggle = sidebar.querySelector(`.${C.TOGGLE}`);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(!shouldBeCollapsed));
      toggle.setAttribute("aria-label", shouldBeCollapsed ? "Expandir menu" : "Recolher menu");
    }
  }
  const bodyHasClass = document.body.classList.contains("sidebar-collapsed");
  if (bodyHasClass !== shouldBeCollapsed && lm && typeof lm.setSidebarCollapsed === "function") {
    logger.warn("Body class mismatch, requesting LayoutManager sync", {
      bodyHasClass,
      shouldBeCollapsed
    });
    lm.setSidebarCollapsed(shouldBeCollapsed);
  }
  logger.info("Initial state synced (LayoutManager-Driven)", {
    shouldBeCollapsed,
    source,
    bodyClassMatch: document.body.classList.contains("sidebar-collapsed") === shouldBeCollapsed
  });
  return { shouldBeCollapsed, source };
}
var state_sync_default = { syncInitialCollapsedState };
export {
  MODULE_ID,
  VERSION,
  state_sync_default as default,
  syncInitialCollapsedState
};
