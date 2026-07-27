const MODULE_ID = "footer-icon-globe-store";
const VERSION = "1.1.0-ENTERPRISE";
const _state = { props: null, isVisible: true, isHovered: false, lastRender: null };
let _metrics = { propsSet: 0, resets: 0 };
const Store = {
  getState() {
    return { ..._state };
  },
  setProps(p) {
    _state.props = p;
    _metrics.propsSet++;
  },
  getProps() {
    return _state.props;
  },
  setVisible(v) {
    _state.isVisible = !!v;
  },
  setHovered(v) {
    _state.isHovered = !!v;
  },
  markRender() {
    _state.lastRender = Date.now();
  },
  reset() {
    _state.props = null;
    _state.isVisible = true;
    _state.isHovered = false;
    _state.lastRender = null;
    _metrics.resets++;
  }
};
function getMetrics() {
  return { ..._metrics, hasProps: !!_state.props };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, state: Store.getState(), metrics: getMetrics() };
}
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { storeReady: true }, metrics: getMetrics() };
}
var store_default = { ...Store, getMetrics, info, healthCheck, MODULE_ID, VERSION };
export {
  MODULE_ID,
  Store,
  VERSION,
  store_default as default,
  getMetrics,
  healthCheck,
  info
};
