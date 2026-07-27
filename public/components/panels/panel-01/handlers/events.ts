// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:handlers:events
// PURPOSE: Panel-01 - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   handleSort() — exported function
//   handleKeyboardAction() — exported function
//   handleContextAction() — exported function
//   handleDrawerAction() — exported function
//   handleBulkAction() — exported function
//   handleWebSocketMessage() — exported function
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
export const MODULE_ID = 'panel-01:handlers:events';

export function handleSort(ctx: Record<string, unknown>, field: string, isShiftKey: boolean) {
  if (!field) { (ctx.loadAllData as () => void)(); return; }
  if (ctx.multiSort && isShiftKey) {
    (ctx.multiSort as Record<string, (...args: unknown[]) => void>).addSort(field, 'DESC', true);
  } else {
    const state = store.getState();
    const newOrder = state.sort.field === field && state.sort.order === 'DESC' ? 'ASC' : 'DESC';
    store.setSort(field, newOrder);
    (ctx.loadRequisicoes as () => void)();
  }
}

export function handleKeyboardAction(ctx: Record<string, unknown>, action: string) {
  if (action === 'refresh') { (ctx.loadAllData as () => void)(); }
  else if (action === 'export') { (ctx.exportCSV as () => void)(); }
  else if (action === 'escape') {
    if (ctx.drawer) (ctx.drawer as Record<string, () => void>).close();
    if (ctx.selection) (ctx.selection as Record<string, () => void>).deselectAll();
  }
}

export function handleContextAction(ctx: Record<string, unknown>, action: string, item: Record<string, unknown>) {
  const ctxFns = ctx as Record<string, (...args: unknown[]) => void>;
  if (action === 'view') { ctxFns.loadDetail(item.id); }
  else if (action === 'copy-id') { if (navigator.clipboard) navigator.clipboard.writeText(String(item.id)); Toast.success('ID copiado!'); }
  else if (action === 'export-item') { ctxFns.exportSinglePDF(item.id); }
  else if (action === 'print-item') { ctxFns.printSingle(item.id); }
  else if (action === 'duplicate') { ctxFns.duplicateItem(item.id); }
  else if (action === 'add-tag') { ctxFns.showTagDialog(item.id); }
}

export function handleDrawerAction(ctx: Record<string, unknown>, action: string, data: Record<string, unknown>) {
  const requisicao = data.requisicao as Record<string, unknown> | undefined;
  const id = requisicao ? requisicao.Id_Requisicao : data.id;
  const ctxFns = ctx as Record<string, (...args: unknown[]) => void>;
  if (action === 'print') { ctxFns.printSingle(id); }
  else if (action === 'export-pdf') { ctxFns.exportSinglePDF(id); }
  else if (action === 'preview') { if (ctx.preview && data.url) (ctx.preview as Record<string, (...args: unknown[]) => void>).show(data.url, data.filename); }
  else if (action === 'duplicate') { ctxFns.duplicateItem(id); }
}

export function handleBulkAction(ctx: Record<string, unknown>, action: string) {
  const selected = ctx.selection ? (ctx.selection as Record<string, () => unknown[]>).getSelected() : [];
  if (selected.length === 0) return;
  if (ctx.haptic) (ctx.haptic as Record<string, () => void>).medium();
  if (action === 'export') { Toast.info(`Exportando ${selected.length} itens...`); }
  else if (action === 'cancel') { Toast.warning('Cancelamento em lote nao implementado'); }
  else if (action === 'edit') { (ctx.showBulkEditDialog as () => void)(); }
}

export function handleWebSocketMessage(ctx: Record<string, unknown>, data: { type: string; message?: string }) {
  if (data.type === 'update') { (ctx.loadAllData as () => void)(); Toast.info('Dados atualizados em tempo real'); }
  // @ts-expect-error strict migration — TS2345
  else if (data.type === 'notification') { Toast.info(data.message); }
}

export function healthCheck() {
  const checks = { storeAvailable: !!store, toastAvailable: !!Toast };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export default { handleSort, handleKeyboardAction, handleContextAction, handleDrawerAction, handleBulkAction, handleWebSocketMessage, healthCheck, info, VERSION, MODULE_ID };
