// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getUIState() — exported function
//   setLoading() — exported function
//   setError() — exported function
//   setSelectedItem() — exported function
//   toggleRowExpansion() — exported function
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

export const MODULE_ID = 'panel-17.ui.state';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 17 - UI State Manager
 * @module panel-17/ui/state
 * @version 1.1.0-AAA
 */

const uiState: {
    loading: boolean;
    error: string | null;
    selectedItem: Record<string, unknown> | null;
    expandedRows: Set<string>;
    filters: Record<string, unknown>;
} = {
    loading: false,
    error: null,
    selectedItem: null,
    expandedRows: new Set(),
    filters: {}
};

export function getUIState() {
    return { ...uiState, expandedRows: new Set(uiState.expandedRows) };
}

export function setLoading(loading: boolean) {
    uiState.loading = loading;
}

export function setError(error: string | null) {
    uiState.error = error;
}

export function setSelectedItem(item: Record<string, unknown> | null) {
    uiState.selectedItem = item;
}

export function toggleRowExpansion(rowId: string) {
    if (uiState.expandedRows.has(rowId)) {
        uiState.expandedRows.delete(rowId);
    } else {
        uiState.expandedRows.add(rowId);
    }
}

export default { getUIState, setLoading, setError, setSelectedItem, toggleRowExpansion };

// ─── Alias exports required by component.ts ───────────────────────────────────

export function createInitialState(): {
    mounted: boolean;
    hasData: boolean;
    overview: Record<string, unknown> | null;
    recentActivity: unknown[];
    topJobs: unknown[];
    alertsSummary: Record<string, unknown> | null;
    activityPage: number;
    activityPerPage: number;
    topJobsSort: { field: string; direction: 'asc' | 'desc' };
} {
    return {
        mounted: false,
        hasData: false,
        overview: null,
        recentActivity: [],
        topJobs: [],
        alertsSummary: null,
        activityPage: 1,
        activityPerPage: 10,
        topJobsSort: { field: 'id', direction: 'asc' }
    };
}

export function parsePayload(data: Record<string, unknown>): {
    overview: Record<string, unknown> | null;
    recentActivity: unknown[];
    topJobs: unknown[];
    alertsSummary: Record<string, unknown> | null;
} {
    if (!data || typeof data !== 'object') {
        return { overview: null, recentActivity: [], topJobs: [], alertsSummary: null };
    }
    return {
        overview: (data.overview as Record<string, unknown>) ?? null,
        recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
        topJobs: Array.isArray(data.topJobs) ? data.topJobs : [],
        alertsSummary: (data.alertsSummary as Record<string, unknown>) ?? null
    };
}

export function hasValidData(
    overview: Record<string, unknown> | null,
    recentActivity: unknown[],
    topJobs: unknown[]
): boolean {
    return !!(overview || (recentActivity && recentActivity.length > 0) || (topJobs && topJobs.length > 0));
}

export function toggleSort(
    current: { field: string; direction: 'asc' | 'desc' },
    field: string
): { field: string; direction: 'asc' | 'desc' } {
    if (current.field === field) {
        return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    }
    return { field, direction: 'asc' };
}
