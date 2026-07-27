const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:batch-edit";
const BE_SVGS = {
  close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
function renderBatchEditModal(selectedRows, columns, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const editableColumns = columns.filter((c) => c.editable !== false);
  const fieldsHtml = editableColumns.map((col) => `<div class="${p}batch-edit-field"><label class="${p}batch-edit-label"><input type="checkbox" class="${p}batch-field-toggle" data-col="${col.id}" /><span>${col.label || col.id}</span></label><div class="${p}batch-edit-input-wrapper ${p}disabled">${renderBatchInput(col, opts)}</div></div>`).join("");
  return `<div class="${p}batch-edit-modal"><div class="${p}batch-edit-header"><h3 class="${p}batch-edit-title">Editar ${selectedRows.length} registro(s)</h3><button class="${p}batch-edit-close" data-action="close-batch-edit">${BE_SVGS.close}</button></div><div class="${p}batch-edit-body"><p class="${p}batch-edit-info">Selecione os campos que deseja alterar. Apenas campos marcados ser\xE3o atualizados.</p><div class="${p}batch-edit-fields">${fieldsHtml}</div></div><div class="${p}batch-edit-footer"><button class="${p}batch-btn ${p}batch-btn-cancel" data-action="cancel-batch-edit">Cancelar</button><button class="${p}batch-btn ${p}batch-btn-apply" data-action="apply-batch-edit">Aplicar a ${selectedRows.length} registro(s)</button></div></div>`;
}
function renderBatchInput(column, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const type = column.type || "text";
  if (column.options) {
    const optsHtml = column.options.map((opt) => {
      const val = typeof opt === "object" ? opt.value : opt;
      const label = typeof opt === "object" ? opt.label : opt;
      return `<option value="${val}">${label}</option>`;
    }).join("");
    return `<select class="${p}batch-input" data-col="${column.id}" disabled><option value="">Selecione...</option>${optsHtml}</select>`;
  }
  if (["boolean", "bool"].indexOf(type) >= 0) {
    return `<select class="${p}batch-input" data-col="${column.id}" disabled><option value="">Selecione...</option><option value="true">Sim</option><option value="false">N\xE3o</option></select>`;
  }
  if (["date", "datetime"].indexOf(type) >= 0) {
    return `<input type="date" class="${p}batch-input" data-col="${column.id}" disabled />`;
  }
  if (["number", "currency", "percent"].indexOf(type) >= 0) {
    return `<input type="number" class="${p}batch-input" data-col="${column.id}" step="any" disabled />`;
  }
  return `<input type="text" class="${p}batch-input" data-col="${column.id}" placeholder="Novo valor..." disabled />`;
}
function collectBatchChanges(modalElement, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const changes = {};
  const checkedFields = modalElement.querySelectorAll(`.${p}batch-field-toggle:checked`);
  checkedFields.forEach((checkbox) => {
    const colId = checkbox.dataset.col;
    const input = modalElement.querySelector(`.${p}batch-input[data-col="${colId}"]`);
    if (input) changes[colId] = input.value;
  });
  return changes;
}
function applyBatchChanges(data, selectedIds, changes) {
  return data.map((row) => {
    if (selectedIds.indexOf(String(row.id)) >= 0) {
      return Object.assign({}, row, changes, { _dirty: true });
    }
    return row;
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var batch_edit_default = { renderBatchEditModal, collectBatchChanges, applyBatchChanges, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  applyBatchChanges,
  collectBatchChanges,
  batch_edit_default as default,
  healthCheck,
  info,
  renderBatchEditModal
};
