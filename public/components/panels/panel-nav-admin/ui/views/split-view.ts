// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE4)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.views.split-view
// PURPOSE: Split View — Lista + Editor lado a lado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   SplitView — Factory function
//   SPLIT_MODES, SPLIT_SIZES — Constants
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/split-view.js for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE4: Initial creation — FASE 4 B.8
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.2.0-MIGRATION-PHASE4';
export const MODULE_ID = 'panel-nav-admin.ui.views.split-view';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[SplitView]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/** @type {Object} Split mode constants */
export const SPLIT_MODES = Object.freeze({
  OFF: 'off',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
});

/** @type {Object} Split size presets (percentage for list pane) */
export const SPLIT_SIZES = Object.freeze({
  SMALL: 30,
  MEDIUM: 50,
  LARGE: 70
});

/**
 * Factory: creates a split view (list + detail/editor side by side).
 *
 * @param {Object} options
 * @param {HTMLElement} options.container — Parent DOM element
 * @param {Function} options.onItemSelect — Callback(item) when an item is selected in the list
 * @param {Function} [options.onModeChange] — Callback(mode) when split mode changes
 * @param {Function} [options.onResize] — Callback(listPercent) when divider is dragged
 * @param {Function} options.renderList — Function(listContainer) to render list pane content
 * @param {Function} options.renderDetail — Function(detailContainer, item) to render detail pane
 * @param {string} [options.mode='horizontal'] — Initial split mode
 * @param {number} [options.size=50] — Initial list pane size percentage
 * @returns {Object} SplitView instance
 */
