import { VERSION, MODULE_ID } from "../constants.js";
import { createLogger } from "/assets/js/core/logger-global/index.js";
import { OVERLAY_EVENTS } from "/core/runtime/events/catalog/overlay.events.js";
import {
  getCurrentMode,
  setCurrentMode,
  getApplicationKernel,
  getEventBus,
  incrementMetric
} from "../state.js";
import { handleModeChange } from "./mode-handler.js";
import * as PermissionGate from "../../overlay-permission-gate.js";
const _logger = createLogger(MODULE_ID);
function _emit(eventName, data) {
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit(eventName, Object.assign({
      source: MODULE_ID,
      timestamp: Date.now()
    }, data || {}));
  }
}
function _log(level, message, data) {
  const context = data ? { data } : {};
  if (level === "error") _logger.error(message, context);
  else if (level === "warn") _logger.warn(message, context);
  else _logger.debug(message, context);
}
function handleRuntimeContextUpdated(data) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    const trigger = data && data.trigger ? data.trigger : "unknown";
    if (!snapshot) {
      _log("warn", "[P4] RuntimeContext update sem snapshot");
      return;
    }
    _log("info", "[P4] RuntimeContext updated", {
      trigger,
      mode: snapshot.mode,
      authenticated: snapshot.authenticated
    });
    incrementMetric("modeChanges");
    const currentMode = getCurrentMode();
    if (snapshot.mode && snapshot.mode !== currentMode) {
      handleModeChange(snapshot.mode, currentMode);
      setCurrentMode(snapshot.mode);
    }
    if (snapshot.maintenance) {
      _handleMaintenanceMode(snapshot);
    }
    if (snapshot.failed) {
      _handleFailedMode(snapshot);
    }
    if (trigger === "auth-change" || !snapshot.authenticated) {
      _handleAuthChangeFromContext(snapshot);
    }
    _emit("overlay-kernel:runtime-context-updated", {
      snapshot,
      trigger
    });
  } catch (e) {
    _log("error", "[P4] handleRuntimeContextUpdated error", e.message);
  }
}
function handleRuntimeContextReady(data) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    _log("info", "[P4] RuntimeContext ready", {
      mode: snapshot ? snapshot.mode : "N/A",
      authenticated: snapshot ? snapshot.authenticated : "N/A"
    });
    if (snapshot && snapshot.mode) {
      const currentMode = getCurrentMode();
      if (snapshot.mode !== currentMode) {
        handleModeChange(snapshot.mode, currentMode);
        setCurrentMode(snapshot.mode);
      }
    }
  } catch (e) {
    _log("error", "[P4] handleRuntimeContextReady error", e.message);
  }
}
function _handleMaintenanceMode(snapshot) {
  _log("warn", "[P4] Sistema em MAINTENANCE - fechando overlays n\xE3o-essenciais");
  if (typeof window === "undefined" || !window.OverlayKernel) return;
  const stackResult = window.OverlayKernel.listStack();
  if (!stackResult.ok) return;
  const stack = stackResult.data.stack;
  for (let i = 0; i < stack.length; i++) {
    const overlay = stack[i];
    if (overlay.adapterId !== "error-modal" && overlay.adapterId !== "alert-modal") {
      _log("info", `[P4] Closing overlay in MAINTENANCE: ${overlay.handle}`);
      window.OverlayKernel.close(overlay.handle);
    }
  }
}
function _handleFailedMode(snapshot) {
  _log("error", "[P4] Sistema em FAILED - fechando TODOS os overlays");
  if (typeof window === "undefined" || !window.OverlayKernel) return;
  const stackResult = window.OverlayKernel.listStack();
  if (!stackResult.ok) return;
  const stack = stackResult.data.stack;
  for (let i = 0; i < stack.length; i++) {
    const overlay = stack[i];
    _log("info", `[P4] Closing overlay in FAILED: ${overlay.handle}`);
    window.OverlayKernel.close(overlay.handle);
  }
}
function _handleAuthChangeFromContext(snapshot) {
  _log("info", "[P4] Auth state from RuntimeContext, re-syncing permissions");
  if (typeof window === "undefined" || !window.OverlayKernel) return;
  if (!snapshot.authenticated) {
    const stackResult = window.OverlayKernel.listStack();
    if (!stackResult.ok) return;
    const stack = stackResult.data.stack;
    for (let i = 0; i < stack.length; i++) {
      const overlay = stack[i];
      const canKeep = PermissionGate.canOpen(overlay.adapterId);
      if (!canKeep) {
        _log("info", `[P4] Closing overlay due to auth change: ${overlay.handle}`);
        window.OverlayKernel.close(overlay.handle);
      }
    }
  }
}
function handleRuntimeReady(data) {
  _log("info", "Runtime ready, syncing mode");
  const applicationKernel = getApplicationKernel();
  const currentMode = getCurrentMode();
  if (applicationKernel && typeof applicationKernel.getMode === "function") {
    const mode = applicationKernel.getMode();
    if (mode !== currentMode) {
      handleModeChange(mode, currentMode);
    }
  }
  _emit(OVERLAY_EVENTS.KERNEL_READY, {
    version: VERSION,
    mode: getCurrentMode(),
    integratedWithRuntime: true
  });
}
function handleRuntimeDegraded(data) {
  _log("warn", "Runtime degraded", data);
  if (data && data.mode && data.mode !== getCurrentMode()) {
    handleModeChange(data.mode, getCurrentMode());
  }
}
function handleAuthChange(data) {
  _log("info", "Auth state changed, re-syncing permissions");
  if (typeof window === "undefined" || !window.OverlayKernel) return;
  const stackResult = window.OverlayKernel.listStack();
  if (!stackResult.ok) return;
  const stack = stackResult.data.stack;
  for (let i = 0; i < stack.length; i++) {
    const overlay = stack[i];
    const canKeep = PermissionGate.canOpen(overlay.adapterId);
    if (!canKeep) {
      _log("info", `Closing overlay due to auth change: ${overlay.handle}`);
      window.OverlayKernel.close(overlay.handle);
    }
  }
}
function handleKernelModeChange(data) {
  if (data && data.mode) {
    handleModeChange(data.mode, getCurrentMode());
  }
}
var event_handlers_default = {
  // P4: Novos handlers
  handleRuntimeContextUpdated,
  handleRuntimeContextReady,
  // Legado (mantidos para compatibilidade)
  handleRuntimeReady,
  handleRuntimeDegraded,
  handleAuthChange,
  handleKernelModeChange
};
export {
  event_handlers_default as default,
  handleAuthChange,
  handleKernelModeChange,
  handleRuntimeContextReady,
  handleRuntimeContextUpdated,
  handleRuntimeDegraded,
  handleRuntimeReady
};
