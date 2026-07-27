import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const MODULE_ID = "components.footer.links-useful";
const VERSION = "2.5.0-ICON-LINKS";
const LINKS_TELEMETRY = { CLICKED: "footer:link:clicked" };
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const _state = { initialized: false, links: [] };
const _metrics = { clicks: 0, uiActions: 0 };
const LINK_ICONS = {
  "docs": '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
  "support": '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};
const DEFAULT_LINKS = [
  { id: "docs", label: "Docs", url: "/docs", icon: "docs", renderAs: "icon" },
  { id: "support", label: "Suporte", url: "/support", icon: "support", renderAs: "icon" },
  { id: "api", label: "API", url: "/api/docs", icon: "code", renderAs: "text" }
];
function _track(eventKey, payload) {
  try {
    var tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function _emitLinkClick(linkId, linkUrl) {
  _metrics.uiActions++;
  const eventBus = _getPort("eventBus");
  if (!eventBus || !eventBus.emit) return;
  eventBus.emit(UI_EVENTS.FOOTER_BUTTON_CLICK, {
    buttonId: linkId,
    trigger: "trigger:footer:" + linkId,
    timestamp: Date.now(),
    meta: { source: "footer", type: "link", url: linkUrl }
  });
}
function setLinks(links) {
  _state.links = links || [];
  return { ok: true, count: _state.links.length };
}
function getLinks() {
  return _state.links.slice();
}
function addLink(link) {
  _state.links.push(link);
  return { ok: true };
}
function removeLink(id) {
  var idx = _state.links.findIndex(function(l) {
    return l.id === id;
  });
  if (idx >= 0) {
    _state.links.splice(idx, 1);
    return { ok: true };
  }
  return { ok: false };
}
function trackClick(linkId, linkUrl) {
  _metrics.clicks++;
  _track(LINKS_TELEMETRY.CLICKED, { linkId });
  _emitLinkClick(linkId, linkUrl);
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.links) _state.links = ctx.links;
  else _state.links = DEFAULT_LINKS.slice();
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, p2Spec: true, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" }, uarpsCompliant: { ok: true, severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p2Spec: true, initialized: _state.initialized, linksCount: _state.links.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function FooterLinksUseful(options) {
  options = options || {};
  this._container = null;
  this._mounted = false;
  this._element = null;
}
FooterLinksUseful.prototype.mount = function(container, config, integrations) {
  if (this._mounted) return Promise.resolve();
  init();
  this._container = container;
  this._element = document.createElement("nav");
  this._element.className = "dsd-footer__links-useful";
  this._element.setAttribute("aria-label", "Links \xDAteis");
  this._renderLinks();
  this._container.appendChild(this._element);
  this._mounted = true;
  return Promise.resolve();
};
FooterLinksUseful.prototype._renderLinks = function() {
  const links = getLinks();
  let html = '<ul class="dsd-footer__links-list">';
  for (var i = 0; i < links.length; i++) {
    const link = links[i];
    const triggerId = "trigger:footer:" + link.id;
    if (link.renderAs === "icon" && LINK_ICONS[link.id]) {
      html += '<li><a href="' + link.url + '" class="dsd-footer__link dsd-footer__link--icon" data-link-id="' + link.id + '" data-uarps-trigger="' + triggerId + '" title="' + link.label + '" aria-label="' + link.label + '">' + LINK_ICONS[link.id] + "</a></li>";
    } else {
      html += '<li><a href="' + link.url + '" class="dsd-footer__link" data-link-id="' + link.id + '" data-uarps-trigger="' + triggerId + '">' + link.label + "</a></li>";
    }
  }
  html += "</ul>";
  this._element.innerHTML = html;
  const anchors = this._element.querySelectorAll(".dsd-footer__link");
  for (var j = 0; j < anchors.length; j++) {
    anchors[j].addEventListener("click", function(e) {
      const linkId = this.getAttribute("data-link-id");
      const linkUrl = this.getAttribute("href");
      if (linkId) trackClick(linkId, linkUrl);
    });
  }
};
FooterLinksUseful.prototype.destroy = function() {
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  this._mounted = false;
};
FooterLinksUseful.prototype.isLoaded = function() {
  return this._mounted;
};
FooterLinksUseful.prototype.getLinks = function() {
  return getLinks();
};
FooterLinksUseful.prototype.setLinks = function(links) {
  setLinks(links);
  this._renderLinks();
};
FooterLinksUseful.prototype.addLink = function(link) {
  addLink(link);
  this._renderLinks();
};
FooterLinksUseful.prototype.healthCheck = function() {
  return healthCheck();
};
FooterLinksUseful.prototype.info = function() {
  return info();
};
var links_useful_default = FooterLinksUseful;
export {
  FooterLinksUseful,
  LINKS_TELEMETRY,
  MODULE_ID,
  VERSION,
  addLink,
  links_useful_default as default,
  getLinks,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  removeLink,
  setLinks,
  trackClick
};
