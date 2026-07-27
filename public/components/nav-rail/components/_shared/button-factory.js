import { NavRailButtonBase } from "./button-base.js";
import { NavRailRegistry } from "../../registry/index.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "2.1.0-ES6";
const MODULE_ID = "navrail-button-factory";
const _instances = /* @__PURE__ */ new Map();
function buildConfigFromRegistry(buttonId) {
  const item = NavRailRegistry.getItem(buttonId);
  if (!item) {
    return { id: buttonId, label: buttonId, icon: "default", area: "navrail", group: "unknown", meta: {} };
  }
  return {
    id: item.id,
    label: item.label,
    icon: item.icon,
    area: "navrail",
    group: item.group,
    meta: {
      route: item.route,
      panelId: item.panelId,
      intentId: item.intentId,
      order: item.order
    }
  };
}
function buildActionPayload(buttonId) {
  const item = NavRailRegistry.getItem(buttonId);
  if (!item) {
    return { actionId: `navrail:${buttonId}`, meta: { route: `#/${buttonId}`, panelId: `panel-${buttonId}` } };
  }
  return {
    actionId: `navrail:${item.id}`,
    meta: {
      route: item.route || `#/${item.id}`,
      panelId: item.panelId || `panel-${item.id}`,
      intentId: item.intentId
    }
  };
}
function createButton(buttonId) {
  const config = buildConfigFromRegistry(buttonId);
  return new NavRailButtonBase(config);
}
function getInstance(buttonId) {
  if (!_instances.has(buttonId)) {
    _instances.set(buttonId, createButton(buttonId));
  }
  return _instances.get(buttonId);
}
function clearInstance(buttonId) {
  if (_instances.has(buttonId)) {
    const inst = _instances.get(buttonId);
    if (inst && typeof inst.unmount === "function") inst.unmount();
    _instances.delete(buttonId);
  }
}
function clearAllInstances() {
  _instances.forEach((inst, id) => {
    if (inst && typeof inst.unmount === "function") inst.unmount();
  });
  _instances.clear();
}
function createButtonExports(buttonId) {
  const moduleId = `navrail/components/${buttonId}`;
  const version = "3.1.0-ES6";
  return {
    VERSION: version,
    MODULE_ID: moduleId,
    getInstance() {
      return getInstance(buttonId);
    },
    createButton() {
      return createButton(buttonId);
    },
    init(ctx) {
      return getInstance(buttonId).init(ctx);
    },
    mount(hostEl, props) {
      return getInstance(buttonId).mount(hostEl, props);
    },
    unmount() {
      return getInstance(buttonId).unmount();
    },
    healthCheck() {
      return getInstance(buttonId).healthCheck();
    },
    info() {
      const baseInfo = getInstance(buttonId).info();
      return Object.assign({}, baseInfo, {
        actionPayload: buildActionPayload(buttonId),
        emits: [UI_EVENTS.ACTION],
        factoryGenerated: true
      });
    },
    getElement() {
      return getInstance(buttonId).getElement();
    },
    isMounted() {
      return getInstance(buttonId).isMounted();
    },
    getId() {
      return buttonId;
    },
    BUTTON_CONFIG: buildConfigFromRegistry(buttonId),
    ACTION_PAYLOAD: buildActionPayload(buttonId),
    EMITTED_EVENTS: [UI_EVENTS.ACTION]
  };
}
function healthCheck() {
  const instanceCount = _instances.size;
  let mountedCount = 0;
  _instances.forEach((inst) => {
    if (inst && inst.isMounted && inst.isMounted()) mountedCount++;
  });
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    instanceCount,
    mountedCount,
    instances: Array.from(_instances.keys()),
    registrySource: NavRailRegistry.getSource ? NavRailRegistry.getSource() : "unknown"
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    purpose: "Centralized button creation from NavRailRegistry (API SSOT)",
    instanceCount: _instances.size,
    instances: Array.from(_instances.keys()),
    registryLoaded: NavRailRegistry.isLoaded ? NavRailRegistry.isLoaded() : false,
    registrySource: NavRailRegistry.getSource ? NavRailRegistry.getSource() : "unknown",
    capabilities: ["createButton", "getInstance", "createButtonExports", "clearInstance", "clearAllInstances"]
  };
}
var button_factory_default = {
  createButton,
  getInstance,
  clearInstance,
  clearAllInstances,
  createButtonExports,
  buildConfigFromRegistry,
  buildActionPayload,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  buildActionPayload,
  buildConfigFromRegistry,
  clearAllInstances,
  clearInstance,
  createButton,
  createButtonExports,
  button_factory_default as default,
  getInstance,
  healthCheck,
  info
};
