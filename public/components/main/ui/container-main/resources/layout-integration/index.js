import { getLayoutManager, LAYOUT_STATES, SPLIT_MODES } from "../layout-manager.js";
import { getCapabilityManager, CAPABILITY_STATUS } from "../capability-manager/index.js";
import { VERSION, MODULE_ID, INTEGRATION_MODES, LAYOUT_EVENTS } from "./core/constants.js";
import { createLegacyAdapter } from "./core/legacy-adapter.js";
import { setupResizeObserver } from "./ui/resize-observer.js";
import { setupDragListeners } from "./ui/drag-handler.js";
import { detectPanelType } from "./utils/panel-detector.js";
function createLayoutIntegration(options = {}) {
  const {
    eventBus,
    layoutManager = null,
    capabilityManager = null,
    mode = INTEGRATION_MODES.FULL,
    autoRegister = true,
    enforceCapabilities = true,
    onPanelRegistered,
    onLayoutChange,
    onError
  } = options;
  let _layoutManager = layoutManager || getLayoutManager({ eventBus });
  let _capabilityManager = capabilityManager || getCapabilityManager({ eventBus });
  const _integratedPanels = /* @__PURE__ */ new Map();
  const _legacyAdapters = /* @__PURE__ */ new Map();
  let _metrics = {
    totalIntegrated: 0,
    legacyPanels: 0,
    layoutChanges: 0,
    capabilityDenials: 0
  };
  let _destroyed = false;
  function _emit(event, data) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
  function _checkCapability(panelId, capability) {
    if (!enforceCapabilities) return true;
    const result = _capabilityManager.ensure(panelId, capability);
    if (result.status !== CAPABILITY_STATUS.GRANTED) {
      _metrics.capabilityDenials++;
      _emit("layout-integration:capability-denied", { panelId, capability });
      return false;
    }
    return true;
  }
  const integration = {
    // Registra painel para integração
    register(panelId, panel, element, options2 = {}) {
      if (_destroyed) return false;
      const {
        constraints = {},
        capabilities = ["resizable", "draggable"],
        enableDrag = true,
        enableResize = true,
        dragHandle = null
      } = options2;
      const panelType = detectPanelType(panel);
      _layoutManager.register(panelId, element, constraints);
      _capabilityManager.registerPanel(panelId, capabilities);
      capabilities.forEach((cap) => _capabilityManager.request(panelId, cap));
      const record = {
        panelId,
        panelType,
        panel,
        element,
        constraints,
        capabilities,
        resizeObserver: null,
        dragCleanup: null,
        registeredAt: Date.now()
      };
      if (enableResize) {
        record.resizeObserver = setupResizeObserver(panelId, element, _emit, onLayoutChange);
      }
      if (enableDrag && _checkCapability(panelId, "draggable")) {
        record.dragCleanup = setupDragListeners(panelId, element, _layoutManager, _emit, dragHandle);
      }
      if (panelType === "legacy") {
        const adapter = createLegacyAdapter(panelId, panel, element);
        _legacyAdapters.set(panelId, adapter);
        _metrics.legacyPanels++;
      }
      _integratedPanels.set(panelId, record);
      _metrics.totalIntegrated++;
      onPanelRegistered?.(panelId, panelType);
      _emit("layout-integration:registered", { panelId, panelType });
      return true;
    },
    // Remove integração de painel
    unregister(panelId) {
      const record = _integratedPanels.get(panelId);
      if (!record) return false;
      if (record.resizeObserver) {
        record.resizeObserver.disconnect();
      }
      if (record.dragCleanup) {
        record.dragCleanup();
      }
      _layoutManager.unregister(panelId);
      _capabilityManager.unregisterPanel(panelId);
      _legacyAdapters.delete(panelId);
      _integratedPanels.delete(panelId);
      _emit("layout-integration:unregistered", { panelId });
      return true;
    },
    // Redimensiona painel
    resize(panelId, width, height, options2 = {}) {
      if (!_checkCapability(panelId, "resizable")) return false;
      _emit(LAYOUT_EVENTS.RESIZE_START, { panelId });
      const result = _layoutManager.resize(panelId, width, height, options2);
      const adapter = _legacyAdapters.get(panelId);
      if (adapter) adapter.resize(width, height);
      _metrics.layoutChanges++;
      _emit(LAYOUT_EVENTS.RESIZE_END, { panelId, width, height });
      onLayoutChange?.(panelId, "resize", { width, height });
      return result;
    },
    // Move painel
    move(panelId, x, y, options2 = {}) {
      if (!_checkCapability(panelId, "draggable")) return false;
      const result = _layoutManager.move(panelId, x, y, options2);
      const adapter = _legacyAdapters.get(panelId);
      if (adapter) adapter.move(x, y);
      _metrics.layoutChanges++;
      onLayoutChange?.(panelId, "move", { x, y });
      return result;
    },
    // Dock painel
    dock(panelId, zone) {
      if (!_checkCapability(panelId, "draggable")) return false;
      const result = _layoutManager.dock(panelId, zone);
      if (result) {
        _metrics.layoutChanges++;
        _emit(LAYOUT_EVENTS.DOCK, { panelId, zone });
        onLayoutChange?.(panelId, "dock", { zone });
      }
      return result;
    },
    // Undock painel
    undock(panelId) {
      const result = _layoutManager.undock(panelId);
      if (result) {
        _metrics.layoutChanges++;
        _emit(LAYOUT_EVENTS.UNDOCK, { panelId });
        onLayoutChange?.(panelId, "undock", {});
      }
      return result;
    },
    // Fullscreen
    toggleFullscreen(panelId) {
      if (!_checkCapability(panelId, "fullscreen")) return false;
      const layout = _layoutManager.getLayout(panelId);
      const isEntering = layout?.state !== LAYOUT_STATES.FULLSCREEN;
      const result = _layoutManager.toggleFullscreen(panelId);
      const adapter = _legacyAdapters.get(panelId);
      if (adapter) adapter.setFullscreen(isEntering);
      if (result) {
        _metrics.layoutChanges++;
        _emit(isEntering ? LAYOUT_EVENTS.FULLSCREEN_ENTER : LAYOUT_EVENTS.FULLSCREEN_EXIT, { panelId });
        onLayoutChange?.(panelId, "fullscreen", { isFullscreen: isEntering });
      }
      return result;
    },
    // Split view
    split(panelIds, mode2 = SPLIT_MODES.HORIZONTAL) {
      const allCapable = panelIds.every((id) => _checkCapability(id, "split-view"));
      if (!allCapable) return false;
      const result = _layoutManager.split(panelIds, mode2);
      if (result) {
        _metrics.layoutChanges++;
        _emit(LAYOUT_EVENTS.SPLIT, { panelIds, mode: mode2 });
        panelIds.forEach((id) => onLayoutChange?.(id, "split", { mode: mode2 }));
      }
      return result;
    },
    // Unsplit
    unsplit(panelId) {
      const result = _layoutManager.unsplit(panelId);
      if (result) {
        _metrics.layoutChanges++;
        _emit(LAYOUT_EVENTS.UNSPLIT, { panelId });
        onLayoutChange?.(panelId, "unsplit", {});
      }
      return result;
    },
    // Obtém layout de painel
    getLayout(panelId) {
      return _layoutManager.getLayout(panelId);
    },
    // Obtém estado da integração
    getIntegrationState(panelId) {
      const record = _integratedPanels.get(panelId);
      if (!record) return null;
      return {
        panelId,
        panelType: record.panelType,
        capabilities: record.capabilities,
        layout: _layoutManager.getLayout(panelId),
        hasAdapter: _legacyAdapters.has(panelId)
      };
    },
    // Lista painéis integrados
    list() {
      const list = [];
      _integratedPanels.forEach((record, panelId) => {
        list.push({
          panelId,
          panelType: record.panelType,
          hasAdapter: _legacyAdapters.has(panelId)
        });
      });
      return list;
    },
    // Obtém métricas
    getMetrics() {
      return {
        ..._metrics,
        mode,
        activePanels: _integratedPanels.size
      };
    },
    // Health check
    healthCheck() {
      const layoutHealth = _layoutManager.healthCheck();
      const capabilityHealth = _capabilityManager.healthCheck();
      const status = layoutHealth.status === "HEALTHY" && capabilityHealth.status === "HEALTHY" ? "HEALTHY" : "DEGRADED";
      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        mode,
        metrics: this.getMetrics(),
        layoutManager: layoutHealth,
        capabilityManager: capabilityHealth
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        mode,
        integratedPanels: _integratedPanels.size,
        legacyPanels: _legacyAdapters.size,
        events: Object.keys(LAYOUT_EVENTS)
      };
    },
    // Destroy
    destroy() {
      _destroyed = true;
      _integratedPanels.forEach((record) => {
        if (record.resizeObserver) record.resizeObserver.disconnect();
        if (record.dragCleanup) record.dragCleanup();
      });
      _integratedPanels.clear();
      _legacyAdapters.clear();
      _emit("layout-integration:destroyed", { metrics: _metrics });
    }
  };
  return integration;
}
let _globalIntegration = null;
function getLayoutIntegration(options) {
  if (!_globalIntegration) {
    _globalIntegration = createLayoutIntegration(options);
  }
  return _globalIntegration;
}
function resetGlobalIntegration() {
  if (_globalIntegration) {
    _globalIntegration.destroy();
    _globalIntegration = null;
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createLayoutIntegration", "getLayoutIntegration"],
    modes: Object.keys(INTEGRATION_MODES),
    events: Object.keys(LAYOUT_EVENTS)
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalIntegration: !!_globalIntegration
  };
}
var layout_integration_default = {
  VERSION,
  MODULE_ID,
  INTEGRATION_MODES,
  LAYOUT_EVENTS,
  createLayoutIntegration,
  getLayoutIntegration,
  resetGlobalIntegration,
  info,
  healthCheck
};
export {
  INTEGRATION_MODES,
  LAYOUT_EVENTS,
  MODULE_ID,
  VERSION,
  createLayoutIntegration,
  layout_integration_default as default,
  getLayoutIntegration,
  healthCheck,
  info,
  resetGlobalIntegration
};
