// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/table/events
// PURPOSE: Panel-02 Table Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   handleSortClick, updateSortIndicators from ./sorting.js
//
// PROVIDES:
//   setupSortListeners() — exported function
//   setupResizeListeners() — exported function
//   setupInlineFilterListeners() — exported function
//   setupExpandListeners() — exported function
//   setupGroupToggleListeners() — exported function
//   removeListeners() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
//   'keydown'
//   'mousedown'
//   'mousemove'
//   'mouseup'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup + teardownAll() (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { handleSortClick, updateSortIndicators } from './sorting.js';

let _abortController: AbortController | null = null;
let _listenerCount = 0;

function _ensureAbortController() {
  if (!_abortController) {
    _abortController = new AbortController();
    _listenerCount = 0;
  }
  return _abortController.signal;
}

export function setupSortListeners(element: HTMLElement | null, state: Record<string, unknown>, handlers: Record<string, (...args: string[]) => void>) {
  const headerClickHandler = (e: MouseEvent) => {
    const th = (e.target as Element).closest('th[data-sort]') as HTMLElement | null;
    if (!th || (e.target as Element).closest('.p02-col-resizer')) return;

    const column = th.dataset.sort || '';
    const isMulti = e.shiftKey;

    state.sortColumns = handleSortClick(state.sortColumns as Array<{ column: string; direction: string }>, column, isMulti);
    updateSortIndicators(element, state.sortColumns as Array<{ column: string; direction: string }>);
    handlers.sortAndRender();

    const sortDesc = (state.sortColumns as Array<{ column: string; direction: string }>).map((s: { column: string; direction: string }) => `${s.column} ${s.direction}`).join(', ');
    handlers.announce(sortDesc ? `Ordenado por ${sortDesc}` : 'Ordenacao removida');
  };

  const signal = _ensureAbortController();
  const thead = element?.querySelector('thead');
  if (thead) {
    thead.addEventListener('click', headerClickHandler, { signal });
    thead.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const th = (e.target as HTMLElement).closest('th[data-sort]');
        if (th) { e.preventDefault(); (th as HTMLElement).click(); }
      }
    }, { signal });
    _listenerCount += 2;
  }

  return headerClickHandler;
}

