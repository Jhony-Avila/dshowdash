const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-15:ui:state";
const createInitialState = () => ({
  mounted: false,
  hasData: false,
  overview: null,
  recentActivity: [],
  topJobs: [],
  alertsSummary: null,
  activityPage: 1,
  activityPerPage: 10,
  topJobsSort: { field: "total_executions", dir: "desc" }
});
const parsePayload = (data) => {
  const payload = data?.data || data?.payload || data;
  return {
    overview: payload?.overview || null,
    recentActivity: payload?.recent_activity || [],
    topJobs: payload?.top_jobs || [],
    alertsSummary: payload?.alerts_summary || null
  };
};
const hasValidData = (overview, recentActivity, topJobs) => overview || recentActivity.length > 0 || topJobs.length > 0;
const toggleSort = (currentSort, field) => {
  if (currentSort.field === field) {
    return { field, dir: currentSort.dir === "desc" ? "asc" : "desc" };
  }
  return { field, dir: "desc" };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
var state_default = { createInitialState, parsePayload, hasValidData, toggleSort };
export {
  MODULE_ID,
  VERSION,
  createInitialState,
  state_default as default,
  hasValidData,
  info,
  parsePayload,
  toggleSort
};
