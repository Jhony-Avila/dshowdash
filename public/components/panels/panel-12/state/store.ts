// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-12-state-store
// PURPOSE: Panel 12 - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createStatePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   setJobs() — exported function
//   getJobs() — exported function
//   updateJob() — exported function
//   removeJob() — exported function
//   normalizeId() — exported function
//   setSearchTerm() — exported function
//   getSearchTerm() — exported function
//   resetSearch() — exported function
//   setFilters() — exported function
//   getFilters() — exported function
//   resetFilters() — exported function
//   setSort() — exported function
//   getSort() — exported function
//   getFilteredAndSorted() — exported function
//   info() — exported function
//   ... and 5 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createStatePorts } from '/core/runtime/ports-profiles.js';
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panels-panel-12-state-store';
const Ports = createStatePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let jobs: Record<string, unknown>[] = [];
let searchTerm = '';
let filters = { status: '', type: '' };
let sort = { column: 'id', direction: 'asc' };
const normalizeId = (id: unknown) => id ? String(id).trim() : '';
const setJobs = (newJobs: Record<string, unknown>[]) => { jobs = Array.isArray(newJobs) ? newJobs : []; };
const getJobs = () => [...jobs];
const updateJob = (jobId: unknown, updates: Record<string, unknown>) => { const normId = normalizeId(jobId); const idx = jobs.findIndex((j: Record<string, unknown>) => normalizeId(j.id) === normId); if (idx !== -1) jobs[idx] = { ...jobs[idx], ...updates }; };
const removeJob = (jobId: unknown) => { const normId = normalizeId(jobId); jobs = jobs.filter((j: Record<string, unknown>) => normalizeId(j.id) !== normId); };
const setSearchTerm = (term: string) => { searchTerm = term || ''; };
const getSearchTerm = () => searchTerm;
const resetSearch = () => { searchTerm = ''; };
const setFilters = (newFilters: Partial<{ status: string; type: string }>) => { filters = { ...filters, ...newFilters }; };
const getFilters = () => ({ ...filters });
const resetFilters = () => { filters = { status: '', type: '' }; };
const setSort = (column: string, direction: string) => { sort = { column, direction }; };
const getSort = () => ({ ...sort });
const normalizeText = (text: unknown) => text ? String(text).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') : '';
const getFilteredAndSorted = () => {
  let result = [...jobs];
  if (searchTerm) { const term = normalizeText(searchTerm); result = result.filter(job => normalizeText(job.job_name || job.nome || '').includes(term) || normalizeText(job.id || '').includes(term) || normalizeText(job.description || job.descricao || '').includes(term)); }
  if (filters.status !== '') { const isActive = filters.status === '1' || filters.status === 'active'; result = result.filter(job => (parseInt(job.is_active as string) === 1) === isActive); }
  if (filters.type !== '') result = result.filter(job => ((job.type as string) || (job.tipo as string) || '').toLowerCase() === filters.type.toLowerCase());
  const { column, direction } = sort;
  result.sort((a, b) => { let valA: number | string = (a[column] as number | string) ?? ''; let valB: number | string = (b[column] as number | string) ?? ''; if (column === 'id') { valA = parseInt(String(valA)) || 0; valB = parseInt(String(valB)) || 0; } else if (column === 'success_rate') { valA = parseFloat(String(valA)) || 0; valB = parseFloat(String(valB)) || 0; } else { valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase(); } if (valA < valB) return direction === 'asc' ? -1 : 1; if (valA > valB) return direction === 'asc' ? 1 : -1; return 0; });
  return result;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true, jobCount: jobs.length, portsInitialized: Ports.snapshot()._initialized } });
export { setJobs, getJobs, updateJob, removeJob, normalizeId, setSearchTerm, getSearchTerm, resetSearch, setFilters, getFilters, resetFilters, setSort, getSort, getFilteredAndSorted, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
