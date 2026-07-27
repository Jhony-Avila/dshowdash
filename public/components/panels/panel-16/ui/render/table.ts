// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: table
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderTable() — exported function
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

export const MODULE_ID = 'panel-16.ui.render.table';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Table Renderer
 * @module panel-16/ui/render/table
 * @version 1.1.0-AAA
 */

export function renderTable(container: HTMLElement, { columns, data, onRowClick, onSort }: { columns: Array<Record<string, unknown>>; data: Array<Record<string, unknown>>; onRowClick?: (row: Record<string, unknown>, idx: string) => void; onSort?: (key: string) => void }) {
    if (!container) return;

    const thead = columns.map((col: Record<string, unknown>) =>
        `<th data-key="${col.key}" class="${col.sortable ? 'sortable' : ''}">${col.label}</th>`
    ).join('');

    const tbody = data.map((row: Record<string, unknown>, i: number) => `
        <tr data-index="${i}">
            ${columns.map((col: Record<string, unknown>) => `<td>${row[col.key as string] ?? '-'}</td>`).join('')}
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="data-table">
            <thead><tr>${thead}</tr></thead>
            <tbody>${tbody}</tbody>
        </table>
    `;

    if (onSort) {
        container.querySelectorAll('th.sortable').forEach((th: Element) => {
            th.addEventListener('click', () => onSort((th as HTMLElement).dataset.key ?? ''));
        });
    }

    if (onRowClick) {
        container.querySelectorAll('tbody tr').forEach((tr: Element) => {
            tr.addEventListener('click', () => onRowClick(data[parseInt((tr as HTMLElement).dataset.index ?? '0')], (tr as HTMLElement).dataset.index ?? ''));
        });
    }
}

export function renderEmpty(hasFilters: boolean): string {
    return `
        <div class="p16-empty-state">
            <i class="fas ${hasFilters ? 'fa-filter' : 'fa-inbox'}"></i>
            <p>${hasFilters ? 'Nenhum resultado encontrado para os filtros aplicados.' : 'Nenhum fornecedor encontrado.'}</p>
        </div>
    `;
}

export default { renderTable, renderEmpty };
