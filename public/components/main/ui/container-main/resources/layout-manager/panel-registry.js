import { LAYOUT_STATES } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-manager.panel-registry";
function createPanelRegistry(options = {}) {
  const { constraintsManager, resizeObserver } = options;
  const _panelLayouts = /* @__PURE__ */ new Map();
  const _layoutHistory = /* @__PURE__ */ new Map();
  return {
    // Registra um painel
    register(panelId, element, constraints = {}) {
      const mergedConstraints = constraintsManager.merge(constraints);
      const rect = element?.getBoundingClientRect() || { width: 400, height: 300 };
      const layout = {
        panelId,
        state: LAYOUT_STATES.NORMAL,
        previousState: null,
        x: 0,
        y: 0,
        width: rect.width || 400,
        height: rect.height || 300,
        zIndex: 1,
        constraints: mergedConstraints,
        element,
        registeredAt: Date.now()
      };
      _panelLayouts.set(panelId, layout);
      if (element) {
        element.setAttribute("data-panel-id", panelId);
        element.setAttribute("data-layout-state", LAYOUT_STATES.NORMAL);
        if (resizeObserver) {
          resizeObserver.observe(element);
        }
      }
      return { success: true, constraints: mergedConstraints };
    },
    // Remove registro
    unregister(panelId) {
      const layout = _panelLayouts.get(panelId);
      if (!layout) return false;
      if (layout.element && resizeObserver) {
        resizeObserver.unobserve(layout.element);
      }
      _panelLayouts.delete(panelId);
      _layoutHistory.delete(panelId);
      return true;
    },
    // Obtém layout
    get(panelId) {
      const layout = _panelLayouts.get(panelId);
      return layout ? { ...layout, element: void 0 } : null;
    },
    // Obtém layout com elemento
    getWithElement(panelId) {
      return _panelLayouts.get(panelId) || null;
    },
    // Verifica se existe
    has(panelId) {
      return _panelLayouts.has(panelId);
    },
    // Atualiza layout
    update(panelId, updates) {
      const layout = _panelLayouts.get(panelId);
      if (!layout) return false;
      Object.assign(layout, updates);
      return true;
    },
    // Salva no histórico
    saveToHistory(panelId) {
      const layout = _panelLayouts.get(panelId);
      if (!layout) return false;
      if (!_layoutHistory.has(panelId)) {
        _layoutHistory.set(panelId, []);
      }
      const history = _layoutHistory.get(panelId);
      history.push({ ...layout, element: void 0, savedAt: Date.now() });
      if (history.length > 10) history.shift();
      return true;
    },
    // Restaura do histórico
    getFromHistory(panelId) {
      const history = _layoutHistory.get(panelId);
      if (!history || history.length === 0) return null;
      return history.pop();
    },
    // Lista todos
    list() {
      const list = [];
      _panelLayouts.forEach((layout, panelId) => {
        list.push({
          panelId,
          state: layout.state,
          width: layout.width,
          height: layout.height,
          x: layout.x,
          y: layout.y
        });
      });
      return list;
    },
    // Itera sobre todos os painéis
    forEach(callback) {
      _panelLayouts.forEach(callback);
    },
    // Contagem
    count() {
      return _panelLayouts.size;
    },
    // Limpa tudo
    clear() {
      _panelLayouts.clear();
      _layoutHistory.clear();
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
