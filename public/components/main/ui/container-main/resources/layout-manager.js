import {
  VERSION,
  MODULE_ID,
  LAYOUT_STATES,
  DOCK_ZONES,
  SPLIT_MODES,
  createConstraintsManager,
  createPositionCalculator,
  createStyleApplicator,
  createPanelRegistry,
  createStateManager,
  createDockController,
  createFullscreenController,
  createSplitController
} from "./layout-manager/index.js";
import { LAYOUT_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
function createLayoutManager(options = {}) {
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
  } = options;
  let _destroyed = false;
  let _resizeObserver = null;
  const emitter = {
    emit(event, data) {
      if (eventBus?.emit) {
        eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
      }
    }
  };
  function initResizeObserver() {
    if (_resizeObserver || typeof ResizeObserver === "undefined") return null;
    _resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const panelId = entry.target.getAttribute("data-panel-id");
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
    register(panelId, element, constraints = {}) {
      if (_destroyed) return false;
      const result = panelRegistry.register(panelId, element, constraints);
      emitter.emit(LAYOUT_EVENT_NAMES.PANEL_REGISTERED, { panelId, constraints: result.constraints });
      return result.success;
    },
    unregister(panelId) {
      if (fullscreenController.getFullscreenPanel() === panelId) {
        fullscreenController.exit(panelId);
      }
      splitController.clearForPanel(panelId);
      dockController.clearZoneForPanel(panelId);
      const success = panelRegistry.unregister(panelId);
      if (success) emitter.emit(LAYOUT_EVENT_NAMES.PANEL_UNREGISTERED, { panelId });
      return success;
    },
    getLayout: (panelId) => panelRegistry.get(panelId),
    list: () => panelRegistry.list(),
    getConstraints: (panelId) => {
      const layout = panelRegistry.get(panelId);
      return layout ? { ...layout.constraints } : null;
    },
    setState: (panelId, newState, opts) => stateManager.setState(panelId, newState, opts),
    resize: (panelId, w, h, opts) => {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout?.constraints.resizable) return false;
      const constrained = constraintsManager.apply(w, h, layout.constraints);
      return stateManager.resize(panelId, constrained.width, constrained.height, opts);
    },
    move: (panelId, x, y, opts) => stateManager.move(panelId, x, y, opts),
    maximize: (panelId) => stateManager.maximize(panelId),
    minimize: (panelId) => stateManager.minimize(panelId),
    restore: (panelId) => stateManager.restore(panelId),
    restoreFromHistory: (panelId) => stateManager.restoreFromHistory(panelId),
    setConstraints(panelId, constraints) {
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
    dock: (panelId, zone) => dockController.dock(panelId, zone),
    undock: (panelId) => dockController.undock(panelId),
    getDockedPanels: () => dockController.getDockedPanels(),
    enterFullscreen: (panelId) => fullscreenController.enter(panelId),
    exitFullscreen: (panelId) => fullscreenController.exit(panelId),
    toggleFullscreen: (panelId) => fullscreenController.toggle(panelId),
    getFullscreenPanel: () => fullscreenController.getFullscreenPanel(),
    split: (panelIds, mode) => splitController.split(panelIds, mode),
    unsplit: (panelId) => splitController.unsplit(panelId),
    getSplitPanels: () => splitController.getSplitPanels(),
    init() {
      emitter.emit(LAYOUT_EVENT_NAMES.MANAGER_INITIALIZED, {});
      return this;
    },
    healthCheck() {
      return {
        status: _destroyed ? "DESTROYED" : "HEALTHY",
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
      if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
      }
      panelRegistry.clear();
      splitController.clear();
      dockController.clear();
      fullscreenController.clear();
      emitter.emit(LAYOUT_EVENT_NAMES.MANAGER_DESTROYED, {});
    }
  };
  return manager;
}
let _globalManager = null;
function getLayoutManager(options) {
  if (!_globalManager) {
    _globalManager = createLayoutManager(options);
  }
  return _globalManager;
}
function resetGlobalLayoutManager() {
  if (_globalManager) {
    _globalManager.destroy();
    _globalManager = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["createLayoutManager", "getLayoutManager"], states: Object.keys(LAYOUT_STATES), dockZones: Object.keys(DOCK_ZONES), modular: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasGlobalManager: !!_globalManager, modular: true };
}
var layout_manager_default = {
  VERSION,
  MODULE_ID,
  LAYOUT_STATES,
  DOCK_ZONES,
  SPLIT_MODES,
  createLayoutManager,
  getLayoutManager,
  resetGlobalLayoutManager,
  info,
  healthCheck
};
export {
  DOCK_ZONES,
  LAYOUT_STATES,
  MODULE_ID,
  SPLIT_MODES,
  VERSION,
  createLayoutManager,
  layout_manager_default as default,
  getLayoutManager,
  healthCheck,
  info,
  resetGlobalLayoutManager
};
