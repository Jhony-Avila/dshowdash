// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/api-utils
// PURPOSE: Panel-01 Table - Utils API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   mixinUtilsAPI() — exported function
//   info() — exported function
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

import * as Helpers from './helpers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/api-utils';

// Mixin para adicionar API utils à TableComponent
export function mixinUtilsAPI(TableComponent: { prototype: Record<string, unknown> }) {
  const proto = TableComponent.prototype;

  proto.highlightRow = function(id: string | number, duration?: number) {
    // @ts-expect-error strict migration — TS2345
    Helpers.highlightRow(this.container, id, duration);
  };

  proto.scrollToRow = function(id: string | number, behavior?: ScrollBehavior) {
    // @ts-expect-error strict migration — TS2345
    Helpers.scrollToRow(this.container, id, behavior);
  };

  proto.focusRow = function(id: string | number) {
    // @ts-expect-error strict migration — TS2345
    Helpers.focusRow(this.container, id);
  };

  proto.getRowById = function(id: string | number) {
    // @ts-expect-error strict migration — TS2345
    return Helpers.getRowById(this.container, id);
  };

  proto.getAllRows = function() {
    // @ts-expect-error strict migration — TS2345
    return Helpers.getAllRows(this.container);
  };

  proto.getSelectedRows = function() {
    // @ts-expect-error strict migration — TS2345
    return Helpers.getSelectedRows(this.container);
  };

  proto.getVisibleRows = function() {
    // @ts-expect-error strict migration — TS2345
    return Helpers.getVisibleRows(this.container);
  };

  proto.getNextRow = function(currentId: string | number) {
    // @ts-expect-error strict migration — TS2345
    return Helpers.getNextRow(this.container, currentId);
  };

  proto.getPrevRow = function(currentId: string | number) {
    // @ts-expect-error strict migration — TS2345
    return Helpers.getPrevRow(this.container, currentId);
  };

  proto.getFirstRow = function() {
    // @ts-expect-error strict migration — TS2345
    return Helpers.getFirstRow(this.container);
  };

  proto.getLastRow = function() {
    // @ts-expect-error strict migration — TS2345
    return Helpers.getLastRow(this.container);
  };

  proto.setRowState = function(id: string | number, state: Record<string, boolean>) {
    // @ts-expect-error strict migration — TS2345
    Helpers.setRowState(this.container, id, state);
  };

  proto.updateRow = function(id: string | number, data: Record<string, unknown>) {
    // @ts-expect-error strict migration — TS2571
    const row = this.getRowById(id);
    if (row && data) {
      Object.keys(data).forEach(field => {
        const cell = (row as Element).querySelector(`td[data-field="${field}"]`);
        if (cell) cell.textContent = String(data[field] ?? '');
      });
    }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { mixinUtilsAPI };
