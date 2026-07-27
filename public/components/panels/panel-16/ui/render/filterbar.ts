// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: filterbar
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderFilterBar() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-16.ui.render.filterbar';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Filter Bar Renderer
 * @module panel-16/ui/render/filterbar
 * @version 1.1.0-AAA
 */

export function renderFilterBar(container: HTMLElement, { filters = [] as Array<Record<string, unknown>>, onFilterChange }: { filters?: Array<Record<string, unknown>>; onFilterChange: (key: string, value: string) => void }) {
    const html = `
        <div class="filter-bar">
            <div class="filter-bar-content">
                ${filters.map(f => `
                    <div class="filter-item" data-key="${f.key}">
                        <label>${f.label}</label>
                        <select class="filter-select">
                            <option value="">Todos</option>
                            ${(f.options as Array<Record<string, unknown>>).map((o: Record<string, unknown>) => `<option value="${o.value}">${o.label}</option>`).join('')}
                        </select>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    container.querySelectorAll('.filter-select').forEach((select: Element) => {
        select.addEventListener('change', () => {
            const key = (select as HTMLSelectElement).closest('.filter-item')?.getAttribute('data-key') ?? '';
            if (typeof onFilterChange === 'function') {
                onFilterChange(key, (select as HTMLSelectElement).value);
            }
        });
    });
}

export function renderFilterChips(filters: Record<string, unknown>, sortColumns?: Array<{key: string}>, clientSearchTerm?: string): string {
    const chips: string[] = [];
    if (clientSearchTerm) chips.push(`<span class="p16-chip">Busca: ${clientSearchTerm}</span>`);
    if (filters.status) chips.push(`<span class="p16-chip">Status: ${filters.status}</span>`);
    if (filters.tipo) chips.push(`<span class="p16-chip">Tipo: ${filters.tipo}</span>`);
    if (filters.uf) chips.push(`<span class="p16-chip">UF: ${filters.uf}</span>`);
    if (sortColumns && sortColumns.length > 0) {
        sortColumns.forEach((sc: {key: string}) => chips.push(`<span class="p16-chip">Ord: ${sc.key}</span>`));
    }
    return chips.length > 0 ? `<div class="p16-filter-chips">${chips.join('')}</div>` : '';
}

export function renderFilters(state: Record<string, unknown>): string {
    return `<div class="p16-filters-content">Filtros (${state.displayDataLength || 0} resultados)</div>`;
}

export default { renderFilterBar, renderFilterChips, renderFilters };
