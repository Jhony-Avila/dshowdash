// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE4)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.filters.multi-select
// PURPOSE: Multi-Select Filter — Filtro por seção, contexto, nível de permissão, status
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PERMISSION_LEVELS from ../../core/contracts.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   MultiSelectFilter — Factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/filters.js multi-select section
// @changelog
//   10.2.0-MIGRATION-PHASE4: Initial creation — FASE 4 B.9
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PERMISSION_LEVELS } from '../../core/contracts.js';

export const VERSION = '10.2.0-MIGRATION-PHASE4';
export const MODULE_ID = 'panel-nav-admin.ui.filters.multi-select';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

/**
 * Pre-defined filter dimension configs for nav-admin domain.
 * @type {Object<string, Object>}
 */
export const DIMENSIONS = {
  context: {
    label: 'Contexto',
    field: 'context',
    options: [
      { value: 'sidebar', label: 'Sidebar' },
      { value: 'navrail', label: 'Nav Rail' },
      { value: 'header', label: 'Header' },
      { value: 'footer', label: 'Footer' }
    ]
  },
  section: {
    label: 'Seção',
    field: 'section',
    dynamic: true
  },
  status: {
    label: 'Status',
    field: 'isActive',
    options: [
      { value: 'true', label: 'Ativo' },
      { value: 'false', label: 'Inativo' }
    ]
  },
  permissionLevel: {
    label: 'Nível de Permissão',
    field: 'minLevel',
    options: PERMISSION_LEVELS.map(pl => ({
      value: String(pl.value),
      label: `${pl.label} (${pl.value})`
    }))
  },
  isDivider: {
    label: 'Tipo',
    field: 'isDivider',
    options: [
      { value: 'false', label: 'Item' },
      { value: 'true', label: 'Divisor' }
    ]
  }
};

/**
 * Factory: creates a multi-select filter for nav-admin items.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container — Parent DOM element
 * @param {Function} options.onChange — Callback({dimension, selectedValues[]})
 * @param {string} options.dimension — Key from DIMENSIONS
 * @param {Array} [options.dynamicOptions] — Options for dynamic dimensions (e.g. sections)
 * @returns {Object} MultiSelectFilter instance
 */
type FilterOption = { value: string; label: string };
export function MultiSelectFilter(options: Record<string, unknown> = {}) {
  const container = options.container as HTMLElement | undefined;
  const onChange = options.onChange as ((result: { dimension: string; field: string; selectedValues: string[] }) => void) | undefined;
  const dimension = options.dimension as string;
  const dynamicOptions = options.dynamicOptions as FilterOption[] | undefined;

  const config = (DIMENSIONS as Record<string, { label: string; field: string; dynamic?: boolean; options?: FilterOption[] }>)[dimension];
  if (!config) throw new Error(`Unknown dimension: ${dimension}`);

  let _selected = new Set<string>();
  let _options: FilterOption[] = config.dynamic ? (dynamicOptions || []) : (config.options || []);
  let _el: HTMLElement | null = null;

  /**
   * Render the multi-select filter.
   */
  function render() {
    if (!container) return;

    const checkboxes = _options.map(opt => {
      const checked = _selected.has(String(opt.value)) ? ' checked' : '';
      return `
        <label class="pna-checkbox pna-checkbox--bulk pna-multi-select__option">
          <input type="checkbox" class="pna-checkbox__input" value="${opt.value}" data-dimension="${dimension}"${checked} />
          <span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span>
          <span class="pna-checkbox__label pna-multi-select__label">${opt.label}</span>
        </label>`;
    }).join('');

    const selectedCount = _selected.size > 0 ? ` (${_selected.size})` : '';

    const html = `
      <div class="pna-multi-select" data-filter-type="multi-select" data-dimension="${dimension}">
        <div class="pna-multi-select__header">
          <span class="pna-multi-select__title">${config.label}${selectedCount}</span>
          ${_selected.size > 0 ? '<button type="button" class="pna-multi-select__clear" data-action="clear-multi">&times;</button>' : ''}
        </div>
        <div class="pna-multi-select__body">${checkboxes}</div>
      </div>
    `;

    if (!_el) {
      _el = document.createElement('div');
      _el.className = 'pna-multi-select-wrapper';
      container.appendChild(_el);
    }
    _el.innerHTML = html;
    _bindEvents();
  }

  /** @private */
  function _bindEvents() {
    if (!_el) return;

    _el.addEventListener('change', (e: Event) => {
      const checkbox = (e.target as HTMLElement).closest('input[type="checkbox"]') as HTMLInputElement | null;
      if (!checkbox) return;
      const val = String(checkbox.value);
      if (checkbox.checked) {
        _selected.add(val);
      } else {
        _selected.delete(val);
      }
      _updateHeader();
      _notify();
    });

    _el.addEventListener('click', (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-action="clear-multi"]')) {
        clear();
      }
    });
  }

  /** @private */
  function _updateHeader() {
    const title = _el?.querySelector('.pna-multi-select__title');
    if (title) {
      const count = _selected.size > 0 ? ` (${_selected.size})` : '';
      title.textContent = `${config.label}${count}`;
    }
  }

  /** @private */
  function _notify() {
    if (typeof onChange === 'function') {
      onChange({ dimension, field: config.field, selectedValues: Array.from(_selected) });
    }
  }

  /**
   * Apply filter to an array of nav items.
   * @param {Array} items
   * @returns {Array}
   */
  function apply(items: Record<string, unknown>[]) {
    if (_selected.size === 0) return items;
    return items.filter((item: Record<string, unknown>) => {
      const val = String(item[config.field] ?? '');
      return _selected.has(val);
    });
  }

  /** @returns {Array} Currently selected values */
  function getValues() {
    return Array.from(_selected);
  }

  /**
   * Set selected values programmatically.
   * @param {Array<string>} values
   */
  function setValues(values: string[]) {
    _selected = new Set(values.map(String));
    render();
  }

  /**
   * Update options for dynamic dimensions (e.g. sections loaded from API).
   * @param {Array<{value: string, label: string}>} newOptions
   */
  function updateOptions(newOptions: FilterOption[]) {
    _options = newOptions;
    render();
  }

  /** @returns {boolean} */
  function isActive() {
    return _selected.size > 0;
  }

  /** Clear all selections. */
  function clear() {
    _selected.clear();
    render();
    _notify();
  }

  /** Destroy DOM. */
  function destroy() {
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
    _selected.clear();
  }

  return { render, apply, getValues, setValues, updateOptions, isActive, clear, destroy };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, dimensionsCount: Object.keys(DIMENSIONS).length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { MultiSelectFilter, DIMENSIONS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
