// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: layout-manager
// PURPOSE: Layout Manager - Sistema centralizado de gerenciamento de layout
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, LAYOUT_STATES, DOCK_ZONES, SPLIT_MODES, createConstraints...
//   LAYOUT_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createLayoutManager() — exported function
//   getLayoutManager() — exported function
//   resetGlobalLayoutManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   LAYOUT_STATES — exported value
//   DOCK_ZONES — exported value
//   SPLIT_MODES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LAYOUT_EVENT_NAMES.CONSTRAINTS_UPDATED
//   LAYOUT_EVENT_NAMES.MANAGER_DESTROYED
//   LAYOUT_EVENT_NAMES.MANAGER_INITIALIZED
//   LAYOUT_EVENT_NAMES.PANEL_REGISTERED
//   LAYOUT_EVENT_NAMES.PANEL_UNREGISTERED
//   LAYOUT_EVENT_NAMES.RESIZED
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  VERSION, MODULE_ID,
  LAYOUT_STATES, DOCK_ZONES, SPLIT_MODES,
  createConstraintsManager,
  createPositionCalculator,
  createStyleApplicator,
  createPanelRegistry,
  createStateManager,
  createDockController,
  createFullscreenController,
  createSplitController
} from './layout-manager/index.js';
import { LAYOUT_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export { VERSION, MODULE_ID, LAYOUT_STATES, DOCK_ZONES, SPLIT_MODES };

export function createLayoutManager(options: Record<string, unknown> = {}) {
  const {
    container,
    eventBus,
    defaultConstraints: constraintsOpt = {},
    animationDuration = 300,
    onLayoutChange,
    onResize,
    onDock,
    onUndock,
    onFullscreen
  } = options as Record<string, any>;

  let _destroyed = false;
  let _resizeObserver: ResizeObserver | null = null;

  const emitter = {
    emit(event: string, data: Record<string, unknown>) {
      if (eventBus?.emit) {
        eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
      }
    }
  };

  function initResizeObserver() {
    if (_resizeObserver || typeof ResizeObserver === 'undefined') return null;

    _resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const panelId = entry.target.getAttribute('data-panel-id');
        if (panelId && panelRegistry.has(panelId)) {
          const layout = panelRegistry.get(panelId);
          const { width, height } = entry.contentRect;
          
          if (layout.width !== width || layout.height !== height) {
            panelRegistry.update(panelId, { width, height });
            onResize?.(panelId, { width, height });
            emitter.emit(LAYOUT_EVENT_NAMES.RESIZED, { panelId, width, height });
          }
        }
      });
    });

    return _resizeObserver;
  }


  const constraintsManager = createConstraintsManager({ defaultConstraints: constraintsOpt });
  const positionCalculator = createPositionCalculator();
  const styleApplicator = createStyleApplicator({ animationDuration });
  
  const panelRegistry = createPanelRegistry({ 
    constraintsManager, 
    resizeObserver: initResizeObserver() 
  });

  const stateManager = createStateManager({
    panelRegistry,
    styleApplicator,
    emitter,
    onLayoutChange
  });

  const dockController = createDockController({
    panelRegistry,
    stateManager,
    positionCalculator,
    container,
    emitter,
    onDock,
    onUndock
  });

  const fullscreenController = createFullscreenController({
    panelRegistry,
    stateManager,
    emitter,
    onFullscreen
  });

  const splitController = createSplitController({
    panelRegistry,
    stateManager,
    positionCalculator,
    container,
    emitter
  });

  const manager = {
    register(panelId: string, element: HTMLElement, constraints: Record<string, unknown> = {}) {
      if (_destroyed) return false;
      const result = panelRegistry.register(panelId, element, constraints);
      emitter.emit(LAYOUT_EVENT_NAMES.PANEL_REGISTERED, { panelId, constraints: result.constraints });
      return result.success;
    },

    unregister(panelId: string) {
      if (fullscreenController.getFullscreenPanel() === panelId) {
        fullscreenController.exit(panelId);
      }
      splitController.clearForPanel(panelId);
      dockController.clearZoneForPanel(panelId);
      
      const success = panelRegistry.unregister(panelId);
      if (success) emitter.emit(LAYOUT_EVENT_NAMES.PANEL_UNREGISTERED, { panelId });
      return success;
    },

    getLayout: (panelId: string) => panelRegistry.get(panelId),
    list: () => panelRegistry.list(),
    getConstraints: (panelId: string) => {
      const layout = panelRegistry.get(panelId);
      return layout ? { ...layout.constraints } : null;
    },

    setState: (panelId: string, newState: string, opts: Record<string, unknown>) => stateManager.setState(panelId, newState, opts),
    resize: (panelId: string, w: number, h: number, opts?: Record<string, unknown>) => {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout?.constraints.resizable) return false;
      const constrained = constraintsManager.apply(w, h, layout.constraints);
      return stateManager.resize(panelId, constrained.width, constrained.height, opts);
    },
    move: (panelId: string, x: number, y: number, opts: Record<string, unknown>) => stateManager.move(panelId, x, y, opts),
    maximize: (panelId: string) => stateManager.maximize(panelId),
    minimize: (panelId: string) => stateManager.minimize(panelId),
    restore: (panelId: string) => stateManager.restore(panelId),
    restoreFromHistory: (panelId: string) => stateManager.restoreFromHistory(panelId),

    setConstraints(panelId: string, constraints: Record<string, unknown>) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      
      layout.constraints = constraintsManager.merge(constraints);
      const constrained = constraintsManager.apply(layout.width, layout.height, layout.constraints);
      
      if (constrained.width !== layout.width || constrained.height !== layout.height) {
        this.resize(panelId, constrained.width, constrained.height);
      }
      
      emitter.emit(LAYOUT_EVENT_NAMES.CONSTRAINTS_UPDATED, { panelId, constraints: layout.constraints });
      return true;
    },

    dock: (panelId: string, zone: Record<string, unknown>) => dockController.dock(panelId, zone),
    undock: (panelId: string) => dockController.undock(panelId),
    getDockedPanels: () => dockController.getDockedPanels(),

    enterFullscreen: (panelId: string) => fullscreenController.enter(panelId),
    exitFullscreen: (panelId: string) => fullscreenController.exit(panelId),
    toggleFullscreen: (panelId: string) => fullscreenController.toggle(panelId),
    getFullscreenPanel: () => fullscreenController.getFullscreenPanel(),

    split: (panelIds: string[], mode: string) => splitController.split(panelIds, mode),
    unsplit: (panelId: string) => splitController.unsplit(panelId),
    getSplitPanels: () => splitController.getSplitPanels(),

    init() {
      emitter.emit(LAYOUT_EVENT_NAMES.MANAGER_INITIALIZED, {});
      return this;
    },

    healthCheck() {
      return {
        status: _destroyed ? 'DESTROYED' : 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        registeredPanels: panelRegistry.count(),
        fullscreenPanel: fullscreenController.getFullscreenPanel(),
        splitPanels: splitController.count(),
        dockedPanels: dockController.count(),
        hasResizeObserver: !!_resizeObserver,
        modular: true
      };
    },

    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        registeredPanels: panelRegistry.count(),
        states: Object.keys(LAYOUT_STATES),
        dockZones: Object.keys(DOCK_ZONES),
        splitModes: Object.keys(SPLIT_MODES),
        modular: true
      };
    },

    destroy() {
      _destroyed = true;
      if (_resizeObserver) { _resizeObserver.disconnect(); _resizeObserver = null; }
      panelRegistry.clear();
      splitController.clear();
      dockController.clear();
      fullscreenController.clear();
      emitter.emit(LAYOUT_EVENT_NAMES.MANAGER_DESTROYED, {});
    }
  };

  return manager;
}

let _globalManager: ReturnType<typeof createLayoutManager> | null = null;

export function getLayoutManager(options: Record<string, unknown>) {
  if (!_globalManager) { _globalManager = createLayoutManager(options); }
  return _globalManager;
}

export function resetGlobalLayoutManager() {
  if (_globalManager) { _globalManager.destroy(); _globalManager = null; }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ['createLayoutManager', 'getLayoutManager'], states: Object.keys(LAYOUT_STATES), dockZones: Object.keys(DOCK_ZONES), modular: true };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasGlobalManager: !!_globalManager, modular: true };
}

export default {
  VERSION, MODULE_ID, LAYOUT_STATES, DOCK_ZONES, SPLIT_MODES,
  createLayoutManager, getLayoutManager, resetGlobalLayoutManager, info, healthCheck
};