export function SplitView(options: Record<string, unknown> = {}) {
  const container = options.container as HTMLElement | undefined;
  const onItemSelect = options.onItemSelect as ((item: Record<string, unknown>) => void) | undefined;
  const onModeChange = options.onModeChange as ((mode: string) => void) | undefined;
  const onResize = options.onResize as ((listPercent: number) => void) | undefined;
  const renderList = options.renderList as ((listContainer: HTMLElement) => void) | undefined;
  const renderDetail = options.renderDetail as ((detailContainer: HTMLElement, item: Record<string, unknown>) => void) | undefined;
  let _mode = (options.mode as string) || SPLIT_MODES.HORIZONTAL;
  let _size = (options.size as number) ?? SPLIT_SIZES.MEDIUM;

  let _selectedItem: Record<string, unknown> | null = null;
  let _el: HTMLElement | null = null;
  let _isDragging = false;
  let _listPane: HTMLElement | null = null;
  let _detailPane: HTMLElement | null = null;
  let _divider: HTMLElement | null = null;

  /**
   * Initialize the split view layout.
   */
  function init() {
    if (!container) return;
    _render();
    _log('info', 'Initialized with mode:', _mode, 'size:', _size);
  }

  /**
   * Render the split layout.
   * @private
   */
  function _render() {
    if (_mode === SPLIT_MODES.OFF) {
      container!.innerHTML = '<div class="pna-split-view__list-only" data-slot="list-only"></div>';
      _listPane = container!.querySelector('[data-slot="list-only"]');
      _detailPane = null;
      _divider = null;
      // @ts-expect-error strict migration — TS2345
      if (typeof renderList === 'function') renderList(_listPane);
      return;
    }

    const isVertical = _mode === SPLIT_MODES.VERTICAL;
    const flexDir = isVertical ? 'column' : 'row';
    const sizeProp = isVertical ? 'height' : 'width';
    const listSize = `${_size}%`;
    const detailSize = `${100 - _size}%`;

    container!.innerHTML = `
      <div class="pna-split-view pna-split-view--${_mode}" style="display:flex;flex-direction:${flexDir};height:100%;">
        <div class="pna-split-view__list" data-slot="list" style="${sizeProp}:${listSize};overflow:auto;"></div>
        <div class="pna-split-view__divider" data-role="divider" style="${isVertical ? 'height' : 'width'}:6px;cursor:${isVertical ? 'row-resize' : 'col-resize'};background:var(--pna-border,#ddd);flex-shrink:0;"></div>
        <div class="pna-split-view__detail" data-slot="detail" style="${sizeProp}:${detailSize};overflow:auto;"></div>
      </div>`;

    _listPane = container!.querySelector('[data-slot="list"]');
    _detailPane = container!.querySelector('[data-slot="detail"]');
    _divider = container!.querySelector('[data-role="divider"]');

    // @ts-expect-error strict migration — TS2345
    if (typeof renderList === 'function') renderList(_listPane);
    if (_selectedItem && typeof renderDetail === 'function') {
      // @ts-expect-error strict migration — TS2345
      renderDetail(_detailPane, _selectedItem);
    } else if (_detailPane) {
      _detailPane.innerHTML = '<div class="pna-split-view__placeholder">Selecione um item para editar</div>';
    }

    _bindDividerDrag();
  }

  /**
   * Bind divider drag events for resizing.
   * @private
   */
  function _bindDividerDrag() {
    if (!_divider) return;

    const isVertical = _mode === SPLIT_MODES.VERTICAL;
    let startPos = 0;
    let startSize = 0;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      _isDragging = true;
      startPos = isVertical ? e.clientY : e.clientX;
      startSize = _size;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      _divider!.classList.add('pna-split-view__divider--active');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!_isDragging) return;
      const containerRect = container!.getBoundingClientRect();
      const totalSize = isVertical ? containerRect.height : containerRect.width;
      const currentPos = isVertical ? e.clientY : e.clientX;
      const delta = currentPos - startPos;
      const deltaPercent = (delta / totalSize) * 100;
      const newSize = Math.min(80, Math.max(20, startSize + deltaPercent));
      _size = Math.round(newSize);

      if (_listPane) {
        const prop = isVertical ? 'height' : 'width';
        _listPane.style[prop] = `${_size}%`;
        _detailPane!.style[prop] = `${100 - _size}%`;
      }
    };

    const onMouseUp = () => {
      _isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      _divider!.classList.remove('pna-split-view__divider--active');
      if (typeof onResize === 'function') onResize(_size);
    };

    _divider.addEventListener('mousedown', onMouseDown);
  }

  /**
   * Select an item and render its detail.
   * @param {Object} item
   */
  function selectItem(item: Record<string, unknown>) {
    _selectedItem = item;
    if (typeof onItemSelect === 'function') onItemSelect(item);
    if (_detailPane && typeof renderDetail === 'function') {
      renderDetail(_detailPane, item);
    }
  }

  /**
   * Get the list pane container.
   * @returns {HTMLElement|null}
   */
  function getListPane() { return _listPane; }

  /**
   * Get the detail pane container.
   * @returns {HTMLElement|null}
   */
  function getDetailPane() { return _detailPane; }

  /**
   * Change split mode.
   * @param {string} newMode — SPLIT_MODES value
   */
  function setMode(newMode: string) {
    _mode = newMode;
    _render();
    if (typeof onModeChange === 'function') onModeChange(newMode);
  }

  /**
   * Set split size.
   * @param {number} percent — 20–80
   */
  function setSize(percent: number) {
    _size = Math.min(80, Math.max(20, percent));
    _render();
  }

  /** @returns {string} Current mode */
  function getMode() { return _mode; }

  /** @returns {number} Current size */
  function getSize() { return _size; }

  /** @returns {Object|null} Currently selected item */
  function getSelectedItem() { return _selectedItem; }

  /** Refresh list pane. */
  function refreshList() {
    if (_listPane && typeof renderList === 'function') renderList(_listPane);
  }

  /** Refresh detail pane. */
  function refreshDetail() {
    if (_detailPane && _selectedItem && typeof renderDetail === 'function') {
      renderDetail(_detailPane, _selectedItem);
    }
  }

  /** Destroy the split view. */
  function destroy() {
    if (container) container.innerHTML = '';
    _el = null;
    _listPane = null;
    _detailPane = null;
    _divider = null;
    _selectedItem = null;
  }

  return {
    init, selectItem, getListPane, getDetailPane,
    setMode, setSize, getMode, getSize, getSelectedItem,
    refreshList, refreshDetail, destroy
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, modes: Object.values(SPLIT_MODES) };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { SplitView, SPLIT_MODES, SPLIT_SIZES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
