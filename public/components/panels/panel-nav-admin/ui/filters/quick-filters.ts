// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE4)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.filters.quick-filters
// PURPOSE: Quick Filters — Atalhos rápidos de filtro para nav-admin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   QuickFilters — Factory function
//   DEFAULT_QUICK_FILTERS — Pre-defined quick filter configs
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/filters.js quick-filters section
// @changelog
//   10.2.0-MIGRATION-PHASE4: Initial creation — FASE 4 B.9
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.2.0-MIGRATION-PHASE4';
export const MODULE_ID = 'panel-nav-admin.ui.filters.quick-filters';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

/**
 * Pre-defined quick filters for nav-admin domain.
 * Each filter is a predicate function on item + metadata.
 * @type {Array<{id: string, label: string, icon: string, predicate: Function, description: string}>}
 */
export const DEFAULT_QUICK_FILTERS = [
  {
    id: 'active-only',
    label: 'Ativos',
    icon: 'check-circle',
    description: 'Mostrar apenas itens ativos',
    predicate: (item: Record<string, unknown>) => item.isActive === true
  },
  {
    id: 'inactive-only',
    label: 'Inativos',
    icon: 'x-circle',
    description: 'Mostrar apenas itens inativos',
    predicate: (item: Record<string, unknown>) => item.isActive === false
  },
  {
    id: 'no-icon',
    label: 'Sem ícone',
    icon: 'image',
    description: 'Itens com ícone padrão ou sem ícone definido',
    predicate: (item: Record<string, unknown>) => !item.icon || item.icon === 'default'
  },
  {
    id: 'dividers',
    label: 'Divisores',
    icon: 'minus',
    description: 'Apenas divisores de seção',
    predicate: (item: Record<string, unknown>) => item.isDivider === true
  },
  {
    id: 'high-permission',
    label: 'Nível Alto',
    icon: 'shield',
    description: 'Itens com nível de permissão >= 60',
    predicate: (item: Record<string, unknown>) => (Number(item.minLevel) || 0) >= 60
  },
  {
    id: 'public',
    label: 'Públicos',
    icon: 'globe',
    description: 'Itens com nível de permissão 0 (público)',
    predicate: (item: Record<string, unknown>) => (Number(item.minLevel) || 0) === 0
  },
  {
    id: 'no-route',
    label: 'Sem rota',
    icon: 'alert-triangle',
    description: 'Itens sem href/rota configurada',
    predicate: (item: Record<string, unknown>) => !item.href || item.href === '' || item.href === 'null'
  },
  {
    id: 'recently-modified',
    label: 'Recentes',
    icon: 'clock',
    description: 'Modificados nos últimos 7 dias',
    predicate: (item: Record<string, unknown>) => {
      if (!item.updatedAt) return false;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(item.updatedAt as string | number).getTime() > weekAgo;
    }
  }
];

/**
 * Factory: creates a quick filters bar for nav-admin.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container — Parent DOM element
 * @param {Function} options.onChange — Callback(activeFilterIds[])
 * @param {Array} [options.filters] — Custom filters array; defaults to DEFAULT_QUICK_FILTERS
 * @returns {Object} QuickFilters instance
 */
export function QuickFilters(options: Record<string, unknown> = {}) {
  const container = options.container as HTMLElement | undefined;
  const onChange = options.onChange as ((ids: string[]) => void) | undefined;
  const filters = (options.filters as typeof DEFAULT_QUICK_FILTERS) || DEFAULT_QUICK_FILTERS;

  let _active = new Set<string>();
  let _el: HTMLElement | null = null;

  /**
   * Render the quick filter bar.
   */
  function render() {
    if (!container) return;

    const buttons = filters.map((f: typeof DEFAULT_QUICK_FILTERS[0]) => {
      const activeClass = _active.has(f.id) ? ' pna-quick-filter--active' : '';
      return `<button type="button" class="pna-quick-filter${activeClass}" data-quick-filter="${f.id}" title="${f.description}">${f.label}</button>`;
    }).join('');

    const html = `
      <div class="pna-quick-filters" data-filter-type="quick-filters">
        <span class="pna-quick-filters__label">Filtros rápidos:</span>
        <div class="pna-quick-filters__bar">${buttons}</div>
        ${_active.size > 0 ? '<button type="button" class="pna-quick-filters__clear" data-action="clear-quick">Limpar</button>' : ''}
      </div>
    `;

    if (!_el) {
      _el = document.createElement('div');
      _el.className = 'pna-quick-filters-wrapper';
      container.appendChild(_el);
    }
    _el.innerHTML = html;
    _bindEvents();
  }

  /** @private */
  function _bindEvents() {
    if (!_el) return;

    _el.addEventListener('click', (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-quick-filter]') as HTMLElement | null;
      if (btn) {
        const id = btn.dataset.quickFilter || '';
        if (_active.has(id)) {
          _active.delete(id);
        } else {
          _active.add(id);
        }
        render();
        _notify();
        return;
      }
      if ((e.target as HTMLElement).closest('[data-action="clear-quick"]')) {
        clear();
      }
    });
  }

  /** @private */
  function _notify() {
    if (typeof onChange === 'function') {
      onChange(Array.from(_active));
    }
  }

  /**
   * Apply all active quick filters to items.
   * Items must pass ALL active filters (AND logic).
   * @param {Array} items
   * @returns {Array}
   */
  function apply(items: Record<string, unknown>[]) {
    if (_active.size === 0) return items;
    const activeFilters = filters.filter((f: typeof DEFAULT_QUICK_FILTERS[0]) => _active.has(f.id));
    return items.filter((item: Record<string, unknown>) => activeFilters.every((f: typeof DEFAULT_QUICK_FILTERS[0]) => f.predicate(item)));
  }

  /** @returns {Array<string>} Active filter IDs */
  function getValues() {
    return Array.from(_active);
  }

  /**
   * Set active filters programmatically.
   * @param {Array<string>} ids
   */
  function setValues(ids: string[]) {
    _active = new Set(ids);
    render();
  }

  /** @returns {boolean} */
  function isActive() {
    return _active.size > 0;
  }

  /** Clear all active filters. */
  function clear() {
    _active.clear();
    render();
    _notify();
  }

  /** Destroy DOM. */
  function destroy() {
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
    _active.clear();
  }

  return { render, apply, getValues, setValues, isActive, clear, destroy };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultFiltersCount: DEFAULT_QUICK_FILTERS.length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { QuickFilters, DEFAULT_QUICK_FILTERS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
