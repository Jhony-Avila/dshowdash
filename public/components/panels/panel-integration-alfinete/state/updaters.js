const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-integration-alfinete/state/updaters";
function setLoading(store, loading) {
  store.setState({ loading });
}
function setError(store, error) {
  store.setState({ error, loading: false });
}
function setData(store, data) {
  store.setState({ data, loading: false, error: null });
}
function clearError(store) {
  store.setState({ error: null });
}
function reset(store) {
  store.setState({ loading: false, error: null, data: null });
}
let _state = null;
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}
var updaters_default = { setLoading, setError, setData, clearError, reset, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearError,
  updaters_default as default,
  healthCheck,
  info,
  reset,
  setData,
  setError,
  setLoading
};
