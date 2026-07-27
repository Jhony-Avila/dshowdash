// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/api-helpers
// PURPOSE: Panel-01 Table - API Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   applyHelpersMixin() — exported function
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

import * as Helpers from './helpers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/api-helpers';

// Mixin para helpers da tabela
export const applyHelpersMixin = (TableComponent: { prototype: Record<string, unknown> }) => {
  const proto = TableComponent.prototype;

  // @ts-expect-error strict migration — TS2345
  proto.highlightRow = function(id: string | number, duration?: number) { Helpers.highlightRow(this.container, id, duration); };
  // @ts-expect-error strict migration — TS2345
  proto.scrollToRow = function(id: string | number, behavior?: ScrollBehavior) { Helpers.scrollToRow(this.container, id, behavior); };
  // @ts-expect-error strict migration — TS2345
  proto.focusRow = function(id: string | number) { Helpers.focusRow(this.container, id); };
  // @ts-expect-error strict migration — TS2345
  proto.getRowById = function(id: string | number) { return Helpers.getRowById(this.container, id); };
  // @ts-expect-error strict migration — TS2345
  proto.getAllRows = function() { return Helpers.getAllRows(this.container); };
  // @ts-expect-error strict migration — TS2345
  proto.getSelectedRows = function() { return Helpers.getSelectedRows(this.container); };
  // @ts-expect-error strict migration — TS2345
  proto.getVisibleRows = function() { return Helpers.getVisibleRows(this.container); };
  // @ts-expect-error strict migration — TS2345
  proto.getNextRow = function(currentId: string | number) { return Helpers.getNextRow(this.container, currentId); };
  // @ts-expect-error strict migration — TS2345
  proto.getPrevRow = function(currentId: string | number) { return Helpers.getPrevRow(this.container, currentId); };
  // @ts-expect-error strict migration — TS2345
  proto.getFirstRow = function() { return Helpers.getFirstRow(this.container); };
  // @ts-expect-error strict migration — TS2345
  proto.getLastRow = function() { return Helpers.getLastRow(this.container); };
  // @ts-expect-error strict migration — TS2345
  proto.setRowState = function(id: string | number, state: Record<string, boolean>) { Helpers.setRowState(this.container, id, state); };

  proto.updateRow = function(id: string | number, data: Record<string, unknown>) {
    // @ts-expect-error strict migration — TS2571
    const row = this.getRowById(id);
    if (row && data) {
      Object.keys(data).forEach(field => {
        const cell = row.querySelector(`td[data-field="${field}"]`);
        if (cell) cell.textContent = data[field];
      });
    }
  };
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });
