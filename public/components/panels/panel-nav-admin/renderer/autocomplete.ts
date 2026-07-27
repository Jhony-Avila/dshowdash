// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-renderer-autocomplete
// PURPOSE: Autocomplete Renderer - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   highlightText from ./effects.js
//   selectRow from ./items.js
//
// PROVIDES:
//   createAutocompleteRenderer() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { highlightText } from './effects.js';
import { selectRow } from './items.js';

export const MODULE_ID = 'panel-nav-admin-renderer-autocomplete';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function createAutocompleteRenderer(deps: Record<string, unknown>) {
  const refs = deps.refs as Record<string, HTMLElement & { value?: string; innerHTML?: string; dataset?: DOMStringMap }>;
  const store = deps.store as { get: (key: string) => unknown; setFilter: (key: string, val: unknown) => void };
  const container = deps.container as HTMLElement | null;

  function updateAutocomplete(term: string) {
    if (!refs || !refs.searchAutocomplete || !refs.searchWrapper) return;
    if (!term || term.length < 2) { hideAutocomplete(); return; }
    const items = (store.get('items') as Record<string, unknown>[]) || [];
    const matches = findMatches(items, term, 5);
    if (matches.length === 0) { showEmptyAutocomplete(); return; }
    renderMatches(matches, term);
    showAutocomplete();
    attachClickHandlers();
  }

  function findMatches(items: Record<string, unknown>[], term: string, limit: number) {
    limit = limit || 5;
    const lowerTerm = term.toLowerCase();
    return items.filter((item: Record<string, unknown>) => (item.label && (item.label as string).toLowerCase().indexOf(lowerTerm) !== -1) ||
           (item.id && (item.id as string).toLowerCase().indexOf(lowerTerm) !== -1) ||
           (item.href && (item.href as string).toLowerCase().indexOf(lowerTerm) !== -1)).slice(0, limit);
  }

  function renderMatches(matches: Record<string, unknown>[], term: string) {
    refs.searchAutocomplete.innerHTML = matches.map((item: Record<string, unknown>) => `<div class="pna-autocomplete-item" data-item-id="${item.id}"><span class="pna-autocomplete-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/></svg></span><div class="pna-autocomplete-content"><span class="pna-autocomplete-label">${highlightText(item.label as string || '', term)}</span><span class="pna-autocomplete-meta">${item.section || 'root'} • ${item.href || ''}</span></div></div>`).join('');
  }

  function showEmptyAutocomplete() { refs.searchAutocomplete.innerHTML = '<div class="pna-autocomplete-empty">Nenhum resultado</div>'; refs.searchWrapper.classList.add('has-results'); }
  function showAutocomplete() { refs.searchWrapper.classList.add('has-results'); }
  function hideAutocomplete() { refs.searchWrapper.classList.remove('has-results'); refs.searchAutocomplete.innerHTML = ''; }

  function attachClickHandlers() {
    refs.searchAutocomplete.querySelectorAll('.pna-autocomplete-item').forEach((el: Element) => {
      el.addEventListener('click', () => {
        const itemId = (el as HTMLElement).dataset.itemId;
        refs.filterSearch.value = '';
        hideAutocomplete();
        store.setFilter('search', '');
        scrollToItem(itemId);
      });
    });
  }

  function scrollToItem(itemId: string | undefined) {
    const row = container ? container.querySelector(`[data-item-id="${itemId}"]`) : null;
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // @ts-expect-error strict migration — TS2345
      selectRow(itemId, true);
      // @ts-expect-error strict migration — TS2345
      setTimeout(() => { selectRow(itemId, false); }, 2000);
    }
  }

  return { updateAutocomplete, hideAutocomplete, scrollToItem };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
