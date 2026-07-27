const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.panel-registry";
function createPanelRegistry() {
  const _panelListeners = /* @__PURE__ */ new Map();
  return {
    // Obtém ou cria registry do painel
    getOrCreate(panelId) {
      if (!_panelListeners.has(panelId)) {
        _panelListeners.set(panelId, {
          listeners: /* @__PURE__ */ new Map(),
          timers: /* @__PURE__ */ new Map(),
          intervals: /* @__PURE__ */ new Map(),
          observers: /* @__PURE__ */ new Map(),
          rafs: /* @__PURE__ */ new Map(),
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
      }
      return _panelListeners.get(panelId);
    },
    // Obtém registry existente
    get(panelId) {
      return _panelListeners.get(panelId) || null;
    },
    // Verifica se existe
    has(panelId) {
      return _panelListeners.has(panelId);
    },
    // Remove registry
    delete(panelId) {
      return _panelListeners.delete(panelId);
    },
    // Itera sobre todos
    forEach(callback) {
      _panelListeners.forEach(callback);
    },
    // Contagem de painéis
    size() {
      return _panelListeners.size;
    },
    // Limpa tudo
    clear() {
      _panelListeners.clear();
    },
    // Atualiza lastActivity
    updateActivity(panelId) {
      const registry = _panelListeners.get(panelId);
      if (registry) {
        registry.lastActivity = Date.now();
      }
    }
  };
}
var panel_registry_default = { createPanelRegistry };
export {
  MODULE_ID,
  VERSION,
  createPanelRegistry,
  panel_registry_default as default
};
