// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (11.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table
// PURPOSE: Panel-01 Table Component - Core Class
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   COLUMNS from ./constants.js
//   renderHeader from ./render/header.js
//   renderRows from ./render/row.js
//   renderTableSkeleton from ../render/skeleton.js
//   renderEmpty from ../render/empty.js
//   renderError from ../render/error.js
//   createCoreManagers, createExtendedManagers from ./managers-factory.js
//   initDOMFeatures, applyExtendedFeatures from ./features-init.js
//   bindTableEvents, bindRetryEvent, unbindTableEvents from ./event-bindings.js
//   mixinCoreAPI from ./api-core.js
//   mixinExtendedAPI from ./api-extended.js
//   mixinUtilsAPI from ./api-utils.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   EXPAND_SVGS — exported value
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

import { COLUMNS } from './constants.js';
import { renderHeader } from './render/header.js';
import { renderRows } from './render/row.js';
import { renderTableSkeleton } from '../render/skeleton.js';
import { renderEmpty } from '../render/empty.js';
import { renderError } from '../render/error.js';

import { createCoreManagers, createExtendedManagers } from './managers-factory.js';
import { initDOMFeatures, applyExtendedFeatures } from './features-init.js';
import { bindTableEvents, bindRetryEvent, unbindTableEvents } from './event-bindings.js';
import { mixinCoreAPI } from './api-core.js';
import { mixinExtendedAPI } from './api-extended.js';
import { mixinUtilsAPI } from './api-utils.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table';

const EXPAND_SVGS = {
  expanded: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  collapsed: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
};

export class TableComponent {
  [key: string]: any;
  constructor(container: HTMLElement, options: Record<string, unknown> = {}) {
    const opts = options || {};
    this.container = container;
    this.columns = opts.columns || COLUMNS;
    this.onSort = opts.onSort || (() => {});
    this.onSelect = opts.onSelect || (() => {});
    this.onSelectAll = opts.onSelectAll || (() => {});
    this.onRowClick = opts.onRowClick || (() => {});
    this.onRowContext = opts.onRowContext || (() => {});
    this.onCellEdit = opts.onCellEdit || (() => {});
    this.onColumnReorder = opts.onColumnReorder || (() => {});
    this.onColumnResize = opts.onColumnResize || (() => {});
    this.onInlineEdit = opts.onInlineEdit || (() => {});
    this.onGroupChange = opts.onGroupChange || (() => {});
    this.onColumnsChange = opts.onColumnsChange || (() => {});
    this.onKeyboardAction = opts.onKeyboardAction || (() => {});
    this.onBulkEdit = opts.onBulkEdit || (() => {});
    this.onTagsChange = opts.onTagsChange || (() => {});
    this.onViewChange = opts.onViewChange || (() => {});
    this.onAnomalyDetected = opts.onAnomalyDetected || (() => {});
    this._features = { dragDrop: opts.dragDrop !== false, resize: opts.resize !== false, multiSort: opts.multiSort !== false, sticky: opts.sticky !== false, inlineEdit: opts.inlineEdit !== false, grouping: opts.grouping !== false, eventManager: opts.eventManager !== false, columnsManager: opts.columnsManager !== false, keyboard: opts.keyboard !== false, bulkEdit: opts.bulkEdit !== false, tags: opts.tags !== false, savedViews: opts.savedViews !== false, badgeNew: opts.badgeNew !== false, rowHoverMenu: opts.rowHoverMenu !== false, summaryRow: opts.summaryRow !== false, highlightingRules: opts.highlightingRules !== false, anomalyDetection: opts.anomalyDetection !== false };
    this._stickyConfig = opts.stickyConfig || { left: ['select', 'id'], right: ['actions'] };
    this._editableFields = opts.editableFields || ['descricao', 'observacao'];
    this._maxSorts = opts.maxSorts || 3;
    this._defaultSort = opts.defaultSort || { field: 'Data_Requisicao', order: 'DESC' };
    this._hoverMenuActions = opts.hoverMenuActions || null;
    this._summaryColumns = opts.summaryColumns || ['total'];
    this._highlightRules = opts.highlightRules || [];
    this._anomalyConfig = opts.anomalyConfig || {};
    this._listener = null;
    this._contextListener = null;
    this._tableEl = null;
    this._tbodyEl = null;
    this._isVirtual = false;
    this._currentItems = [];
    this._dragDrop = null;
    this._resize = null;
    this._multiSort = null;
    this._sticky = null;
    this._inlineEditor = null;
    this._grouping = null;
    this._sorting = null;
    this._eventManager = null;
    this._columnsManager = null;
    this._keyboard = null;
    this._bulkEdit = null;
    this._tags = null;
    this._savedViews = null;
    this._badgeNew = null;
    this._rowHoverMenu = null;
    this._summaryRow = null;
    this._highlightingRules = null;
    this._anomalyDetector = null;
    this._initManagers();
  }

