const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.core.initializer.core.ports-factory";
import { createNavigationPort } from "/components/main/ports/NavigationPort.js";
import { createAuthPort } from "/components/main/ports/AuthPort.js";
import { createStatePort } from "/components/main/ports/StatePort.js";
import { createPanelPort } from "/components/main/ports/PanelPort.js";
import { createCanvasPort } from "/components/main/ports/CanvasPort.js";
import { createTelemetryPort } from "/components/main/ports/TelemetryPort.js";
import { createUIAdapterPort } from "/components/main/ports/UIAdapterPort.js";
import { createContainerPort } from "/components/main/ports/ContainerPort.js";
function createPorts(adapters, deps) {
  const eventBusAdapter = deps.eventBusAdapter;
  const containerAdapter = deps.containerAdapter;
  const containerPort = createContainerPort(containerAdapter);
  const telemetryPort = createTelemetryPort({
    track(event, data) {
      adapters.telemetry.track(event, data);
    },
    error(err, ctx) {
      adapters.telemetry.error(err, ctx);
    },
    timeline(event, data) {
      if (adapters.telemetry.timeline) adapters.telemetry.timeline(event, data);
    }
  });
  const navigationPort = createNavigationPort({
    onNavigate(route) {
      adapters.router.navigate(route);
    },
    onRouteChange(handler) {
      adapters.router.onRouteChange(handler);
    },
    prefetch(route) {
      if (adapters.router.prefetch) adapters.router.prefetch(route);
    },
    resolveMetadata(route) {
      if (adapters.router.resolveMetadata) return adapters.router.resolveMetadata(route);
    }
  });
  const authPort = createAuthPort({
    getUser() {
      return adapters.auth.getUser();
    },
    isAuthenticated() {
      return adapters.auth.isAuthenticated();
    },
    hasRole(role) {
      return adapters.auth.hasRole ? adapters.auth.hasRole(role) : false;
    },
    hasCapability(cap) {
      return adapters.auth.hasCapability ? adapters.auth.hasCapability(cap) : false;
    },
    getLevel() {
      return adapters.auth.getLevel ? adapters.auth.getLevel() : null;
    },
    onAuthChange(handler) {
      adapters.auth.onAuthChange(handler);
    },
    onRoleChange(handler) {
      if (adapters.auth.onRoleChange) adapters.auth.onRoleChange(handler);
    },
    evaluatePolicy(resource, action) {
      return adapters.auth.evaluatePolicy ? adapters.auth.evaluatePolicy(resource, action) : null;
    }
  });
  const statePort = createStatePort({
    get(key) {
      return adapters.state.get(key);
    },
    set(key, value) {
      adapters.state.set(key, value);
    },
    subscribe(key, handler) {
      adapters.state.subscribe(key, handler);
    },
    getState() {
      return adapters.state.getState ? adapters.state.getState() : null;
    },
    createSlice(name, initial, reducers) {
      return adapters.state.createSlice ? adapters.state.createSlice(name, initial, reducers) : null;
    },
    select(fn) {
      return adapters.state.select ? adapters.state.select(fn) : null;
    }
  });
  const panelPort = createPanelPort({
    load(panelId) {
      return adapters.panelLoader.load(panelId);
    },
    mount(module, container, config) {
      return adapters.panelLoader.mount(module, container, config);
    },
    unmount(module) {
      return adapters.panelLoader.unmount(module);
    },
    resolvePanelFromManifest(manifest, route) {
      return adapters.panelLoader.resolvePanelFromManifest ? adapters.panelLoader.resolvePanelFromManifest(manifest, route) : null;
    }
  });
  const canvasPort = createCanvasPort({
    init(container) {
      return adapters.canvas.init(container);
    },
    clear() {
      return adapters.canvas.clear();
    }
  });
  const uiLegacyPort = createUIAdapterPort({
    selectMainContainer() {
      return adapters.dom.selectMainContainer();
    },
    render(html) {
      return adapters.dom.render(html);
    },
    clear() {
      return adapters.dom.clear();
    }
  });
  return {
    events: eventBusAdapter,
    ui: adapters.ui,
    container: containerPort,
    navigation: navigationPort,
    timer: adapters.timer,
    globals: adapters.globals,
    auth: authPort,
    state: statePort,
    panel: panelPort,
    canvas: canvasPort,
    telemetry: telemetryPort,
    uiLegacy: uiLegacyPort
  };
}
var ports_factory_default = {
  createPorts
};
export {
  MODULE_ID,
  VERSION,
  createPorts,
  ports_factory_default as default
};
