import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-stub-dev";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const SVG_WRENCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
let _container = null;
const mount = (root, props = {}) => {
  _initPorts();
  _container = root;
  const label = props.label || (props.item ? props.item.label : "") || "Este modulo";
  const itemKey = props.itemKey || (props.item ? props.item.item_key : "") || "";
  const panelId = props.panelId || "panel-stub-dev";
  const now = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
  root.innerHTML = `<div class="panel-stub-dev"><div class="panel-stub-dev__icon">${SVG_WRENCH}</div><div class="panel-stub-dev__title">${label}</div><div class="panel-stub-dev__subtitle">Este modulo esta em desenvolvimento e estara disponivel em breve.</div><div class="panel-stub-dev__badge"><span class="panel-stub-dev__badge-dot"></span>Em Desenvolvimento</div><div class="panel-stub-dev__meta">${itemKey ? `${itemKey} - ` : ""}${panelId} - ${now}</div></div>`;
  const cssId = "panel-stub-dev-css";
  if (document.getElementById(cssId) === null) {
    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.href = "/components/panels/panel-stub-dev/styles/index.css";
    document.head.appendChild(link);
  }
  return Promise.resolve(true);
};
const unmount = () => {
  if (_container) _container.innerHTML = "";
  _container = null;
};
const destroy = () => unmount();
const dispose = () => {
  unmount();
};
const getVersion = () => VERSION;
const getStatus = () => ({ mounted: Boolean(_container), version: VERSION, moduleId: MODULE_ID });
const healthCheck = () => ({
  status: "HEALTHY",
  checks: { instanceExists: true },
  version: VERSION,
  moduleId: MODULE_ID,
  timestamp: Date.now()
});
const info = () => ({ moduleId: MODULE_ID, version: VERSION, type: "stub" });
var panel_stub_dev_default = { mount, unmount, destroy, dispose, healthCheck, info, getVersion, getStatus, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  panel_stub_dev_default as default,
  destroy,
  dispose,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  unmount
};
