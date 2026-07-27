import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { FOOTER_EVENTS } from "/core/runtime/events/catalog/footer.events.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { createLogger } from "../core/logger.js";
import { FooterIconsRegistry } from "./icons/registry/index.js";
const VERSION = "2.7.0-HARDNAV";
const MODULE_ID = "footer-icons-orchestrator";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = createLogger(MODULE_ID);
const _metrics = { mounts: 0, unmounts: 0, clicks: 0, panelRequests: 0, errors: 0, eventBusMissing: 0, skippedSeparators: 0 };
const _mountedIcons = /* @__PURE__ */ new Map();
let _cleanups = [];
function _isSeparator(iconConfig, iconId) {
  if (iconConfig.type === "separator") return true;
  if (!iconId) return false;
  return iconId === "separator" || typeof iconId === "string" && iconId.indexOf("sep") === 0;
}
function _getEventBus() {
  _initPorts();
  const eb = _getPort("eventBus");
  if (!eb) {
    _metrics.eventBusMissing++;
    _log.error("EventBus not available via Ports - DI configuration error");
  }
  return eb;
}
function _emit(eventName, data) {
  const eb = _getEventBus();
  if (eb && eb.emit) {
    eb.emit(eventName, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
    return true;
  }
  return false;
}
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
    _metrics.errors++;
  }
}
function _handleIconClick(iconId, item) {
  _metrics.clicks++;
  _log.info(`Icon clicked: ${iconId}`, { item });
  _track(FOOTER_EVENTS.ICON_CLICKED, { iconId });
  _emit(FOOTER_EVENTS.ICON_CLICKED, { iconId, item });
  let panelId = null;
  if (item) {
    panelId = item.panelId || item.panel || null;
    if (!panelId && item.actionData) {
      let ad = item.actionData;
      if (typeof ad === "string") {
        try {
          ad = JSON.parse(ad);
        } catch (e) {
          ad = {};
        }
      }
      panelId = ad.panelId || ad.panel_id || null;
    }
  }
  if (panelId) {
    _metrics.panelRequests++;
    _log.info(`Requesting panel: ${panelId} from icon: ${iconId}`);
    _emit(PANEL_EVENTS.OPEN_REQUEST, { panelId, trigger: `footer-icon:${iconId}` });
    _emit(PANEL_EVENTS.OPEN, { panelId, source: "footer-icon", iconId });
    _emit("panel.open", { panelId, source: "footer-icon", iconId });
    _emit("panel.open.request", { panelId, source: "footer-icon", iconId });
  }
  if (item && item.action && typeof item.action === "function") {
    try {
      item.action();
    } catch (e) {
      _metrics.errors++;
      _log.error(`Icon action failed: ${iconId}`, { error: e.message });
    }
  }
  if (item && item.href) {
    if (item.external) {
      _emit(UI_EVENTS.HARD_NAV, { action: "external", url: item.href, reason: "footer-icon-external", iconId });
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      _emit(UI_EVENTS.HARD_NAV, { action: "redirect", url: item.href, reason: "footer-icon-internal", iconId });
      window.location.href = item.href;
    }
  }
}
function mountIcon(iconId, hostEl, config) {
  config = config || {};
  if (!hostEl) {
    _log.warn(`No host element for icon: ${iconId}`);
    return Promise.resolve(null);
  }
  if (_mountedIcons.has(iconId)) {
    return Promise.resolve(_mountedIcons.get(iconId));
  }
  return FooterIconsRegistry.getIcon(iconId).then((IconModule) => {
    if (!IconModule) {
      _log.warn(`Icon not found in registry: ${iconId}`);
      return null;
    }
    _metrics.mounts++;
    let instance = null;
    if (typeof IconModule.mount === "function") {
      instance = IconModule.mount(hostEl, config);
    } else if (typeof IconModule.render === "function") {
      hostEl.innerHTML = IconModule.render(config);
      instance = IconModule;
    } else if (IconModule.default && typeof IconModule.default.mount === "function") {
      instance = IconModule.default.mount(hostEl, config);
    }
    if (instance) {
      _mountedIcons.set(iconId, { instance, host: hostEl, config });
      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        _handleIconClick(iconId, config);
      };
      hostEl.addEventListener("click", clickHandler);
      _cleanups.push(() => {
        hostEl.removeEventListener("click", clickHandler);
      });
      _emit(FOOTER_EVENTS.ICON_MOUNTED, { iconId });
    }
    return instance;
  }).catch((err) => {
    _metrics.errors++;
    _log.error(`Failed to mount icon: ${iconId}`, { error: err.message });
    return null;
  });
}
function unmountIcon(iconId) {
  const entry = _mountedIcons.get(iconId);
  if (!entry) return Promise.resolve(false);
  _metrics.unmounts++;
  try {
    if (entry.instance && typeof entry.instance.unmount === "function") {
      entry.instance.unmount();
    }
    if (entry.host) {
      entry.host.innerHTML = "";
    }
    _mountedIcons.delete(iconId);
    _emit(FOOTER_EVENTS.ICON_UNMOUNTED, { iconId });
    return Promise.resolve(true);
  } catch (err) {
    _metrics.errors++;
    _log.error(`Failed to unmount icon: ${iconId}`, { error: err.message });
    return Promise.resolve(false);
  }
}
function mountAll(container, iconsConfig) {
  iconsConfig = iconsConfig || [];
  const results = { mounted: [], failed: [], skipped: [] };
  if (!container) {
    _log.warn("No container provided for mountAll");
    return Promise.resolve(results);
  }
  _log.info("mountAll called", { iconsCount: iconsConfig.length });
  const iconsSlot = container.querySelector('[data-slot="icons"]') || container.querySelector(".dsd-footer__icons") || container;
  let chain = Promise.resolve();
  iconsConfig.forEach((iconConfig) => {
    chain = chain.then(() => {
      const iconId = iconConfig.icon || iconConfig.id;
      if (!iconId) {
        _log.warn("Icon config missing icon/id", iconConfig);
        return;
      }
      if (_isSeparator(iconConfig, iconId)) {
        _metrics.skippedSeparators++;
        results.skipped.push(iconId);
        return;
      }
      if (!FooterIconsRegistry.hasIcon(iconId)) {
        _log.warn(`Icon not in registry: ${iconId}`);
        results.failed.push(iconId);
        return;
      }
      const host = document.createElement("div");
      host.className = "footer-icon-host";
      host.dataset.iconId = iconId;
      if (iconConfig.tooltip) host.title = iconConfig.tooltip;
      if (iconConfig.ariaLabel) host.setAttribute("aria-label", iconConfig.ariaLabel);
      host.style.cursor = "pointer";
      iconsSlot.appendChild(host);
      return mountIcon(iconId, host, iconConfig).then((instance) => {
        if (instance) {
          results.mounted.push(iconId);
        } else {
          results.failed.push(iconId);
        }
      });
    });
  });
  return chain.then(() => {
    _emit(FOOTER_EVENTS.ICONS_READY, { mounted: results.mounted.length, failed: results.failed.length, skipped: results.skipped.length });
    _log.info(`Icons mount complete: ${results.mounted.length} mounted, ${results.failed.length} failed, ${results.skipped.length} skipped`);
    return results;
  });
}
function unmountAll() {
  const ids = Array.from(_mountedIcons.keys());
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  let chain = Promise.resolve();
  ids.forEach((id) => {
    chain = chain.then(() => unmountIcon(id));
  });
  return chain.then(() => {
    _log.info(`All icons unmounted: ${ids.length}`);
    return ids;
  });
}
function getMountedIcons() {
  return Array.from(_mountedIcons.keys());
}
function healthCheck() {
  const ps = Ports.snapshot();
  const eventBus = _getPort("eventBus");
  const eventBusAvailable = !!eventBus;
  const noFallbackErrors = _metrics.eventBusMissing === 0;
  const lowErrors = _metrics.errors < 5;
  return {
    status: eventBusAvailable && noFallbackErrors && lowErrors ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    p0Enterprise: true,
    checks: {
      eventBusAvailable,
      noFallbackErrors,
      lowErrors,
      portsInitialized: ps._initialized
    },
    mountedCount: _mountedIcons.size,
    metrics: Object.assign({}, _metrics)
  };
}
function info() {
  const ps = Ports.snapshot();
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    p0Enterprise: true,
    noWindowFallback: true,
    mountedIcons: getMountedIcons(),
    mountedCount: _mountedIcons.size,
    availableIcons: FooterIconsRegistry.getAvailableIcons ? FooterIconsRegistry.getAvailableIcons() : [],
    metrics: Object.assign({}, _metrics),
    portsInitialized: ps._initialized
  };
}
const FooterIconsOrchestrator = {
  mountIcon,
  unmountIcon,
  mountAll,
  unmountAll,
  getMountedIcons,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
var icons_orchestrator_default = FooterIconsOrchestrator;
export {
  FooterIconsOrchestrator,
  MODULE_ID,
  VERSION,
  icons_orchestrator_default as default,
  getPorts,
  injectPorts
};
