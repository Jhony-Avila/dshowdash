// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: config
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   TABLE_CONFIG — exported value
//   getTableConfig() — exported function
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

export const MODULE_ID = 'panel-01.ui.table.config';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 01 - Table Configuration
 * @module panel-01/ui/table/config
 * @version 1.1.0-AAA
 */

export const TABLE_CONFIG = {
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    enableVirtualScroll: true,
    virtualScrollThreshold: 100,
    enableSelection: true,
    selectionMode: 'multiple',
    enableSorting: true,
    enableFiltering: true,
    enableResize: true,
    enableReorder: false,
    rowHeight: 40,
    headerHeight: 48,
    stickyHeader: true
};

export function getTableConfig(overrides: Record<string, unknown> = {}) {
    return { ...TABLE_CONFIG, ...overrides };
}

export default TABLE_CONFIG;
