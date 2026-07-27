const MODULE_ID = "panel-17.ui.state";
const VERSION = "9.3.0-P2-ENTERPRISE";
const uiState = {
  loading: false,
  error: null,
  selectedItem: null,
  expandedRows: /* @__PURE__ */ new Set(),
  filters: {}
};
function getUIState() {
  return { ...uiState, expandedRows: new Set(uiState.expandedRows) };
}
function setLoading(loading) {
  uiState.loading = loading;
}
function setError(error) {
  uiState.error = error;
}
function setSelectedItem(item) {
  uiState.selectedItem = item;
}
function toggleRowExpansion(rowId) {
  if (uiState.expandedRows.has(rowId)) {
    uiState.expandedRows.delete(rowId);
  } else {
    uiState.expandedRows.add(rowId);
  }
}
var state_default = { getUIState, setLoading, setError, setSelectedItem, toggleRowExpansion };
function createInitialState() {
  return {
    mounted: false,
    hasData: false,
    overview: null,
    recentActivity: [],
    topJobs: [],
    alertsSummary: null,
    activityPage: 1,
    activityPerPage: 10,
    topJobsSort: { field: "id", direction: "asc" }
  };
}
function parsePayload(data) {
  if (!data || typeof data !== "object") {
    return { overview: null, recentActivity: [], topJobs: [], alertsSummary: null };
  }
  return {
    overview: data.overview ?? null,
    recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
    topJobs: Array.isArray(data.topJobs) ? data.topJobs : [],
    alertsSummary: data.alertsSummary ?? null
  };
}
function hasValidData(overview, recentActivity, topJobs) {
  return !!(overview || recentActivity && recentActivity.length > 0 || topJobs && topJobs.length > 0);
}
function toggleSort(current, field) {
  if (current.field === field) {
    return { field, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { field, direction: "asc" };
}
export {
  MODULE_ID,
  VERSION,
  createInitialState,
  state_default as default,
  getUIState,
  hasValidData,
  parsePayload,
  setError,
  setLoading,
  setSelectedItem,
  toggleRowExpansion,
  toggleSort
};
