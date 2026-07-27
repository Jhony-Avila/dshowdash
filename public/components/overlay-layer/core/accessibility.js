const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer-accessibility";
let _announcer = null;
const _config = {
  enabled: true,
  politeness: "polite",
  announceOpen: true,
  announceClose: true,
  announceRole: true,
  locale: "pt-BR"
};
const _metrics = { announcements: 0 };
const MESSAGES = {
  "pt-BR": {
    opened: "{type} aberto",
    closed: "{type} fechado",
    loading: "Carregando",
    types: {
      modal: "Modal",
      dialog: "Di\xE1logo",
      alertdialog: "Alerta",
      drawer: "Gaveta lateral",
      menu: "Menu",
      tooltip: "Dica",
      toast: "Notifica\xE7\xE3o",
      loading: "Carregamento",
      preloader: "Carregamento inicial",
      confirmation: "Confirma\xE7\xE3o"
    }
  },
  "en-US": {
    opened: "{type} opened",
    closed: "{type} closed",
    loading: "Loading",
    types: {
      modal: "Modal",
      dialog: "Dialog",
      alertdialog: "Alert",
      drawer: "Drawer",
      menu: "Menu",
      tooltip: "Tooltip",
      toast: "Notification",
      loading: "Loading",
      preloader: "Initial loading",
      confirmation: "Confirmation"
    }
  }
};
function _createAnnouncer() {
  if (_announcer) return _announcer;
  if (typeof document === "undefined") return null;
  _announcer = document.createElement("div");
  _announcer.id = "overlay-announcer";
  _announcer.setAttribute("role", "status");
  _announcer.setAttribute("aria-live", "polite");
  _announcer.setAttribute("aria-atomic", "true");
  _announcer.style.position = "absolute";
  _announcer.style.width = "1px";
  _announcer.style.height = "1px";
  _announcer.style.padding = "0";
  _announcer.style.margin = "-1px";
  _announcer.style.overflow = "hidden";
  _announcer.style.clip = "rect(0, 0, 0, 0)";
  _announcer.style.whiteSpace = "nowrap";
  _announcer.style.border = "0";
  document.body.appendChild(_announcer);
  return _announcer;
}
function _getMessage(key) {
  const locale = MESSAGES[_config.locale] || MESSAGES["pt-BR"];
  return locale[key] || MESSAGES["pt-BR"][key] || key;
}
function _getTypeName(type) {
  const locale = MESSAGES[_config.locale] || MESSAGES["pt-BR"];
  return locale.types[type] || locale.types.modal || type;
}
function announce(message, options) {
  options = options || {};
  if (!_config.enabled) return { ok: false, reason: "disabled" };
  const announcer = _createAnnouncer();
  if (!announcer) return { ok: false, reason: "no-announcer" };
  const politeness = options.politeness || _config.politeness;
  announcer.setAttribute("aria-live", politeness);
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer.textContent = message;
    _metrics.announcements++;
  });
  return { ok: true, message };
}
function announceOpen(overlayType, customMessage) {
  if (!_config.announceOpen) return { ok: false, reason: "announceOpen-disabled" };
  const typeName = _getTypeName(overlayType);
  const template = _getMessage("opened");
  const message = customMessage || template.replace("{type}", typeName);
  return announce(message);
}
function announceClose(overlayType, customMessage) {
  if (!_config.announceClose) return { ok: false, reason: "announceClose-disabled" };
  const typeName = _getTypeName(overlayType);
  const template = _getMessage("closed");
  const message = customMessage || template.replace("{type}", typeName);
  return announce(message);
}
function announceLoading(message) {
  const loadingMsg = message || _getMessage("loading");
  return announce(loadingMsg);
}
function setOverlayRole(element, type, options) {
  options = options || {};
  if (!element) return { ok: false, reason: "no-element" };
  const roleMap = {
    modal: "dialog",
    dialog: "dialog",
    alertdialog: "alertdialog",
    drawer: "dialog",
    menu: "menu",
    tooltip: "tooltip",
    toast: "status",
    loading: "status",
    preloader: "status",
    confirmation: "alertdialog"
  };
  const role = roleMap[type] || "dialog";
  element.setAttribute("role", role);
  if (role === "dialog" || role === "alertdialog") {
    element.setAttribute("aria-modal", "true");
  }
  if (options.label) {
    element.setAttribute("aria-label", options.label);
  } else if (options.labelledBy) {
    element.setAttribute("aria-labelledby", options.labelledBy);
  }
  if (options.describedBy) {
    element.setAttribute("aria-describedby", options.describedBy);
  }
  if (_config.announceRole && options.announceRole !== false) {
    announceOpen(type);
  }
  return { ok: true, role, type };
}
function clearOverlayRole(element, type, options) {
  options = options || {};
  if (!element) return { ok: false, reason: "no-element" };
  element.removeAttribute("role");
  element.removeAttribute("aria-modal");
  element.removeAttribute("aria-label");
  element.removeAttribute("aria-labelledby");
  element.removeAttribute("aria-describedby");
  if (options.announce !== false) {
    announceClose(type);
  }
  return { ok: true };
}
function hideFromScreenReaders(elements) {
  if (!elements) return { ok: false };
  const list = Array.isArray(elements) ? elements : [elements];
  const modified = [];
  for (let i = 0; i < list.length; i++) {
    const el = list[i];
    if (el && !el.hasAttribute("aria-hidden")) {
      el.setAttribute("aria-hidden", "true");
      el.dataset.overlayHidden = "true";
      modified.push(el);
    }
  }
  return { ok: true, count: modified.length };
}
function showToScreenReaders(elements) {
  if (!elements) return { ok: false };
  const list = Array.isArray(elements) ? elements : [elements];
  const restored = [];
  for (let i = 0; i < list.length; i++) {
    const el = list[i];
    if (el && el.dataset.overlayHidden === "true") {
      el.removeAttribute("aria-hidden");
      delete el.dataset.overlayHidden;
      restored.push(el);
    }
  }
  return { ok: true, count: restored.length };
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  if (newConfig.enabled !== void 0) _config.enabled = newConfig.enabled;
  if (newConfig.politeness) _config.politeness = newConfig.politeness;
  if (newConfig.announceOpen !== void 0) _config.announceOpen = newConfig.announceOpen;
  if (newConfig.announceClose !== void 0) _config.announceClose = newConfig.announceClose;
  if (newConfig.announceRole !== void 0) _config.announceRole = newConfig.announceRole;
  if (newConfig.locale) _config.locale = newConfig.locale;
  return { ok: true, config: Object.assign({}, _config) };
}
function init(config) {
  if (config) setConfig(config);
  _createAnnouncer();
  return { ok: true };
}
function cleanup() {
  if (_announcer) {
    _announcer.remove();
    _announcer = null;
  }
  return { ok: true };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const checks = {
    enabled: _config.enabled,
    announcerExists: !!_announcer || typeof document === "undefined"
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    announcerExists: !!_announcer,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var accessibility_default = {
  init,
  cleanup,
  announce,
  announceOpen,
  announceClose,
  announceLoading,
  setOverlayRole,
  clearOverlayRole,
  hideFromScreenReaders,
  showToScreenReaders,
  getConfig,
  setConfig,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  announce,
  announceClose,
  announceLoading,
  announceOpen,
  cleanup,
  clearOverlayRole,
  accessibility_default as default,
  getConfig,
  getMetrics,
  healthCheck,
  hideFromScreenReaders,
  info,
  init,
  setConfig,
  setOverlayRole,
  showToScreenReaders
};
