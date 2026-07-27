import { _getState, notify, getUserPermissions as coreSetFilter } from "./core.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-filters";
function getUserFilter() {
  const state = _getState();
  const uf = state.userFilter;
  return { status: uf.status, sort: uf.sort };
}
function setUserFilter(filter) {
  const state = _getState();
  for (const k in filter) {
    if (Object.prototype.hasOwnProperty.call(filter, k)) state.userFilter[k] = filter[k];
  }
  notify("userFilter");
}
function getFilteredUsers() {
  const state = _getState();
  let filtered = state.users.slice();
  const status = state.userFilter.status;
  const sort = state.userFilter.sort;
  if (status === "active") {
    filtered = filtered.filter((u) => u.ativo !== false);
  } else if (status === "inactive") {
    filtered = filtered.filter((u) => u.ativo === false);
  } else if (status === "with-perms") {
    filtered = filtered.filter((u) => {
      const perms = getUserPermissions(u.id);
      return perms.triggers.length > 0 || perms.regions.length > 0;
    });
  } else if (status === "without-perms") {
    filtered = filtered.filter((u) => {
      const perms = getUserPermissions(u.id);
      return perms.triggers.length === 0 && perms.regions.length === 0;
    });
  }
  filtered.sort((a, b) => {
    const nameA = String(a.nome || a.name || "").toLowerCase();
    const nameB = String(b.nome || b.name || "").toLowerCase();
    const levelA = Number(a.nivel || a.level || 0);
    const levelB = Number(b.nivel || b.level || 0);
    if (sort === "name") return nameA.localeCompare(nameB);
    if (sort === "name-desc") return nameB.localeCompare(nameA);
    if (sort === "level-desc") return levelB - levelA;
    if (sort === "level") return levelA - levelB;
    return 0;
  });
  return filtered;
}
function getFilteredTriggers() {
  const state = _getState();
  const search = state.filter.search;
  const type = state.filter.type;
  let filtered = state.triggers.slice();
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((t) => t.id && String(t.id).toLowerCase().indexOf(s) !== -1 || t.label && String(t.label).toLowerCase().indexOf(s) !== -1 || t.area && String(t.area).toLowerCase().indexOf(s) !== -1);
  }
  if (type && type !== "all") {
    filtered = filtered.filter((t) => t.area === type);
  }
  return filtered;
}
function getFilteredRegions() {
  const state = _getState();
  const search = state.filter.search;
  let filtered = state.regions.slice();
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((r) => r.id && String(r.id).toLowerCase().indexOf(s) !== -1 || r.label && String(r.label).toLowerCase().indexOf(s) !== -1);
  }
  return filtered;
}
function getTriggerAreas() {
  const areas = {};
  const state = _getState();
  state.triggers.forEach((t) => {
    if (t.area) areas[t.area] = true;
  });
  return Object.keys(areas).sort();
}
function applySavedFilter(id, savedFilters) {
  let found = null;
  for (let i = 0; i < savedFilters.length; i++) {
    if (savedFilters[i].id === id) {
      found = savedFilters[i];
      break;
    }
  }
  if (found) {
    coreSetFilter(found.filter);
    return true;
  }
  return false;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: typeof getFilteredUsers === "function" } };
}
export {
  MODULE_ID,
  VERSION,
  applySavedFilter,
  getFilteredRegions,
  getFilteredTriggers,
  getFilteredUsers,
  getTriggerAreas,
  getUserFilter,
  healthCheck,
  info,
  setUserFilter
};
