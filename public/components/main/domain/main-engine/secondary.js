import { ENGINE_EVENTS } from "./constants.js";
import { isAuthenticated } from "./helpers.js";
const VERSION = "5.0.0-MODULAR";
const MODULE_ID = "main-engine-secondary";
async function performOpenSecondary(engine, panelId, options = {}) {
  if (!engine._initialized) return false;
  if (!isAuthenticated(engine._ports)) return false;
  engine._metrics.secondaryOpens++;
  const emit = engine._emit;
  const ports = engine._ports;
  emit(ENGINE_EVENTS.SECONDARY_OPENING, { panelId });
  try {
    const mco = engine._multiContainerOrchestrator;
    const result = await mco?.openContainer?.(panelId, { ...options, dock: "secondary", strategy: "side-by-side" });
    const containerId = result?.containerId;
    if (containerId) {
      const container = ports.container?.get?.(containerId);
      if (container?.contentEl) {
        const panelModule = await ports.panel?.load?.(panelId);
        await ports.panel?.mount?.(panelModule, container.contentEl, { panelId });
      }
    }
    emit(ENGINE_EVENTS.SECONDARY_OPENED, { panelId, containerId });
    emit(ENGINE_EVENTS.LAYOUT_CHANGED, { layout: "side-by-side" });
    return result;
  } catch (error) {
    engine._errorSupervisor?.capture?.(error, { panelId, phase: "openSecondary" });
    return false;
  }
}
async function performCloseSecondary(engine, containerId) {
  const mco = engine._multiContainerOrchestrator;
  const emit = engine._emit;
  if (!containerId) {
    const containers = mco?.getActiveContainerIds?.() || [];
    for (const id of containers) {
      const info2 = mco?.getContainerInfo?.(id);
      if (info2?.slot === "secondary") mco?.closeContainer?.(id);
    }
  } else mco?.closeContainer?.(containerId);
  emit(ENGINE_EVENTS.SECONDARY_CLOSED, { containerId });
  return true;
}
function performToggleContainerFocus(engine, containerId) {
  return engine._multiContainerOrchestrator?.toggleFocus?.(containerId) || false;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var secondary_default = { performOpenSecondary, performCloseSecondary, performToggleContainerFocus, healthCheck, info, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  secondary_default as default,
  healthCheck,
  info,
  performCloseSecondary,
  performOpenSecondary,
  performToggleContainerFocus
};
