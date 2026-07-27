function parseFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const filters = {};
  const category = params.get("category");
  if (category) filters.category = category;
  const status = params.get("status");
  if (status === "active" || status === "inactive" || status === "all") {
    filters.status = status;
  }
  const search = params.get("search");
  if (search) filters.search = search;
  return filters;
}
function syncFiltersToURL(filters) {
  const params = new URLSearchParams(window.location.search);
  if (filters.category) {
    params.set("category", filters.category);
  } else {
    params.delete("category");
  }
  if (filters.status !== "all") {
    params.set("status", filters.status);
  } else {
    params.delete("status");
  }
  if (filters.search) {
    params.set("search", filters.search);
  } else {
    params.delete("search");
  }
  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}
function hasActiveFilters(filters) {
  return !!(filters.category || filters.status !== "all" || filters.search);
}
export {
  hasActiveFilters,
  parseFiltersFromURL,
  syncFiltersToURL
};
