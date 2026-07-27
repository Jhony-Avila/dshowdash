import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as ButtonsRegistry from "./registry.js";
import { createLogger } from "../../core/logger.js";
const VERSION = "1.6.0-P18EC";
const MODULE_ID = "footer/components/buttons/mounter";
const MOUNTER_EVENTS = { BUTTONS_MOUNTED: "footer:buttons:mounted" };
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = createLogger(MODULE_ID);
const _mountedInstances = /* @__PURE__ */ new Map();
function mountComponent(id, hostEl, props) {
  props = props || {};
  if (!hostEl) {
    _log.warn(`No host for: ${id}`);
    return Promise.resolve(null);
  }
  if (_mountedInstances.has(id)) {
    const existing = _mountedInstances.get(id);
    if (existing.host === hostEl) return Promise.resolve(existing.instance);
    return unmountComponent(id).then(() => doMount());
  }
  return doMount();
  function doMount() {
    return ButtonsRegistry.loadComponent(id).then((module) => {
      if (!module) return null;
      let instance;
      if (typeof module.getInstance === "function") {
        instance = module.getInstance();
      } else if (typeof module.mount === "function") {
        if (module.init) module.init({});
        module.mount(hostEl, props);
        _mountedInstances.set(id, { instance: module, host: hostEl });
        return module;
      } else {
        return null;
      }
      if (instance.init) instance.init({});
      instance.mount(hostEl, props);
      _mountedInstances.set(id, { instance, host: hostEl });
      return instance;
    }).catch((err) => {
      _log.error(`Mount failed: ${id}`, err);
      return null;
    });
  }
}
function unmountComponent(id) {
  const entry = _mountedInstances.get(id);
  if (!entry) return Promise.resolve(false);
  try {
    if (entry.instance && typeof entry.instance.unmount === "function") entry.instance.unmount();
    _mountedInstances.delete(id);
    return Promise.resolve(true);
  } catch (err) {
    _log.error(`Unmount failed: ${id}`, err);
    return Promise.resolve(false);
  }
}
function mountDecorativeButtons(container) {
  _log.info("mountDecorativeButtons SKIPPED - IconsOrchestrator handles decorative icons");
  return Promise.resolve({ mounted: [], failed: [], skipped: true });
}
function mountControlButtons(container) {
  const controlsSlot = container.querySelector(".dsd-footer__controls");
  if (!controlsSlot) {
    _log.warn("Controls slot not found");
    return Promise.resolve({ mounted: [], failed: [] });
  }
  const results = { mounted: [], failed: [] };
  const controlIds = ButtonsRegistry.getControlIds();
  let chain = Promise.resolve();
  controlIds.forEach((id) => {
    chain = chain.then(() => {
      const oldBtn = controlsSlot.querySelector(`[data-action="${id}"]`);
      if (oldBtn) oldBtn.remove();
      const host = document.createElement("div");
      host.className = "footer-btn-host footer-btn-host--control";
      host.dataset.hostId = id;
      controlsSlot.appendChild(host);
      const props = id === "language" ? { label: "PT" } : { label: "Sair" };
      return mountComponent(id, host, props).then((instance) => {
        if (instance) results.mounted.push(id);
        else results.failed.push(id);
      });
    });
  });
  return chain.then(() => results);
}
function mountLegalLinks(container) {
  const linksSlot = container.querySelector('[data-slot="links"]');
  if (!linksSlot) {
    _log.warn("Links slot not found");
    return Promise.resolve({ mounted: [], failed: [] });
  }
  linksSlot.innerHTML = "";
  const linkIds = ButtonsRegistry.getLinkIds();
  const results = { mounted: [], failed: [] };
  let chain = Promise.resolve();
  linkIds.forEach((id) => {
    chain = chain.then(() => {
      const host = document.createElement("span");
      host.className = "footer-link-host";
      host.dataset.hostId = id;
      linksSlot.appendChild(host);
      return mountComponent(id, host, {}).then((instance) => {
        if (instance) results.mounted.push(id);
        else results.failed.push(id);
      });
    });
  });
  return chain.then(() => results);
}
function mountAll(container) {
  return Promise.all([mountControlButtons(container), mountLegalLinks(container)]).then((allResults) => {
    const controlResults = allResults[0];
    const linkResults = allResults[1];
    const results = { mounted: controlResults.mounted.concat(linkResults.mounted), failed: controlResults.failed.concat(linkResults.failed) };
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit(MOUNTER_EVENTS.BUTTONS_MOUNTED, { source: MODULE_ID, mounted: results.mounted, failed: results.failed, decorative: 0, controls: controlResults.mounted.length, links: linkResults.mounted.length, timestamp: Date.now() });
    }
    return results;
  });
}
function unmountAll() {
  const ids = Array.from(_mountedInstances.keys());
  let chain = Promise.resolve();
  ids.forEach((id) => {
    chain = chain.then(() => unmountComponent(id));
  });
  return chain.then(() => ids);
}
function healthCheck() {
  const ps = Ports.snapshot();
  const mounted = Array.from(_mountedInstances.keys());
  return { status: mounted.length > 0 ? "HEALTHY" : "IDLE", mountedCount: mounted.length, mounted, version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized };
}
function info() {
  const ps = Ports.snapshot();
  return { version: VERSION, moduleId: MODULE_ID, availableButtons: ButtonsRegistry.getAvailableIds(), mountedButtons: Array.from(_mountedInstances.keys()), decorativeCount: 0, controlCount: ButtonsRegistry.getControlIds().length, linkCount: ButtonsRegistry.getLinkIds().length, totalAvailable: ButtonsRegistry.getAvailableIds().length, note: "Decorative icons now handled by IconsOrchestrator", portsInitialized: ps._initialized };
}
const FooterButtonsMounter = { mountComponent, unmountComponent, mountDecorativeButtons, mountControlButtons, mountLegalLinks, mountAll, unmountAll, healthCheck, info, MOUNTER_EVENTS, VERSION, MODULE_ID };
var component_mounter_default = FooterButtonsMounter;
export {
  FooterButtonsMounter,
  MODULE_ID,
  VERSION,
  component_mounter_default as default,
  getPorts,
  injectPorts
};