  _initManagers() {
    const config = { maxSorts: this._maxSorts, defaultSort: this._defaultSort, editableFields: this._editableFields, summaryColumns: this._summaryColumns, highlightRules: this._highlightRules, anomalyConfig: this._anomalyConfig };
    const core: Record<string, unknown> = createCoreManagers(this, this._features, config);
    this._multiSort = core.multiSort || null;
    this._sorting = core.sorting;
    this._inlineEditor = core.inlineEditor || null;
    this._grouping = core.grouping || null;
    const extended: Record<string, unknown> = createExtendedManagers(this, this._features, config);
    this._columnsManager = extended.columnsManager || null;
    this._keyboard = extended.keyboard || null;
    this._bulkEdit = extended.bulkEdit || null;
    this._tags = extended.tags || null;
    this._savedViews = extended.savedViews || null;
    this._badgeNew = extended.badgeNew || null;
    this._summaryRow = extended.summaryRow || null;
    this._highlightingRules = extended.highlightingRules || null;
    this._anomalyDetector = extended.anomalyDetector || null;
  }

  _initFeatures() { initDOMFeatures(this); }
  _applyExtendedFeatures(items: Record<string, unknown>[]) { applyExtendedFeatures(this, items); }
  _bindEvents() { bindTableEvents(this); }
  _bindRetry() { bindRetryEvent(this); }

  render(state: Record<string, unknown>) {
    if (!this.container) return;
    const loading = state.loading;
    const error = state.error;
    const items = (state.items || []) as Record<string, unknown>[];
    const selectedIds = (state.selectedIds || new Set()) as Set<string>;
    const sort = state.sort || {};
    this._currentItems = items;
    if (loading && items.length === 0) { this.container.innerHTML = renderTableSkeleton(this.columns.filter((c: Record<string, unknown>) => c.visible).length); return; }
    if (error) { this.container.innerHTML = renderError(error as string | Error); this._bindRetry(); return; }
    if (items.length === 0) { this.container.innerHTML = renderEmpty(); return; }
    this._isVirtual = false;
    if (this._grouping && this._grouping.get()) { this._renderGrouped(items, selectedIds, sort); }
    else { this._renderFlat(items, selectedIds, sort); }
    this._tableEl = this.container.querySelector('.p01-table');
    this._tbodyEl = this.container.querySelector('tbody');
    this._bindEvents();
    this._initFeatures();
    this._applyExtendedFeatures(items);
  }

  _renderFlat(items: Record<string, unknown>[], selectedIds: Set<string>, sort: unknown) {
    const allSelected = items.length > 0 && items.every((i: Record<string, unknown>) => selectedIds.has(String(i.id || i.Id_Requisicao)));
    const header = renderHeader({ columns: this.columns, sort, allSelected });
    const rows = renderRows(items, { columns: this.columns, selectedIds });
    this.container.innerHTML = `<div class="p01-table-wrapper"><table class="p01-table" role="grid">${header}<tbody>${rows}</tbody></table></div>`;
  }

