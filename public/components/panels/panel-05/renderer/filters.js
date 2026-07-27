const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:renderer:filters";
function updateFilters(refs, filters) {
  if (!refs || !filters) return;
  const searchInput = refs.searchInput;
  if (searchInput && searchInput.value !== (filters.search || "")) {
    if (document.activeElement !== searchInput) {
      searchInput.value = String(filters.search || "");
    }
  }
  const filterStatus = refs.filterStatus;
  if (filterStatus && filterStatus.value !== (filters.status || "")) {
    filterStatus.value = String(filters.status || "");
  }
  const filterUf = refs.filterUf;
  if (filterUf && filterUf.value !== (filters.uf || "")) {
    filterUf.value = String(filters.uf || "");
  }
  const filterPorte = refs.filterPorte;
  if (filterPorte && filterPorte.value !== (filters.porte || "")) {
    filterPorte.value = String(filters.porte || "");
  }
}
function getFilterValues(refs) {
  if (!refs) return {};
  return {
    search: refs.searchInput?.value || "",
    status: refs.filterStatus?.value || "",
    uf: refs.filterUf?.value || "",
    porte: refs.filterPorte?.value || ""
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } };
}
var filters_default = { updateFilters, getFilterValues, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  filters_default as default,
  getFilterValues,
  healthCheck,
  info,
  updateFilters
};
