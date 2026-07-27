// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE4)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.filters.date-range
// PURPOSE: Date Range Picker — Filtro por intervalo de datas (criação/modificação)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   DateRangeFilter — Factory function
//   PRESETS — Quick date presets
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/filters.js date-range section
// @changelog
//   10.2.0-MIGRATION-PHASE4: Initial creation — FASE 4 B.9
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.2.0-MIGRATION-PHASE4';
export const MODULE_ID = 'panel-nav-admin.ui.filters.date-range';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[DateRangeFilter]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'warn') logger.warn?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Quick date range presets for nav-admin context.
 * @type {Object<string, {label: string, getRange: Function}>}
 */
export const PRESETS = {
  today: {
    label: 'Hoje',
    getRange() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  },
  last7days: {
    label: 'Últimos 7 dias',
    getRange() {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  },
  last30days: {
    label: 'Últimos 30 dias',
    getRange() {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  },
  thisMonth: {
    label: 'Este mês',
    getRange() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  },
  lastMonth: {
    label: 'Mês passado',
    getRange() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
  },
  thisYear: {
    label: 'Este ano',
    getRange() {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }
};

/**
 * Factory: creates a date range filter for nav-admin items.
 * Filters by createdAt / updatedAt fields.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container — Parent DOM element
 * @param {Function} options.onChange — Callback({start, end, field, presetKey})
 * @param {string} [options.field='createdAt'] — Date field to filter (createdAt | updatedAt)
 * @returns {Object} DateRangeFilter instance
 */
export function DateRangeFilter(options: Record<string, unknown> = {}) {
  const container = options.container as HTMLElement | undefined;
  const onChange = options.onChange as ((v: Record<string, unknown>) => void) | undefined;
  const field = (options.field as string) || 'createdAt';

  let _start: Date | null = null;
  let _end: Date | null = null;
  let _activePreset: string | null = null;
  let _field = field;
  let _el: HTMLElement | null = null;

  /**
   * Render the date range picker into the container.
   */
  function render() {
    if (!container) return;

    const presetButtons = Object.entries(PRESETS).map(([key, preset]) => {
      const activeClass = _activePreset === key ? ' pna-date-range__preset--active' : '';
      return `<button type="button" class="pna-date-range__preset${activeClass}" data-preset="${key}">${preset.label}</button>`;
    }).join('');

    const startVal = _start ? _formatDateInput(_start) : '';
    const endVal = _end ? _formatDateInput(_end) : '';

    const html = `
      <div class="pna-date-range" data-filter-type="date-range">
        <div class="pna-date-range__header">
          <span class="pna-date-range__label">Intervalo de datas</span>
          <select class="pna-date-range__field-select" data-action="change-field">
            <option value="createdAt"${_field === 'createdAt' ? ' selected' : ''}>Data de criação</option>
            <option value="updatedAt"${_field === 'updatedAt' ? ' selected' : ''}>Data de modificação</option>
          </select>
        </div>
        <div class="pna-date-range__presets">${presetButtons}</div>
        <div class="pna-date-range__inputs">
          <label class="pna-date-range__input-group">
            <span>De</span>
            <input type="date" class="pna-date-range__input" data-action="start-date" value="${startVal}" />
          </label>
          <label class="pna-date-range__input-group">
            <span>Até</span>
            <input type="date" class="pna-date-range__input" data-action="end-date" value="${endVal}" />
          </label>
          <button type="button" class="pna-date-range__clear" data-action="clear-date-range" title="Limpar intervalo">&times;</button>
        </div>
      </div>
    `;

    if (!_el) {
      _el = document.createElement('div');
      _el.className = 'pna-date-range-wrapper';
      container.appendChild(_el);
    }
    _el.innerHTML = html;
    _bindEvents();
  }

  /** @private */
  function _bindEvents() {
    if (!_el) return;

    _el.addEventListener('click', (e: MouseEvent) => {
      const presetBtn = (e.target as HTMLElement).closest('[data-preset]') as HTMLElement | null;
      if (presetBtn) {
        const key = presetBtn.dataset.preset || '';
        _applyPreset(key);
        return;
      }
      const clearBtn = (e.target as HTMLElement).closest('[data-action="clear-date-range"]');
      if (clearBtn) {
        clear();
        return;
      }
    });

    _el.addEventListener('change', (e: Event) => {
      const fieldSelect = (e.target as HTMLElement).closest('[data-action="change-field"]') as HTMLSelectElement | null;
      if (fieldSelect) {
        _field = fieldSelect.value;
        _notify();
        return;
      }

      const startInput = (e.target as HTMLElement).closest('[data-action="start-date"]') as HTMLInputElement | null;
      if (startInput) {
        _start = startInput.value ? new Date(startInput.value + 'T00:00:00') : null;
        _activePreset = null;
        _notify();
        return;
      }

      const endInput = (e.target as HTMLElement).closest('[data-action="end-date"]') as HTMLInputElement | null;
      if (endInput) {
        _end = endInput.value ? new Date(endInput.value + 'T23:59:59.999') : null;
        _activePreset = null;
        _notify();
        return;
      }
    });
  }

  /** @private */
  function _applyPreset(key: string) {
    const preset = (PRESETS as Record<string, { label: string; getRange: () => { start: Date; end: Date } }>)[key];
    if (!preset) return;
    const range = preset.getRange();
    _start = range.start;
    _end = range.end;
    _activePreset = key;
    render();
    _notify();
  }

  /** @private */
  function _notify() {
    if (typeof onChange === 'function') {
      onChange({ start: _start, end: _end, field: _field, presetKey: _activePreset });
    }
  }

  /**
   * Format Date for input[type=date] value.
   * @private
   * @param {Date} date
   * @returns {string} YYYY-MM-DD
   */
  function _formatDateInput(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Apply filter to an array of nav items.
   * @param {Array} items
   * @returns {Array} Filtered items
   */
  function apply(items: Record<string, unknown>[]) {
    if (!_start && !_end) return items;
    return items.filter((item: Record<string, unknown>) => {
      const dateStr = item[_field] as string | undefined;
      if (!dateStr) return false;
      const itemDate = new Date(dateStr);
      if (_start && itemDate < _start) return false;
      if (_end && itemDate > _end) return false;
      return true;
    });
  }

  /**
   * Get current filter state.
   * @returns {Object|null}
   */
  function getValues() {
    if (!_start && !_end) return null;
    return { start: _start, end: _end, field: _field, presetKey: _activePreset };
  }

  /**
   * Set date range programmatically.
   * @param {Object} range
   * @param {Date|string|null} range.start
   * @param {Date|string|null} range.end
   * @param {string} [range.field]
   */
  function setValues(range: { start?: Date | string | null; end?: Date | string | null; field?: string; presetKey?: string | null }) {
    _start = range.start ? new Date(range.start as string) : null;
    _end = range.end ? new Date(range.end as string) : null;
    if (range.field) _field = range.field;
    _activePreset = range.presetKey || null;
    render();
  }

  /** Check if filter is active. */
  function isActive() {
    return !!(_start || _end);
  }

  /** Clear the date range. */
  function clear() {
    _start = null;
    _end = null;
    _activePreset = null;
    render();
    _notify();
  }

  /** Destroy DOM and listeners. */
  function destroy() {
    if (_el && _el.parentNode) {
      _el.parentNode.removeChild(_el);
    }
    _el = null;
    _start = null;
    _end = null;
  }

  return { render, apply, getValues, setValues, isActive, clear, destroy };
}

/** @returns {Object} Module info */
export function info() {
  return { moduleId: MODULE_ID, version: VERSION, presetsCount: Object.keys(PRESETS).length };
}

/** @returns {Object} Health check */
export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { DateRangeFilter, PRESETS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
