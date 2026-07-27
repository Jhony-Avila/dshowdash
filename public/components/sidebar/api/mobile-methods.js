import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import * as Ports from "./ports.js";
const VERSION = "1.0.0";
const MODULE_ID = "sidebar-mobile-methods";
function createMobileMethods(dependencies) {
  const { engine, renderer, logger } = dependencies;
  return {
    openMobile() {
      try {
        engine.openMobile();
        renderer.setMobileOpen(true);
        const lm = Ports.get("layoutManager");
        const eb = Ports.get("eventBus");
        if (lm?.setSidebarMobileOpen) {
          lm.setSidebarMobileOpen(true);
        } else if (eb?.emit) {
          eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: "sidebar-mobile-open", source: "sidebar" });
        }
      } catch (error) {
        logger?.error?.("OpenMobile error:", error);
      }
    },
    closeMobile() {
      try {
        engine.closeMobile();
        renderer.setMobileOpen(false);
        const lm = Ports.get("layoutManager");
        const eb = Ports.get("eventBus");
        if (lm?.setSidebarMobileOpen) {
          lm.setSidebarMobileOpen(false);
        } else if (eb?.emit) {
          eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: "sidebar-mobile-closed", source: "sidebar" });
        }
      } catch (error) {
        logger?.error?.("CloseMobile error:", error);
      }
    },
    toggleMobile() {
      try {
        engine.toggleMobile();
        renderer.setMobileOpen(engine.mobileOpen);
        const mode = engine.mobileOpen ? "sidebar-mobile-open" : "sidebar-mobile-closed";
        const lm = Ports.get("layoutManager");
        const eb = Ports.get("eventBus");
        if (lm?.setSidebarMobileOpen) {
          lm.setSidebarMobileOpen(engine.mobileOpen);
        } else if (eb?.emit) {
          eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode, source: "sidebar" });
        }
      } catch (error) {
        logger?.error?.("ToggleMobile error:", error);
      }
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { factoryReady: true }
  };
}
var mobile_methods_default = { createMobileMethods, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createMobileMethods,
  mobile_methods_default as default,
  healthCheck,
  info
};
