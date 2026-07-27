const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-uarps-monitor:core/state";
const state = {
  mounted: false,
  loading: false,
  error: null,
  status: null,
  inventory: null,
  divergences: [],
  stats: null,
  lastRefresh: null,
  autoRefreshInterval: null
};
function resetState() {
  state.mounted = false;
  state.loading = false;
  state.error = null;
  state.status = null;
  state.inventory = null;
  state.divergences = [];
  state.stats = null;
  state.lastRefresh = null;
  state.autoRefreshInterval = null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  info,
  resetState,
  state
};
