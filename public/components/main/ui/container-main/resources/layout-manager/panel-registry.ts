// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-registry
// PURPOSE: Layout Panel Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_STATES from ./constants.js
//
// PROVIDES:
//   createPanelRegistry() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LAYOUT_STATES } from './constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-manager.panel-registry';

export function createPanelRegistry(options: Record<string, any> = {}) {
  const { constraintsManager, resizeObserver } = options;

  // Registry de painéis e seus layouts
  const _panelLayouts = new Map();
  
  // Histórico de layouts (para restore)
  const _layoutHistory = new Map();

  return {
    // Registra um painel
    register(panelId: string, element: HTMLElement, constraints: Record<string, any> = {}) {
      const mergedConstraints = constraintsManager.merge(constraints);
      const rect = element?.getBoundingClientRect() || { width: 400, height: 300 };
      
      const layout = {
        panelId,
        state: LAYOUT_STATES.NORMAL,
        previousState: null as Record<string, unknown> | null,
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
        element.setAttribute('data-panel-id', panelId);
        element.setAttribute('data-layout-state', LAYOUT_STATES.NORMAL);
        
        if (resizeObserver) {
          resizeObserver.observe(element);
        }
      }

      return { success: true, constraints: mergedConstraints };
    },

    // Remove registro
    unregister(panelId: string) {
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
    get(panelId: string) {
      const layout = _panelLayouts.get(panelId);
      return layout ? { ...layout, element: undefined } : null;
    },

    // Obtém layout com elemento
    getWithElement(panelId: string) {
      return _panelLayouts.get(panelId) || null;
    },

    // Verifica se existe
    has(panelId: string) {
      return _panelLayouts.has(panelId);
    },

    // Atualiza layout
    update(panelId: string, updates: Record<string, unknown>) {
      const layout = _panelLayouts.get(panelId);
      if (!layout) return false;
      
      Object.assign(layout, updates);
      return true;
    },

    // Salva no histórico
    saveToHistory(panelId: string) {
      const layout = _panelLayouts.get(panelId);
      if (!layout) return false;

      if (!_layoutHistory.has(panelId)) {
        _layoutHistory.set(panelId, []);
      }
      const history = _layoutHistory.get(panelId);
      history.push({ ...layout, element: undefined, savedAt: Date.now() });
      if (history.length > 10) history.shift();
      
      return true;
    },

    // Restaura do histórico
    getFromHistory(panelId: string) {
      const history = _layoutHistory.get(panelId);
      if (!history || history.length === 0) return null;
      return history.pop();
    },

    // Lista todos
    list() {
      const list: unknown[] = [];
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
    forEach(callback: (...args: unknown[]) => void) {
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

export default { createPanelRegistry };
