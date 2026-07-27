const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.query-methods";
function createQueryMethods(options = {}) {
  const { panelRegistry } = options;
  return {
    // Obtém contagem de listeners por painel
    getCount(panelId) {
      const registry = panelRegistry.get(panelId);
      if (!registry) return null;
      return {
        listeners: registry.listeners.size,
        timers: registry.timers.size,
        intervals: registry.intervals.size,
        observers: registry.observers.size,
        rafs: registry.rafs.size,
        total: registry.listeners.size + registry.timers.size + registry.intervals.size + registry.observers.size + registry.rafs.size
      };
    },
    // Obtém detalhes de listeners de um painel
    getDetails(panelId) {
      const registry = panelRegistry.get(panelId);
      if (!registry) return null;
      return {
        panelId,
        createdAt: registry.createdAt,
        lastActivity: registry.lastActivity,
        listeners: Array.from(registry.listeners.values()),
        timers: Array.from(registry.timers.values()),
        intervals: Array.from(registry.intervals.values()),
        observers: Array.from(registry.observers.values()),
        rafs: Array.from(registry.rafs.values())
      };
    },
    // Lista todos os painéis rastreados
    listPanels() {
      const panels = [];
      panelRegistry.forEach((registry, panelId) => {
        panels.push({
          panelId,
          counts: this.getCount(panelId),
          lastActivity: registry.lastActivity
        });
      });
      return panels;
    },
    // Obtém total de listeners ativos
    getTotalActive() {
      let total = 0;
      panelRegistry.forEach((registry) => {
        total += registry.listeners.size + registry.timers.size + registry.intervals.size + registry.observers.size + registry.rafs.size;
      });
      return total;
    }
  };
}
var query_methods_default = { createQueryMethods };
export {
  MODULE_ID,
  VERSION,
  createQueryMethods,
  query_methods_default as default
};
