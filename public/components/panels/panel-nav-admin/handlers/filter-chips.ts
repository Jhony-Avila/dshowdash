// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-filter-chips
// PURPOSE: Filter Chips Handler - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createFilterChipsHandlers() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

const MODULE_ID = 'panel-nav-admin-handlers-filter-chips';
const VERSION = '9.3.0-P2-ENTERPRISE';

interface FilterChipsDeps {
    refs: Record<string, HTMLElement>;
    store: { setFilter: (key: string, value: string) => void };
    container: HTMLElement;
    applyFilters: () => void;
}

export function createFilterChipsHandlers(deps: FilterChipsDeps) {
    const { refs, store, container, applyFilters } = deps;

    function addFilterChip(filter: string, value: string, label: string) {
        if (!refs?.filterChips) return;
        const existing = refs.filterChips.querySelector(`[data-filter="${filter}"]`);
        if (existing) existing.remove();
        if (!value) return;
        const chip = document.createElement('div');
        chip.className = 'pna-filter-chip';
        chip.dataset.filter = filter;
        chip.innerHTML = `<span class="pna-filter-chip-label">${label || filter}: ${value}</span><button type="button" class="pna-filter-chip-remove" data-action="remove-filter-chip" data-filter="${filter}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
        refs.filterChips.appendChild(chip);
    }

    function removeFilterChip(filter: string) {
        if (!filter) return;
        const chip = refs?.filterChips?.querySelector(`[data-filter="${filter}"]`);
        if (chip) chip.remove();
        store.setFilter(filter, '');
        const input = container?.querySelector(`[data-filter="${filter}"]`) as HTMLInputElement | HTMLSelectElement | null;
        if (input) {
            if (input.tagName === 'SELECT') {
                (input as HTMLSelectElement).value = ((input as HTMLSelectElement).options[0]?.value) || '';
            } else {
                input.value = '';
            }
        }
        applyFilters();
    }

    function clearAllChips() { if (refs?.filterChips) refs.filterChips.innerHTML = ''; }
    function updateFilterCounter(showing: number, total: number) {
        if (refs?.filterShowing) refs.filterShowing.textContent = String(showing);
        if (refs?.filterTotal) refs.filterTotal.textContent = String(total);
    }
    function toggleAdvancedFilters() {
        if (refs?.advancedFilters) refs.advancedFilters.classList.toggle('expanded');
        const toggle = container?.querySelector('.pna-advanced-filters-toggle');
        if (toggle) toggle.classList.toggle('active');
    }
    function clearSearch() {
        if (refs?.filterSearch) {
            (refs.filterSearch as HTMLInputElement).value = '';
            store.setFilter('search', '');
            removeFilterChip('search');
            applyFilters();
        }
    }

    return { addFilterChip, removeFilterChip, clearAllChips, updateFilterCounter, toggleAdvancedFilters, clearSearch };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }

export { MODULE_ID, VERSION };
