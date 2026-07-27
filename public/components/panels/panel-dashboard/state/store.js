const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-dashboard/state/store";
let _listeners = [];
let _store = {
  mounted: false,
  loading: false,
  error: null,
  props: {},
  scope: {},
  widgets: [],
  layout: "grid",
  lastUpdate: null,
  _initialized: false
};
function getState() {
  return Object.assign({}, _store);
}
function get(key) {
  return key ? _store[key] : getState();
}
function set(key, value) {
  if (typeof key === "object") {
    Object.assign(_store, key);
  } else {
    _store[key] = value;
  }
  _store.lastUpdate = Date.now();
  _notify();
}
function setProps(props) {
  _store.props = props || {};
  _notify();
}
function setScope(scope) {
  _store.scope = scope || {};
  _notify();
}
function setWidgets(widgets) {
  _store.widgets = widgets || [];
  _notify();
}
function addWidget(widget) {
  _store.widgets.push(widget);
  _notify();
}
function removeWidget(id) {
  _store.widgets = _store.widgets.filter((w) => w.id !== id);
  _notify();
}
function reset() {
  _store = { mounted: false, loading: false, error: null, props: {}, scope: {}, widgets: [], layout: "grid", lastUpdate: null, _initialized: false };
  _notify();
}
function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}
function _notify() {
  _listeners.forEach((fn) => {
    try {
      fn(getState());
    } catch (e) {
    }
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, widgetCount: _store.widgets.length };
}
var store_default = { getState, get, set, setProps, setScope, setWidgets, addWidget, removeWidget, reset, subscribe };
export {
  MODULE_ID,
  VERSION,
  addWidget,
  store_default as default,
  get,
  getState,
  healthCheck,
  info,
  removeWidget,
  reset,
  set,
  setProps,
  setScope,
  setWidgets,
  subscribe
};
