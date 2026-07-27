// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/filters
// PURPOSE: Panel-02 UI Filters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   loadSavedFilters() — exported function
//   applyFiltersToDOM() — exported function
//   clearFiltersState() — exported function
//   clearFiltersDOM() — exported function
//   applyFilters() — exported function
//   persistFilters() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

export function loadSavedFilters(urlState: { read: () => Record<string, string> | null }, filterStorage: { load: () => Record<string, string> | null }, filters: Record<string, string>) {
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

export function applyFiltersToDOM(rootContainer: HTMLElement | null, filters: Record<string, string>) {
  if (!rootContainer) return;
  Object.keys(filters).forEach(key => {
    const el = rootContainer.querySelector(`[data-filter="${key}"]`) as HTMLInputElement | HTMLSelectElement | null;
    if (el && filters[key]) {
      el.value = filters[key];
    }
  });
}

export function clearFiltersState() {
  return { type: '', status: '', rate: '', search: '' };
}

export function clearFiltersDOM(rootContainer: HTMLElement | null) {
  if (!rootContainer) return;
  const selects = rootContainer.querySelectorAll('[data-filter]');
  selects.forEach((el: Element) => {
    if (el.tagName === 'SELECT') (el as HTMLSelectElement).value = '';
    if (el.tagName === 'INPUT') (el as HTMLInputElement).value = '';
  });
}

export function applyFilters(allJobs: Record<string, unknown>[], filters: Record<string, string>, inlineFilters: Record<string, string>) {
  return allJobs.filter((job: Record<string, unknown>) => {
    const jobType = (String(job.job_type || job.type || '')).toLowerCase();
    const healthStatus = String(job.health_status || 'inactive');
    const successRate = parseFloat(String(job.success_rate || job.avg_success_rate || 0));
    const jobName = (String(job.job_name || job.name || '')).toLowerCase();

    if (filters.type && jobType !== filters.type) return false;
    if (filters.status) {
      if (filters.status === 'active' && healthStatus === 'inactive') return false;
      if (filters.status === 'inactive' && healthStatus !== 'inactive') return false;
      if (filters.status === 'error' && healthStatus !== 'critical') return false;
    }
    if (filters.rate) {
      if (filters.rate === 'high' && successRate < 95) return false;
      if (filters.rate === 'medium' && (successRate < 80 || successRate >= 95)) return false;
      if (filters.rate === 'low' && successRate >= 80) return false;
    }
    if (filters.search && !jobName.includes(filters.search.toLowerCase())) return false;

    if (inlineFilters.job_name && !jobName.includes(inlineFilters.job_name.toLowerCase())) return false;
    if (inlineFilters.job_type && jobType !== inlineFilters.job_type) return false;
    if (inlineFilters.health_status && healthStatus !== inlineFilters.health_status) return false;

    return true;
  });
}

export function persistFilters(filterStorage: { save: (filters: Record<string, string>) => void }, urlState: { write: (filters: Record<string, string>) => void }, filters: Record<string, string>) {
  filterStorage.save(filters);
  urlState.write(filters);
}

export default { loadSavedFilters, applyFiltersToDOM, clearFiltersState, clearFiltersDOM, applyFilters, persistFilters };

export const MODULE_ID = 'panel-02/ui/filters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } }; }
