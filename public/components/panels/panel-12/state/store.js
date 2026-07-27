import { createStatePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-12-state-store";
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let jobs = [];
let searchTerm = "";
let filters = { status: "", type: "" };
let sort = { column: "id", direction: "asc" };
const normalizeId = (id) => id ? String(id).trim() : "";
const setJobs = (newJobs) => {
  jobs = Array.isArray(newJobs) ? newJobs : [];
};
const getJobs = () => [...jobs];
const updateJob = (jobId, updates) => {
  const normId = normalizeId(jobId);
  const idx = jobs.findIndex((j) => normalizeId(j.id) === normId);
  if (idx !== -1) jobs[idx] = { ...jobs[idx], ...updates };
};
const removeJob = (jobId) => {
  const normId = normalizeId(jobId);
  jobs = jobs.filter((j) => normalizeId(j.id) !== normId);
};
const setSearchTerm = (term) => {
  searchTerm = term || "";
};
const getSearchTerm = () => searchTerm;
const resetSearch = () => {
  searchTerm = "";
};
const setFilters = (newFilters) => {
  filters = { ...filters, ...newFilters };
};
const getFilters = () => ({ ...filters });
const resetFilters = () => {
  filters = { status: "", type: "" };
};
const setSort = (column, direction) => {
  sort = { column, direction };
};
const getSort = () => ({ ...sort });
const normalizeText = (text) => text ? String(text).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") : "";
const getFilteredAndSorted = () => {
  let result = [...jobs];
  if (searchTerm) {
    const term = normalizeText(searchTerm);
    result = result.filter((job) => normalizeText(job.job_name || job.nome || "").includes(term) || normalizeText(job.id || "").includes(term) || normalizeText(job.description || job.descricao || "").includes(term));
  }
  if (filters.status !== "") {
    const isActive = filters.status === "1" || filters.status === "active";
    result = result.filter((job) => parseInt(job.is_active) === 1 === isActive);
  }
  if (filters.type !== "") result = result.filter((job) => (job.type || job.tipo || "").toLowerCase() === filters.type.toLowerCase());
  const { column, direction } = sort;
  result.sort((a, b) => {
    let valA = a[column] ?? "";
    let valB = b[column] ?? "";
    if (column === "id") {
      valA = parseInt(String(valA)) || 0;
      valB = parseInt(String(valB)) || 0;
    } else if (column === "success_rate") {
      valA = parseFloat(String(valA)) || 0;
      valB = parseFloat(String(valB)) || 0;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return result;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true, jobCount: jobs.length, portsInitialized: Ports.snapshot()._initialized } });
export {
  MODULE_ID,
  VERSION,
  getFilteredAndSorted,
  getFilters,
  getJobs,
  getPorts,
  getSearchTerm,
  getSort,
  healthCheck,
  info,
  injectPorts,
  normalizeId,
  removeJob,
  resetFilters,
  resetSearch,
  setFilters,
  setJobs,
  setSearchTerm,
  setSort,
  updateJob
};