export function setupResizeListeners(element: HTMLElement | null, columns: Record<string, unknown>[]) {
  let startX: number, startWidth: number, resizingCol: string | null = null;
  
  const onMouseMove = (e: MouseEvent) => {
    if (!resizingCol) return;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    const col = columns.find((c: Record<string, unknown>) => c.id === resizingCol);
    if (col) col.width = newWidth;
    const th = element?.querySelector(`th[data-sort="${resizingCol}"]`) as HTMLElement | null;
    if (th) th.style.width = `${newWidth}px`;
  };
  
  const onMouseUp = () => {
    if (resizingCol) {
      document.querySelectorAll('.p02-col-resizer').forEach(r => r.classList.remove('resizing'));
      resizingCol = null;
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  
  const resizeHandler = (e: MouseEvent) => {
    const resizer = (e.target as HTMLElement).closest('.p02-col-resizer') as HTMLElement | null;
    if (!resizer) return;
    e.preventDefault();
    resizingCol = resizer.dataset.col || null;
    resizer.classList.add('resizing');
    const th = resizer.closest('th') as HTMLElement | null;
    startX = e.clientX;
    startWidth = th?.offsetWidth || 0;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const signal = _ensureAbortController();
  element?.addEventListener('mousedown', resizeHandler, { signal });
  _listenerCount++;
  return resizeHandler;
}

export function setupInlineFilterListeners(element: HTMLElement | null, state: Record<string, unknown>, handlers: Record<string, ((...args: unknown[]) => void) | undefined>) {
  const inlineFilterHandler = (e: Event) => {
    const filter = (e.target as Element).closest('[data-inline-filter]') as (HTMLElement & { dataset: DOMStringMap; value: string }) | null;
    if (!filter) return;
    (state.inlineFilters as Record<string, string>)[filter.dataset.inlineFilter as string] = filter.value;
    (handlers.onInlineFilter as ((f: unknown) => void) | undefined)?.(state.inlineFilters);
  };
  
  const signal = _ensureAbortController();
  element?.addEventListener('input', inlineFilterHandler, { signal });
  element?.addEventListener('change', inlineFilterHandler, { signal });
  _listenerCount += 2;
  return inlineFilterHandler;
}

export function setupExpandListeners(element: HTMLElement | null, state: Record<string, unknown>, handlers: Record<string, (...args: string[]) => void>) {
  const expandHandler = (e: MouseEvent) => {
    const expandBtn = (e.target as HTMLElement).closest('.p02-expand-btn');
    if (!expandBtn) return;
    
    const row = expandBtn.closest('tr');
    const jobId = row?.dataset.jobId;
    if (!jobId) return;
    
    const isExpanded = (state.expandedRows as Set<string>).has(jobId);
    if (isExpanded) {
      (state.expandedRows as Set<string>).delete(jobId);
      expandBtn.classList.remove('expanded');
      expandBtn.setAttribute('aria-expanded', 'false');
    } else {
      (state.expandedRows as Set<string>).add(jobId);
      expandBtn.classList.add('expanded');
      expandBtn.setAttribute('aria-expanded', 'true');
    }
    
    const expandedRow = (row as HTMLElement).nextElementSibling;
    if (expandedRow?.classList.contains('p02-expanded-row')) {
      expandedRow.classList.toggle('open', !isExpanded);
    }
    
    handlers.announce(isExpanded ? 'Linha recolhida' : 'Linha expandida');
  };

  const signal = _ensureAbortController();
  element?.addEventListener('click', expandHandler, { signal });
  _listenerCount++;
  return expandHandler;
}

export function setupGroupToggleListeners(element: HTMLElement | null, state: Record<string, unknown>, handlers: Record<string, (...args: string[]) => void>) {
  const groupToggleHandler = (e: MouseEvent) => {
    const toggle = (e.target as HTMLElement).closest('.p02-group-toggle') as HTMLElement | null;
    if (!toggle) return;
    
    const groupKey = toggle?.dataset.group || '';
    const isCollapsed = (state.collapsedGroups as Set<string>).has(groupKey);

    if (isCollapsed) {
      (state.collapsedGroups as Set<string>).delete(groupKey);
      toggle?.classList.remove('collapsed');
    } else {
      (state.collapsedGroups as Set<string>).add(groupKey);
      toggle.classList.add('collapsed');
    }
    
    const tbody = element?.querySelector('.p02-tbody');
    const rows = tbody?.querySelectorAll(`tr[data-group="${groupKey}"]`);
    rows?.forEach((row: Element) => row.classList.toggle('hidden', !isCollapsed));
    
    handlers.announce(isCollapsed ? `Grupo ${groupKey} expandido` : `Grupo ${groupKey} recolhido`);
  };

  const signal = _ensureAbortController();
  element?.addEventListener('click', groupToggleHandler, { signal });
  _listenerCount++;
  return groupToggleHandler;
}

export function removeListeners(element: HTMLElement | null, handlers: Record<string, EventListener>) {
  const thead = element?.querySelector('thead');
  if (thead && handlers.headerClickHandler) {
    thead.removeEventListener('click', handlers.headerClickHandler);
  }
  if (handlers.resizeHandler) element?.removeEventListener('mousedown', handlers.resizeHandler);
  if (handlers.inlineFilterHandler) {
    element?.removeEventListener('input', handlers.inlineFilterHandler);
    element?.removeEventListener('change', handlers.inlineFilterHandler);
  }
  if (handlers.expandHandler) element?.removeEventListener('click', handlers.expandHandler);
  if (handlers.groupToggleHandler) element?.removeEventListener('click', handlers.groupToggleHandler);
}

export function teardownAll() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}

export default {
  setupSortListeners,
  setupResizeListeners,
  setupInlineFilterListeners,
  setupExpandListeners,
  setupGroupToggleListeners,
  removeListeners,
  teardownAll
};

export const MODULE_ID = 'panel-02/ui/table/events';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, hasAbortController: _abortController !== null }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, cleanupAvailable: true, listenersTracked: _abortController !== null || _listenerCount === 0 } }; }
