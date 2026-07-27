// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:renderer:filters
// PURPOSE: Panel-05 Filters Renderer - AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   updateFilters() — exported function
//   getFilterValues() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:renderer:filters';

// ═══════════════════════════════════════════════════════════════
// UPDATE FILTERS (values only)
// ═══════════════════════════════════════════════════════════════
export function updateFilters(refs: Record<string, unknown> | null, filters: Record<string, unknown>) {
    if (!refs || !filters) return;

    // Search input
    const searchInput = refs.searchInput as HTMLInputElement | null;
    if (searchInput && searchInput.value !== (filters.search || '')) {
        if (document.activeElement !== searchInput) {
            searchInput.value = String(filters.search || '');
        }
    }

    // Status select
    const filterStatus = refs.filterStatus as HTMLSelectElement | null;
    if (filterStatus && filterStatus.value !== (filters.status || '')) {
        filterStatus.value = String(filters.status || '');
    }

    // UF select
    const filterUf = refs.filterUf as HTMLSelectElement | null;
    if (filterUf && filterUf.value !== (filters.uf || '')) {
        filterUf.value = String(filters.uf || '');
    }

    // Porte select
    const filterPorte = refs.filterPorte as HTMLSelectElement | null;
    if (filterPorte && filterPorte.value !== (filters.porte || '')) {
        filterPorte.value = String(filters.porte || '');
    }
}

// ═══════════════════════════════════════════════════════════════
// GET CURRENT FILTER VALUES
// ═══════════════════════════════════════════════════════════════
export function getFilterValues(refs: Record<string, unknown> | null) {
    if (!refs) return {};

    return {
        search: (refs.searchInput as HTMLInputElement | null)?.value || '',
        status: (refs.filterStatus as HTMLSelectElement | null)?.value || '',
        uf: (refs.filterUf as HTMLSelectElement | null)?.value || '',
        porte: (refs.filterPorte as HTMLSelectElement | null)?.value || ''
    };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } }; }

export default { updateFilters, getFilterValues, info, healthCheck };
