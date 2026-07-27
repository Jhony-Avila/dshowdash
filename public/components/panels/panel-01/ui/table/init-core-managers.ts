// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/init-core-managers
// PURPOSE: Panel-01 Table - Core Managers Initialization
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MultiSortManager from ./multi-sort.js
//   SortingManager from ./sorting.js
//   InlineEditor from ./inline-edit.js
//   GroupingManager from ./grouping.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initCoreManagers() — exported function
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

import { MultiSortManager } from './multi-sort.js';
import { SortingManager } from './sorting.js';
import { InlineEditor } from './inline-edit.js';
import { GroupingManager } from './grouping.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/init-core-managers';

export function initCoreManagers(ctx: Record<string, unknown>, features: Record<string, unknown>, config: Record<string, unknown>, callbacks: Record<string, (...args: unknown[]) => void>) {
    const managers: Record<string, unknown> = { multiSort: null, sorting: null, inlineEditor: null, grouping: null };

    // Multi-sort manager
    if (features.multiSort) {
        managers.multiSort = new MultiSortManager({
            maxSorts: config.maxSorts,
            onSort: (sorts: Record<string, unknown>[]) => {
                if (sorts.length > 0) callbacks.onSort((sorts[0] as Record<string, unknown>).field as string, { shiftKey: sorts.length > 1, sorts });
            }
        });
    }

    // Single sort manager (fallback)
    managers.sorting = new SortingManager({
        defaultField: (config.defaultSort as Record<string, unknown>).field,
        defaultOrder: (config.defaultSort as Record<string, unknown>).order,
        onSort: (sort: Record<string, unknown>) => {
            if (!features.multiSort) callbacks.onSort(sort.field as string, { sorts: [sort] });
        }
    });

    // Inline editor
    if (features.inlineEdit) {
        managers.inlineEditor = new InlineEditor({
            editableFields: config.editableFields,
            onSave: (data: unknown) => callbacks.onInlineEdit(data),
            onCancel: () => {}
        });
    }

    // Grouping manager
    if (features.grouping) {
        managers.grouping = new GroupingManager({
            onGroupChange: (field: string) => callbacks.onGroupChange(field)
        });
    }

    return managers;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
