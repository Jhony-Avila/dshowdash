// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:handlers:dialogs
// PURPOSE: Panel-01 - Dialog Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   showBulkEditDialog() — exported function
//   showImportDialog() — exported function
//   showSaveViewDialog() — exported function
//   showTagDialog() — exported function
//   healthCheck() — exported function
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

import { store } from '../state/store.js';
import * as Toast from '../ui/toast.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:handlers:dialogs';

export function showBulkEditDialog(ctx: Record<string, unknown>) {
  const selected = ctx.selection ? (ctx.selection as Record<string, () => unknown[]>).getSelected() : [];
  if (selected.length === 0) {
    Toast.warning('Selecione itens primeiro');
    return;
  }
  if (ctx.bulkEdit) (ctx.bulkEdit as Record<string, (...args: unknown[]) => void>).setSelection(selected);
  Toast.info(`Bulk edit: ${selected.length} itens selecionados`);
}

export function showImportDialog(ctx: Record<string, unknown>) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.xlsx,.xls';
  input.onchange = e => {
    const file = (e.target as any).files[0];
    if (file && ctx.importManager) (ctx.importManager as Record<string, (...args: unknown[]) => void>).importFile(file);
  };
  input.click();
}

export function showSaveViewDialog(ctx: Record<string, unknown>) {
  const name = prompt('Nome da view:');
  if (!name) return;
  const state = store.getState();
  const config = { filters: state.filters, sort: state.sort, density: ctx.density };
  if (ctx.savedViews) (ctx.savedViews as Record<string, (...args: unknown[]) => void>).create(name, config);
  Toast.success(`View salva: ${name}`);
}

export function showTagDialog(ctx: Record<string, unknown>, itemId: string | number) {
  const tagName = prompt('Nome da tag:');
  if (!tagName || !ctx.tags) return;
  const tags = ctx.tags as Record<string, (...args: unknown[]) => Record<string, unknown>>;
  const tag = tags.createTag(tagName);
  tags.addTagToItem(itemId, tag.id);
  Toast.success('Tag adicionada');
}

export function healthCheck() {
  const checks = { storeAvailable: !!store, toastAvailable: !!Toast };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export default { showBulkEditDialog, showImportDialog, showSaveViewDialog, showTagDialog, healthCheck, info, VERSION, MODULE_ID };
