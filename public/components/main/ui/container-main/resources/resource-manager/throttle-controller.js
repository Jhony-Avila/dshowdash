import { RESOURCE_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "2.1.0-EVENT-CONSTANTS";
const MODULE_ID = "main.ui.container-main.resources.resource-manager.throttle-controller";
function createThrottleController(options = {}) {
  const { emitter } = options;
  const _throttledPanels = /* @__PURE__ */ new Set();
  return {
    // Adiciona painel ao throttle
    throttle(panelId) {
      if (!_throttledPanels.has(panelId)) {
        _throttledPanels.add(panelId);
        emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_THROTTLED, { panelId });
        return true;
      }
      return false;
    },
    // Remove painel do throttle
    unthrottle(panelId) {
      if (_throttledPanels.has(panelId)) {
        _throttledPanels.delete(panelId);
        emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_UNTHROTTLED, { panelId });
        return true;
      }
      return false;
    },
    // Verifica se painel está throttled
    isThrottled(panelId) {
      return _throttledPanels.has(panelId);
    },
    // Lista painéis throttled
    getAll() {
      return Array.from(_throttledPanels);
    },
    // Contagem
    count() {
      return _throttledPanels.size;
    },
    // Obtém Set interno (para cleanup strategies)
    getSet() {
      return _throttledPanels;
    },
    // Limpa tudo
    clear() {
      _throttledPanels.clear();
    }
  };
}
var throttle_controller_default = { createThrottleController };
export {
  MODULE_ID,
  VERSION,
  createThrottleController,
  throttle_controller_default as default
};
