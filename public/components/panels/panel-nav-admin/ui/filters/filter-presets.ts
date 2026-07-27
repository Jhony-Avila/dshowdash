// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE4)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.filters.filter-presets
// PURPOSE: Filter Presets — Salvar/carregar combinações de filtros
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   FilterPresets — Factory function
//   STORAGE_KEY — localStorage key
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/table/saved-views.js filter preset portion
// @changelog
//   10.2.0-MIGRATION-PHASE4: Initial creation — FASE 4 B.9
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.2.0-MIGRATION-PHASE4';
export const MODULE_ID = 'panel-nav-admin.ui.filters.filter-presets';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[FilterPresets]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/** @type {string} */
export const STORAGE_KEY = 'pna_filter_presets';

/** @type {number} Maximum number of presets */
const MAX_PRESETS = 20;

/**
 * Factory: creates a filter presets manager.
 * Persists filter combinations to localStorage for quick recall.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container — Parent DOM element
 * @param {Function} options.onApply — Callback(presetConfig) when user applies a preset
 * @param {Function} options.getCurrentConfig — Returns current filter state to save
 * @returns {Object} FilterPresets instance
 */
type FilterPreset = { id: string; name: string; config: unknown; createdAt: string };
export function FilterPresets(options: Record<string, unknown> = {}) {
  const container = options.container as HTMLElement | undefined;
  const onApply = options.onApply as ((config: unknown) => void) | undefined;
  const getCurrentConfig = options.getCurrentConfig as (() => unknown) | undefined;

  let _presets: FilterPreset[] = [];
  let _el: HTMLElement | null = null;
  let _isOpen = false;

  _loadFromStorage();

  /**
   * Load presets from localStorage.
   * @private
   */
  function _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _presets = raw ? JSON.parse(raw) : [];
    } catch (e: any) {
      _log('error', 'Failed to load presets:', e.message);
      _presets = [];
    }
  }

  /**
   * Save presets to localStorage.
   * @private
   */
  function _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_presets));
    } catch (e: any) {
      _log('error', 'Failed to save presets:', e.message);
    }
  }

  /**
   * Render the presets panel.
   */
  function render() {
    if (!container) return;

    const presetList = _presets.map((p, i) => `
      <div class="pna-filter-preset__item" data-preset-index="${i}">
        <button type="button" class="pna-filter-preset__apply" data-action="apply-preset" data-index="${i}" title="Aplicar: ${_escAttr(p.name)}">${_esc(p.name)}</button>
        <span class="pna-filter-preset__date">${_formatDate(p.createdAt)}</span>
        <button type="button" class="pna-filter-preset__delete" data-action="delete-preset" data-index="${i}" title="Remover">&times;</button>
      </div>
    `).join('');

    const html = `
      <div class="pna-filter-presets" data-filter-type="filter-presets">
        <div class="pna-filter-presets__header">
          <button type="button" class="pna-filter-presets__toggle" data-action="toggle-presets">
            Presets de filtros (${_presets.length})
          </button>
          <button type="button" class="pna-filter-presets__save" data-action="save-preset" title="Salvar filtros atuais como preset">+</button>
        </div>
        <div class="pna-filter-presets__body" style="display:${_isOpen ? 'block' : 'none'}">
          ${_presets.length === 0 ? '<div class="pna-filter-presets__empty">Nenhum preset salvo</div>' : presetList}
        </div>
      </div>
    `;

    if (!_el) {
      _el = document.createElement('div');
      _el.className = 'pna-filter-presets-wrapper';
      container.appendChild(_el);
    }
    _el.innerHTML = html;
    _bindEvents();
  }

  /** @private */
  function _bindEvents() {
    if (!_el) return;

    _el.addEventListener('click', (e: MouseEvent) => {
      const action = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
      if (!action) return;

      const actionName = action.dataset.action;
      const index = action.dataset.index != null ? parseInt(action.dataset.index, 10) : -1;

      switch (actionName) {
        case 'toggle-presets':
          _isOpen = !_isOpen;
          render();
          break;
        case 'save-preset':
          _promptSave();
          break;
        case 'apply-preset':
          if (index >= 0 && index < _presets.length) {
            _applyPreset(index);
          }
          break;
        case 'delete-preset':
          if (index >= 0 && index < _presets.length) {
            _deletePreset(index);
          }
          break;
      }
    });
  }

  /** @private */
  function _promptSave() {
    const name = prompt('Nome do preset de filtros:');
    if (!name || !name.trim()) return;
    if (name.trim().length > 50) {
      alert('Nome muito longo (máx. 50 caracteres)');
      return;
    }
    save(name.trim());
  }

  /**
   * Save current filter config as a named preset.
   * @param {string} name
   */
  function save(name: string) {
    if (_presets.length >= MAX_PRESETS) {
      _log('warn', 'Max presets reached:', MAX_PRESETS);
      alert(`Limite de ${MAX_PRESETS} presets atingido. Remova um antes de salvar.`);
      return;
    }

    const config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : {};
    const preset = {
      id: 'fp_' + Date.now(),
      name,
      config,
      createdAt: new Date().toISOString()
    };

    _presets.unshift(preset);
    _saveToStorage();
    _isOpen = true;
    render();
    _log('info', 'Preset saved:', name);
  }

  /** @private */
  function _applyPreset(index: number) {
    const preset = _presets[index];
    if (!preset) return;
    if (typeof onApply === 'function') {
      onApply(preset.config);
    }
    _log('info', 'Preset applied:', preset.name);
  }

  /** @private */
  function _deletePreset(index: number) {
    const preset = _presets[index];
    if (!preset) return;
    _presets.splice(index, 1);
    _saveToStorage();
    render();
    _log('info', 'Preset deleted:', preset.name);
  }

  /**
   * Get all presets.
   * @returns {Array}
   */
  function getAll() {
    return [..._presets];
  }

  /**
   * Import presets from a JSON string.
   * @param {string} jsonStr
   */
  function importPresets(jsonStr: string) {
    try {
      const imported = JSON.parse(jsonStr);
      if (!Array.isArray(imported)) throw new Error('Expected array');
      _presets = imported.slice(0, MAX_PRESETS);
      _saveToStorage();
      render();
    } catch (e: any) {
      _log('error', 'Import failed:', e.message);
    }
  }

  /**
   * Export presets as JSON string.
   * @returns {string}
   */
  function exportPresets() {
    return JSON.stringify(_presets, null, 2);
  }

  /** Clear all presets. */
  function clear() {
    _presets = [];
    _saveToStorage();
    render();
  }

  /** Destroy DOM. */
  function destroy() {
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
  }

  /** @private Simple HTML entity escape for display */
  function _esc(str: string) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /** @private Escape for attribute */
  function _escAttr(str: string) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** @private Format ISO date */
  function _formatDate(isoStr: string) {
    try {
      return new Date(isoStr).toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  }

  return { render, save, getAll, importPresets, exportPresets, clear, destroy };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, maxPresets: MAX_PRESETS };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { FilterPresets, STORAGE_KEY, injectPorts, info, healthCheck, VERSION, MODULE_ID };
