import { PANEL_ID, MODULE_ID, VERSION, CSS_PREFIX } from "./core/constants.js";
import { CONFIG } from "./core/config.js";
import { store } from "./state/store.js";
import { loadData, loadRealPanels } from "./handlers/data.js";
import { setupEvents } from "./handlers/events.js";
import { renderGroupList } from "./ui/list/group-list.js";
import { renderForm } from "./ui/form/button-form.js";
import { renderSkeleton } from "./render/skeleton.js";
import { renderEmptyState, renderErrorState } from "./render/empty-state.js";
import { loadCSS, healthCheck as buildHealthCheck, info as buildInfo } from "./init/lifecycle.js";
import { trackMount, trackUnmount } from "./telemetry/tracker.js";
let _container = null;
let _ports = {};
let _mounted = false;
let _unsubscribe = null;
let _cleanupEvents = null;
const injectPorts = (p) => {
  _ports = { ..._ports, ...p || {} };
  return _ports;
};
const getPorts = () => _ports;
function _escape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function _renderBody(state) {
  if (state.mode === "create" || state.mode === "edit") {
    return renderForm({
      mode: state.mode,
      groups: state.groups,
      realPanels: state.realPanels,
      icons: state.icons,
      editing: state.editing
    });
  }
  if (state.loading) return renderSkeleton();
  if (state.error) return renderErrorState(state.error);
  const totalItems = state.groups.reduce((n, g) => n + g.items.length, 0);
  if (totalItems === 0) return renderEmptyState();
  return renderGroupList(state.groups);
}
function _renderToolbar(state) {
  if (state.mode === "create" || state.mode === "edit") return "";
  return `<button type="button" class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--primary" data-action="new">${_escape(CONFIG.labels.new)}</button>`;
}
function _renderShell() {
  return `
    <div class="${CSS_PREFIX}" data-panel="${PANEL_ID}">
      <header class="${CSS_PREFIX}-header">
        <div>
          <h2 class="${CSS_PREFIX}-header__title">${_escape(CONFIG.title)}</h2>
          <p class="${CSS_PREFIX}-header__subtitle">${_escape(CONFIG.subtitle)}</p>
        </div>
        <div class="${CSS_PREFIX}-header__actions" data-role="toolbar"></div>
      </header>
      <div class="${CSS_PREFIX}-body" data-role="body"></div>
    </div>`;
}
function _paint(state) {
  if (!_container) return;
  const body = _container.querySelector(`.${CSS_PREFIX}-body`);
  if (body) body.innerHTML = _renderBody(state);
  const toolbar = _container.querySelector(`.${CSS_PREFIX}-header__actions`);
  if (toolbar) toolbar.innerHTML = _renderToolbar(state);
}
const mount = (root, config = {}) => {
  loadCSS();
  injectPorts(config.ports || {});
  _container = root;
  root.innerHTML = _renderShell();
  _unsubscribe = store.subscribe(_paint);
  _cleanupEvents = setupEvents(root);
  store.setLoading(true);
  _paint(store.getState());
  _mounted = true;
  trackMount();
  void loadData();
  void loadRealPanels();
  return Promise.resolve(true);
};
const unmount = () => {
  trackUnmount();
  if (_cleanupEvents) {
    _cleanupEvents();
    _cleanupEvents = null;
  }
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
  if (_container) _container.innerHTML = "";
  _container = null;
  _mounted = false;
  store.reset();
};
const destroy = () => unmount();
const dispose = () => unmount();
const getVersion = () => VERSION;
const getStatus = () => ({
  mounted: _mounted,
  version: VERSION,
  moduleId: MODULE_ID
});
const healthCheck = buildHealthCheck;
const info = buildInfo;
var panel_criacao_botoes_default = {
  mount,
  unmount,
  destroy,
  dispose,
  injectPorts,
  getPorts,
  healthCheck,
  info,
  getVersion,
  getStatus,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  panel_criacao_botoes_default as default,
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
