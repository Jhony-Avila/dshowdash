// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api-getters
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createTableGetters() — exported function
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

export const MODULE_ID = 'panel-01.ui.table.api-getters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 01 - Table API Getters
 * @module panel-01/ui/table/api-getters
 * @version 1.1.0-AAA
 */

export function createTableGetters(tableState: Record<string, unknown>) {
    return {
        getData() {
            return [...(tableState.data as unknown[])];
        },
        getSelectedRows() {
            return [...(tableState.selectedRows as unknown[])];
        },
        getColumns() {
            return [...(tableState.columns as unknown[])];
        },
        getSortConfig() {
            return { ...(tableState.sortConfig as Record<string, unknown>) };
        },
        getFilters() {
            return { ...(tableState.filters as Record<string, unknown>) };
        },
        getPagination() {
            return { ...(tableState.pagination as Record<string, unknown>) };
        },
        getRowCount() {
            return (tableState.data as unknown[]).length;
        },
        isLoading() {
            return tableState.loading;
        }
    };
}

export default { createTableGetters };
