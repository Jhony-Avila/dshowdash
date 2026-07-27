// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:batch-edit
// PURPOSE: Table Engine - Batch Edit
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderBatchEditModal() — exported function
//   collectBatchChanges() — exported function
//   applyBatchChanges() — exported function
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
export const MODULE_ID = 'table-engine:batch-edit';

const BE_SVGS = {
  close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

export function renderBatchEditModal(selectedRows: Record<string, unknown>[], columns: Record<string, unknown>[], options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const editableColumns = columns.filter(c => c.editable !== false);
  const fieldsHtml = editableColumns.map(col => `<div class="${p}batch-edit-field"><label class="${p}batch-edit-label"><input type="checkbox" class="${p}batch-field-toggle" data-col="${col.id}" /><span>${col.label || col.id}</span></label><div class="${p}batch-edit-input-wrapper ${p}disabled">${renderBatchInput(col, opts)}</div></div>`).join('');
  return `<div class="${p}batch-edit-modal"><div class="${p}batch-edit-header"><h3 class="${p}batch-edit-title">Editar ${selectedRows.length} registro(s)</h3><button class="${p}batch-edit-close" data-action="close-batch-edit">${BE_SVGS.close}</button></div><div class="${p}batch-edit-body"><p class="${p}batch-edit-info">Selecione os campos que deseja alterar. Apenas campos marcados serão atualizados.</p><div class="${p}batch-edit-fields">${fieldsHtml}</div></div><div class="${p}batch-edit-footer"><button class="${p}batch-btn ${p}batch-btn-cancel" data-action="cancel-batch-edit">Cancelar</button><button class="${p}batch-btn ${p}batch-btn-apply" data-action="apply-batch-edit">Aplicar a ${selectedRows.length} registro(s)</button></div></div>`;
}

function renderBatchInput(column: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const type = column.type || 'text';
  if (column.options) {
    const optsHtml = (column.options as Array<Record<string, unknown> | string>).map((opt: Record<string, unknown> | string) => {
      const val = typeof opt === 'object' ? opt.value : opt;
      const label = typeof opt === 'object' ? opt.label : opt;
      return `<option value="${val}">${label}</option>`;
    }).join('');
    return `<select class="${p}batch-input" data-col="${column.id}" disabled><option value="">Selecione...</option>${optsHtml}</select>`;
  }
  if (['boolean', 'bool'].indexOf(type as string) >= 0) {
    return `<select class="${p}batch-input" data-col="${column.id}" disabled><option value="">Selecione...</option><option value="true">Sim</option><option value="false">Não</option></select>`;
  }
  if (['date', 'datetime'].indexOf(type as string) >= 0) {
    return `<input type="date" class="${p}batch-input" data-col="${column.id}" disabled />`;
  }
  if (['number', 'currency', 'percent'].indexOf(type as string) >= 0) {
    return `<input type="number" class="${p}batch-input" data-col="${column.id}" step="any" disabled />`;
  }
  return `<input type="text" class="${p}batch-input" data-col="${column.id}" placeholder="Novo valor..." disabled />`;
}

export function collectBatchChanges(modalElement: HTMLElement, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const changes: Record<string, unknown> = {};
  const checkedFields = modalElement.querySelectorAll(`.${p}batch-field-toggle:checked`);
  checkedFields.forEach(checkbox => {
    const colId = (checkbox as HTMLElement).dataset.col;
    const input = modalElement.querySelector(`.${p}batch-input[data-col="${colId}"]`);
    if (input) (changes as Record<string, unknown>)[colId as string] = (input as HTMLInputElement).value;
  });
  return changes;
}

export function applyBatchChanges(data: Record<string, unknown>[], selectedIds: string[], changes: Record<string, unknown>) {
  return data.map(row => {
    if (selectedIds.indexOf(String(row.id)) >= 0) {
      return Object.assign({}, row, changes, { _dirty: true });
    }
    return row;
  });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderBatchEditModal, collectBatchChanges, applyBatchChanges, info, healthCheck, VERSION, MODULE_ID };
