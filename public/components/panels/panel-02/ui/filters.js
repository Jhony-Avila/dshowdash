function loadSavedFilters(urlState, filterStorage, filters) {
  const urlFilters = urlState.read();
  if (urlFilters && Object.keys(urlFilters).length > 0) {
    return { ...filters, ...urlFilters };
  }
  const savedFilters = filterStorage.load();
  if (savedFilters) {
    return { ...filters, ...savedFilters };
  }
  return filters;
}
function applyFiltersToDOM(rootContainer, filters) {
  if (!rootContainer) return;
  Object.keys(filters).forEach((key) => {
    const el = rootContainer.querySelector(`[data-filter="${key}"]`);
    if (el && filters[key]) {
      el.value = filters[key];
    }
  });
}
function clearFiltersState() {
  return { type: "", status: "", rate: "", search: "" };
}
function clearFiltersDOM(rootContainer) {
  if (!rootContainer) return;
  const selects = rootContainer.querySelectorAll("[data-filter]");
  selects.forEach((el) => {
    if (el.tagName === "SELECT") el.value = "";
    if (el.tagName === "INPUT") el.value = "";
  });
}
function applyFilters(allJobs, filters, inlineFilters) {
  return allJobs.filter((job) => {
    const jobType = String(job.job_type || job.type || "").toLowerCase();
    const healthStatus = String(job.health_status || "inactive");
    const successRate = parseFloat(String(job.success_rate || job.avg_success_rate || 0));
    const jobName = String(job.job_name || job.name || "").toLowerCase();
    if (filters.type && jobType !== filters.type) return false;
    if (filters.status) {
      if (filters.status === "active" && healthStatus === "inactive") return false;
      if (filters.status === "inactive" && healthStatus !== "inactive") return false;
      if (filters.status === "error" && healthStatus !== "critical") return false;
    }
    if (filters.rate) {
      if (filters.rate === "high" && successRate < 95) return false;
      if (filters.rate === "medium" && (successRate < 80 || successRate >= 95)) return false;
      if (filters.rate === "low" && successRate >= 80) return false;
    }
    if (filters.search && !jobName.includes(filters.search.toLowerCase())) return false;
    if (inlineFilters.job_name && !jobName.includes(inlineFilters.job_name.toLowerCase())) return false;
    if (inlineFilters.job_type && jobType !== inlineFilters.job_type) return false;
    if (inlineFilters.health_status && healthStatus !== inlineFilters.health_status) return false;
    return true;
  });
}
function persistFilters(filterStorage, urlState, filters) {
  filterStorage.save(filters);
  urlState.write(filters);
}
var filters_default = { loadSavedFilters, applyFiltersToDOM, clearFiltersState, clearFiltersDOM, applyFilters, persistFilters };
const MODULE_ID = "panel-02/ui/filters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  applyFilters,
  applyFiltersToDOM,
  clearFiltersDOM,
  clearFiltersState,
  filters_default as default,
  healthCheck,
  info,
  loadSavedFilters,
  persistFilters
};