  _renderGrouped(items: Record<string, unknown>[], selectedIds: Set<string>, sort: unknown) {
    const self = this;
    const groups = this._grouping.groupItems(items);
    const allSelected = items.length > 0 && items.every((i: Record<string, unknown>) => selectedIds.has(String(i.id || i.Id_Requisicao)));
    const header = renderHeader({ columns: this.columns, sort, allSelected });
    let tbodyContent = '';
    groups.forEach((group: Record<string, unknown>) => {
      if (group.key !== null) {
        const isExpanded = self._grouping.isExpanded(group.key);
        const expandIcon = isExpanded ? EXPAND_SVGS.expanded : EXPAND_SVGS.collapsed;
        const totalFormatted = self._formatCurrency(group.total);
        tbodyContent += `<tr class="p01-group-row" data-group="${group.key}">`;
        tbodyContent += `<td colspan="${self.columns.filter((c: Record<string, unknown>) => c.visible).length}">`;
        tbodyContent += '<div class="p01-group-header">';
        tbodyContent += `<span class="p01-group-toggle">${expandIcon}</span>`;
        tbodyContent += `<span class="p01-group-label">${group.label}</span>`;
        tbodyContent += `<span class="p01-group-count">(${group.count})</span>`;
        tbodyContent += `<span class="p01-group-total">${totalFormatted}</span>`;
        tbodyContent += '</div></td></tr>';
        if (isExpanded) { tbodyContent += renderRows(group.items as Record<string, unknown>[], { columns: self.columns, selectedIds }); }
      } else { tbodyContent += renderRows(group.items as Record<string, unknown>[], { columns: self.columns, selectedIds }); }
    });
    this.container.innerHTML = `<div class="p01-table-wrapper"><table class="p01-table p01-table--grouped" role="grid">${header}<tbody>${tbodyContent}</tbody></table></div>`;
  }

  _formatCurrency(value: unknown) { const num = parseFloat(String(value)) || 0; return `R$ ${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`; }

  renderVirtual(data: Record<string, unknown>) {
    if (!this.container) return;
    const items = data.items;
    const totalHeight = data.totalHeight;
    const offsetY = data.offsetY;
    if (!this._isVirtual) {
      const sort = {};
      const allSelected = false;
      const header = renderHeader({ columns: this.columns, sort, allSelected });
      this.container.innerHTML = `<div class="p01-table-wrapper p01-virtual-container"><div class="p01-virtual-spacer" style="height:${totalHeight}px"></div><table class="p01-table" role="grid">${header}<tbody class="p01-virtual-content"></tbody></table></div>`;
      this._tableEl = this.container.querySelector('.p01-table');
      this._tbodyEl = this.container.querySelector('tbody');
      this._isVirtual = true;
      this._bindEvents();
      this._initFeatures();
    }
    const spacer = this.container.querySelector('.p01-virtual-spacer');
    if (spacer) spacer.style.height = `${totalHeight}px`;
    if (this._tbodyEl) { this._tbodyEl.style.transform = `translateY(${offsetY}px)`; const rows = renderRows(items as Record<string, unknown>[], { columns: this.columns, selectedIds: new Set() }); this._tbodyEl.innerHTML = rows; }
    if (this._sticky) this._sticky.refresh();
  }

  destroy() {
    unbindTableEvents(this);
    if (this._dragDrop) this._dragDrop.destroy();
    if (this._resize) this._resize.destroy();
    if (this._sticky) this._sticky.remove();
    if (this._inlineEditor) this._inlineEditor.cancel();
    if (this._eventManager) this._eventManager.destroy();
    if (this._grouping) this._grouping.reset();
    if (this._sorting) this._sorting.reset();
    if (this._keyboard) this._keyboard.destroy();
    if (this._rowHoverMenu) this._rowHoverMenu.destroy();
    this._tableEl = null;
    this._tbodyEl = null;
    this._dragDrop = null;
    this._resize = null;
    this._sticky = null;
    this._eventManager = null;
    this._columnsManager = null;
    this._bulkEdit = null;
    this._tags = null;
    this._savedViews = null;
    this._badgeNew = null;
    this._summaryRow = null;
    this._highlightingRules = null;
    this._anomalyDetector = null;
    this._currentItems = [];
  }
}

mixinCoreAPI(TableComponent);
mixinExtendedAPI(TableComponent);
mixinUtilsAPI(TableComponent);

export { EXPAND_SVGS };
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default TableComponent;
