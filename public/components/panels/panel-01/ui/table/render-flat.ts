// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: render-flat
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderFlatTable() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-01.ui.table.render-flat';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 01 - Flat Table Renderer
 * @module panel-01/ui/table/render-flat
 * @version 1.1.0-AAA
 */

export function renderFlatTable(container: HTMLElement, { columns, data, onRowClick }: { columns: Record<string, unknown>[]; data: Record<string, unknown>[]; onRowClick?: (row: Record<string, unknown>, index: number) => void }) {
    if (!container) return;

    const table = document.createElement('table');
    table.className = 'table table-flat';

    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>${(columns as Record<string, unknown>[]).map((col: Record<string, unknown>) =>
        `<th data-key="${col.key}" ${col.sortable ? 'class="sortable"' : ''}>${col.label}</th>`
    ).join('')}</tr>`;

    const tbody = document.createElement('tbody');
    data.forEach((row: Record<string, unknown>, index: number) => {
        const tr = document.createElement('tr');
        tr.dataset.index = String(index);
        tr.innerHTML = (columns as Record<string, unknown>[]).map((col: Record<string, unknown>) => `<td>${row[col.key as string] ?? '-'}</td>`).join('');
        if (typeof onRowClick === 'function') {
            tr.addEventListener('click', () => onRowClick(row, index));
        }
        tbody.appendChild(tr);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}

export default { renderFlatTable };
