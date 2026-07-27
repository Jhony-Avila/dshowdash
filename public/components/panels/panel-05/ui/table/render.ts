// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:render
// PURPOSE: Panel-05 Table Render - Enterprise Modular
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, DENSITY_MODES from ./render-constants.js
//   renderShell from ./render-shell.js
//   updateTableBody, diffUpdateRows from ./render-body.js
//   createRowElement, updateRowElement, renderRowCells from ./render-rows.js
//   updateFooter, renderPagination from ./render-footer.js
//   renderSearchBox, renderExportButton, renderBulkActionsBar from ./render-toolb...
//   renderDensityToggle, renderScrollModeToggle, renderColumnToggle from ./render...
//   renderTableHeaderByCol, renderSkeleton from ./render-header.js
//
// PROVIDES:
//   RenderMixin — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

import { DENSITY_MODES } from './render-constants.js';
// VERSION and MODULE_ID declared locally below
import { renderShell } from './render-shell.js';
import { updateTableBody, diffUpdateRows } from './render-body.js';
import { createRowElement, updateRowElement, renderRowCells } from './render-rows.js';
import { updateFooter, renderPagination } from './render-footer.js';
import { renderSearchBox, renderExportButton, renderBulkActionsBar } from './render-toolbar.js';
import { renderDensityToggle, renderScrollModeToggle, renderColumnToggle } from './render-controls.js';
import { renderTableHeaderByCol, renderSkeleton } from './render-header.js';

export const RenderMixin = {
  render() {
    // @ts-expect-error strict migration — TS2339
    if (!this._container) return '';
    this._renderShell();
    this._updateTableBody();
    this._updateFooter();
    // @ts-expect-error strict migration — TS2339
    this._applyHiddenColumns();
    // @ts-expect-error strict migration — TS2339
    this._applyPinnedColumns();
    // @ts-expect-error strict migration — TS2339
    this._setDensity(this._state.density);
    // @ts-expect-error strict migration — TS2339
    this._updateBulkBar();
    // @ts-expect-error strict migration — TS2339
    this._updateCheckboxes();
    // @ts-expect-error strict migration — TS2339
    this._updateSearchInfo();
  },

  // @ts-expect-error strict migration — TS2345
  _renderShell() { renderShell(this); },
  // @ts-expect-error strict migration — TS2345
  _updateTableBody() { updateTableBody(this); },
  // @ts-expect-error strict migration — TS2345
  _diffUpdateRows(tbody: HTMLElement, newData: Array<Record<string, unknown>>, startIdx: number, orderedCols: Array<Record<string, unknown>>, topRow: HTMLElement, bottomRow: HTMLElement) { diffUpdateRows(this, tbody, newData, startIdx, orderedCols, topRow, bottomRow); },
  // @ts-expect-error strict migration — TS2345
  _createRowElement(item: Record<string, unknown>, idx: number, orderedCols: Array<Record<string, unknown>>) { return createRowElement(this, item, idx, orderedCols); },
  // @ts-expect-error strict migration — TS2345
  _updateRowElement(row: HTMLElement, item: Record<string, unknown>, idx: number, orderedCols: Array<Record<string, unknown>>) { updateRowElement(this, row, item, idx, orderedCols); },
  // @ts-expect-error strict migration — TS2345
  _renderRowCells(item: Record<string, unknown>, orderedCols: Array<Record<string, unknown>>) { return renderRowCells(this, item, orderedCols); },
  // @ts-expect-error strict migration — TS2345
  _updateFooter() { updateFooter(this); },
  _renderPagination(page: number, total: number, count: number) { return renderPagination(page, total, count); },
  // @ts-expect-error strict migration — TS2345
  _renderSearchBox() { return renderSearchBox(this); },
  // @ts-expect-error strict migration — TS2345
  _renderExportButton() { return renderExportButton(this); },
  // @ts-expect-error strict migration — TS2345
  _renderBulkActionsBar() { return renderBulkActionsBar(this); },
  // @ts-expect-error strict migration — TS2345
  _renderDensityToggle() { return renderDensityToggle(this); },
  // @ts-expect-error strict migration — TS2345
  _renderScrollModeToggle() { return renderScrollModeToggle(this); },
  // @ts-expect-error strict migration — TS2345
  _renderColumnToggle() { return renderColumnToggle(this); },
  // @ts-expect-error strict migration — TS2345
  _renderTableHeaderByCol(col: Record<string, unknown>) { return renderTableHeaderByCol(this, col); },
  renderSkeleton() { return renderSkeleton(); },

  _setDensity(mode: string) {
    if (!DENSITY_MODES.includes(mode)) return;
    // @ts-expect-error strict migration — TS2339
    this._state.setDensity(mode);
    // @ts-expect-error strict migration — TS2339
    const table = this._container.querySelector('.p05-table');
    if (table) {
      DENSITY_MODES.forEach(d => table.classList.remove(`p05-density-${d}`));
      table.classList.add(`p05-density-${mode}`);
    }
    // @ts-expect-error strict migration — TS2339
    this._container.querySelectorAll('.p05-density-btn').forEach((btn: Element) => {
      btn.classList.toggle('p05-active', (btn as HTMLElement).dataset.density === mode);
    });
    // @ts-expect-error strict migration — TS2339
    if (this._state.scrollMode === 'virtual') this._updateVirtualRows();
  }
};

export const MODULE_ID = 'panel-05:table:render';
export const VERSION = '9.3.0-P2-ENTERPRISE';

(RenderMixin as any).VERSION = VERSION;
(RenderMixin as any).MODULE_ID = MODULE_ID;

export default RenderMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderReady: true } }; }
