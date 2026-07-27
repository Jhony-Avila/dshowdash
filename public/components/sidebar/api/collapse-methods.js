import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
import * as Ports from "./ports.js";
import * as Metrics from "./metrics.js";
const VERSION = "2.0.0-NCS";
const MODULE_ID = "sidebar-collapse-methods";
let _toggleDebounce = null;
const TOGGLE_DEBOUNCE_MS = 150;
function applyCollapsedStateAtomic(collapsed, deps) {
  const { engine, renderer, logger } = deps;
  const startTime = performance.now();
  const targetState = collapsed;
  const results = {
    engine: false,
    renderer: false,
    sidebarDOM: false,
    toggleButton: false,
    body: false,
    localStorage: false
  };
  try {
    if (targetState) {
      engine.collapse();
    } else {
      engine.expand();
    }
    results.engine = true;
    renderer.setCollapsed(targetState);
    results.renderer = true;
    const sidebar = renderer.getSidebar?.() || document.querySelector(`.${C.ROOT}`);
    if (sidebar) {
      sidebar.classList.toggle(C.MOD_COLLAPSED, targetState);
      results.sidebarDOM = true;
      const toggle = sidebar.querySelector(`.${C.TOGGLE}`);
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(!targetState));
        toggle.setAttribute("aria-label", targetState ? "Expandir menu" : "Recolher menu");
        results.toggleButton = true;
      }
    }
    const lm = Ports.get("layoutManager");
    const eb = Ports.get("eventBus");
    if (lm?.setSidebarCollapsed) {
      lm.setSidebarCollapsed(targetState);
      results.body = true;
    } else if (eb?.emit) {
      eb.emit(UI_INTENTS.REQUEST_LAYOUT, {
        mode: targetState ? "sidebar-collapsed" : "sidebar-expanded",
        source: "sidebar-toggle"
      });
      results.body = true;
    } else {
      document.body.classList.toggle("sidebar-collapsed", targetState);
      results.body = true;
      Metrics.increment("fallbackUsed");
    }
    try {
      localStorage.setItem("dshowdash-layout-sidebarCollapsed", JSON.stringify(targetState));
      localStorage.setItem("dsd-sidebar-collapsed", JSON.stringify(targetState));
      results.localStorage = true;
    } catch (e) {
      logger?.warn?.("Failed to persist collapsed state:", e.message);
    }
    Metrics.increment("atomicTransitions");
    const duration = performance.now() - startTime;
    logger?.debug?.("P24 Atomic transition complete", {
      targetState,
      results,
      durationMs: duration.toFixed(2)
    });
    return {
      success: true,
      collapsed: targetState,
      results,
      durationMs: duration
    };
  } catch (error) {
    logger?.error?.("P24 Atomic transition failed:", error);
    Metrics.increment("syncFailures");
    return {
      success: false,
      error: error.message,
      results
    };
  }
}
function createCollapseMethods(dependencies) {
  const { engine, renderer, tracker, logger } = dependencies;
  return {
    toggle() {
      Metrics.increment("toggleAttempts");
      if (_toggleDebounce) {
        Metrics.increment("toggleBlocked");
        logger?.debug?.("Toggle blocked by debounce");
        return;
      }
      _toggleDebounce = setTimeout(() => {
        _toggleDebounce = null;
      }, TOGGLE_DEBOUNCE_MS);
      try {
        const currentCollapsed = engine.collapsed;
        const newCollapsed = !currentCollapsed;
        const result = applyCollapsedStateAtomic(newCollapsed, { engine, renderer, logger });
        if (result.success) {
          Metrics.increment("toggleSuccess");
          Metrics.set("lastToggleAt", Date.now());
          tracker?.trackToggle?.(newCollapsed);
          logger?.info?.("P24 Toggle complete (atomic)", {
            collapsed: newCollapsed,
            atomicTransitions: Metrics.get("atomicTransitions")
          });
        } else {
          logger?.error?.("P24 Toggle atomic failed", { error: result.error });
        }
      } catch (error) {
        logger?.error?.("Toggle error:", error);
        Metrics.increment("syncFailures");
      }
    },
    collapse() {
      try {
        const result = applyCollapsedStateAtomic(true, { engine, renderer, logger });
        if (!result.success) {
          logger?.error?.("Collapse atomic failed:", result.error);
        }
      } catch (error) {
        logger?.error?.("Collapse error:", error);
      }
    },
    expand() {
      try {
        const result = applyCollapsedStateAtomic(false, { engine, renderer, logger });
        if (!result.success) {
          logger?.error?.("Expand atomic failed:", result.error);
        }
      } catch (error) {
        logger?.error?.("Expand error:", error);
      }
    },
    forceSync() {
      try {
        const collapsed = engine.collapsed;
        const result = applyCollapsedStateAtomic(collapsed, { engine, renderer, logger });
        return { success: result.success, collapsed, atomicResult: result };
      } catch (error) {
        logger?.error?.("Force sync error:", error);
        return { success: false, error: error.message };
      }
    },
    getToggleMetrics() {
      return Metrics.getAll();
    }
  };
}
function resetDebounce() {
  if (_toggleDebounce) {
    clearTimeout(_toggleDebounce);
    _toggleDebounce = null;
  }
}
function isDebounceActive() {
  return !!_toggleDebounce;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    debounceActive: isDebounceActive(),
    p24AtomicTransitions: true
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      debounceActive: isDebounceActive(),
      atomicTransitions: Metrics.get("atomicTransitions"),
      syncFailures: Metrics.get("syncFailures")
    },
    p24AtomicTransitions: true
  };
}
var collapse_methods_default = { createCollapseMethods, resetDebounce, isDebounceActive, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createCollapseMethods,
  collapse_methods_default as default,
  healthCheck,
  info,
  isDebounceActive,
  resetDebounce
};
