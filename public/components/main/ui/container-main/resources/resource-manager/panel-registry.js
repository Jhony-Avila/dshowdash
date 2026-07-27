const VERSION = "2.1.0-EVENT-CONSTANTS";
const MODULE_ID = "main.ui.container-main.resources.resource-manager.panel-registry";
function createPanelRegistry(options = {}) {
  const { emitter } = options;
  const _panelResources = /* @__PURE__ */ new Map();
  return {
    // Obtém ou cria registro do painel
    getOrCreate(panelId) {
      if (!_panelResources.has(panelId)) {
        _panelResources.set(panelId, {
          resources: /* @__PURE__ */ new Map(),
          memoryUsage: 0,
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
      }
      return _panelResources.get(panelId);
    },
    // Obtém registro existente
    get(panelId) {
      return _panelResources.get(panelId) || null;
    },
    // Verifica se existe
    has(panelId) {
      return _panelResources.has(panelId);
    },
    // Remove registro
    delete(panelId) {
      return _panelResources.delete(panelId);
    },
    // Itera sobre todos
    forEach(callback) {
      _panelResources.forEach(callback);
    },
    // Contagem
    size() {
      return _panelResources.size;
    },
    // Limpa tudo
    clear() {
      _panelResources.clear();
    },
    // Obtém estatísticas de todos os painéis
    getStats(throttledPanels) {
      const stats = {};
      _panelResources.forEach((record, panelId) => {
        stats[panelId] = {
          resources: record.resources.size,
          memoryUsage: record.memoryUsage,
          throttled: throttledPanels?.has(panelId) || false
        };
      });
      return stats;
    },
    // Atualiza atividade
    updateActivity(panelId) {
      const record = _panelResources.get(panelId);
      if (record) {
        record.lastActivity = Date.now();
      }
    },
    // Atualiza uso de memória
    updateMemory(panelId, delta) {
      const record = _panelResources.get(panelId);
      if (record) {
        record.memoryUsage += delta;
      }
    },
    // Obtém Map interno (para cleanup strategies)
    getMap() {
      return _panelResources;
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
