// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:row-operations
// PURPOSE: Table Engine - Row Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createNewRow() — exported function
//   renderAddRowButton() — exported function
//   renderInlineAddRow() — exported function
//   renderDeleteConfirmation() — exported function
//   deleteRows() — exported function
//   addRow() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:row-operations';

const RO_SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

export function createNewRow(columns: Record<string, unknown>[], options: Record<string, unknown>) {
  const opts = options || {};
  const row: Record<string, unknown> = { id: opts.generateId ? (opts.generateId as () => string)() : `new-${Date.now()}`, _isNew: true, _dirty: true };
  columns.forEach(col => {
    if (col.default !== undefined) { row[col.id as string] = typeof col.default === 'function' ? (col.default as () => unknown)() : col.default; }
    else { row[col.id as string] = getDefaultForType(col.type); }
  });
  return row;
}

function getDefaultForType(type: unknown): unknown {
  if (type === 'number' || type === 'currency' || type === 'percent') return 0;
  if (type === 'boolean' || type === 'bool') return false;
  if (type === 'date' || type === 'datetime') return null;
  if (type === 'array' || type === 'tags') return [];
  return '';
}

export function renderAddRowButton(options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  return `<div class="${p}add-row-container"><button class="${p}add-row-btn" data-action="add-row" title="Adicionar novo registro"><span class="${p}add-row-icon">+</span><span class="${p}add-row-label">${opts.addLabel || 'Adicionar registro'}</span></button></div>`;
}

export function renderInlineAddRow(columns: Record<string, unknown>[], options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  let cells = '';
  if (opts.selectable !== false) cells += `<td class="${p}td ${p}td-checkbox"></td>`;
  columns.forEach(col => {
    if (col.editable === false) { cells += `<td class="${p}td ${p}td-new"></td>`; return; }
    cells += `<td class="${p}td ${p}td-new" data-col="${col.id}">${renderNewRowInput(col, opts)}</td>`;
  });
  cells += `<td class="${p}td ${p}td-new-actions"><button class="${p}new-row-save" data-action="save-new-row" title="Salvar">${RO_SVGS.check}</button><button class="${p}new-row-cancel" data-action="cancel-new-row" title="Cancelar">${RO_SVGS.x}</button></td>`;
  return `<tr class="${p}tr ${p}tr-new">${cells}</tr>`;
}

function renderNewRowInput(column: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const type = column.type || 'text';
  if (column.options) {
    const optsHtml = (column.options as Array<Record<string, unknown> | string>).map((opt: Record<string, unknown> | string) => {
      const val = typeof opt === 'object' ? opt.value : opt;
      const label = typeof opt === 'object' ? opt.label : opt;
      return `<option value="${val}">${label}</option>`;
    }).join('');
    return `<select class="${p}new-input" data-col="${column.id}"><option value="">Selecione...</option>${optsHtml}</select>`;
  }
  if (['boolean', 'bool'].indexOf(type as string) >= 0) return `<input type="checkbox" class="${p}new-input" data-col="${column.id}" />`;
  if (['date', 'datetime'].indexOf(type as string) >= 0) return `<input type="date" class="${p}new-input" data-col="${column.id}" />`;
  if (['number', 'currency', 'percent'].indexOf(type as string) >= 0) return `<input type="number" class="${p}new-input" data-col="${column.id}" step="any" placeholder="0" />`;
  return `<input type="text" class="${p}new-input" data-col="${column.id}" placeholder="${column.placeholder || ''}" />`;
}

export function renderDeleteConfirmation(rowsToDelete: unknown[] | unknown, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const count = Array.isArray(rowsToDelete) ? rowsToDelete.length : 1;
  return `<div class="${p}delete-confirm-modal"><div class="${p}delete-confirm-content"><div class="${p}delete-confirm-icon">🗑️</div><h3 class="${p}delete-confirm-title">Confirmar exclusão</h3><p class="${p}delete-confirm-message">Você está prestes a excluir <strong>${count}</strong> registro${count > 1 ? 's' : ''}. Esta ação não pode ser desfeita.</p><div class="${p}delete-confirm-buttons"><button class="${p}delete-cancel" data-action="cancel-delete">Cancelar</button><button class="${p}delete-confirm" data-action="confirm-delete">Excluir</button></div></div></div>`;
}

export function deleteRows(data: Record<string, unknown>[], idsToDelete: (string | number)[]) {
  const idsSet = new Set(idsToDelete.map(String));
  return data.filter(row => !idsSet.has(String(row.id)));
}

export function addRow(data: Record<string, unknown>[], newRow: Record<string, unknown>, position: string) {
  if (position === 'start') return [newRow].concat(data);
  return data.concat([newRow]);
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { createNewRow, renderAddRowButton, renderInlineAddRow, renderDeleteConfirmation, deleteRows, addRow, info, healthCheck, VERSION, MODULE_ID };
