const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:row-operations";
const RO_SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
function createNewRow(columns, options) {
  const opts = options || {};
  const row = { id: opts.generateId ? opts.generateId() : `new-${Date.now()}`, _isNew: true, _dirty: true };
  columns.forEach((col) => {
    if (col.default !== void 0) {
      row[col.id] = typeof col.default === "function" ? col.default() : col.default;
    } else {
      row[col.id] = getDefaultForType(col.type);
    }
  });
  return row;
}
function getDefaultForType(type) {
  if (type === "number" || type === "currency" || type === "percent") return 0;
  if (type === "boolean" || type === "bool") return false;
  if (type === "date" || type === "datetime") return null;
  if (type === "array" || type === "tags") return [];
  return "";
}
function renderAddRowButton(options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  return `<div class="${p}add-row-container"><button class="${p}add-row-btn" data-action="add-row" title="Adicionar novo registro"><span class="${p}add-row-icon">+</span><span class="${p}add-row-label">${opts.addLabel || "Adicionar registro"}</span></button></div>`;
}
function renderInlineAddRow(columns, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  let cells = "";
  if (opts.selectable !== false) cells += `<td class="${p}td ${p}td-checkbox"></td>`;
  columns.forEach((col) => {
    if (col.editable === false) {
      cells += `<td class="${p}td ${p}td-new"></td>`;
      return;
    }
    cells += `<td class="${p}td ${p}td-new" data-col="${col.id}">${renderNewRowInput(col, opts)}</td>`;
  });
  cells += `<td class="${p}td ${p}td-new-actions"><button class="${p}new-row-save" data-action="save-new-row" title="Salvar">${RO_SVGS.check}</button><button class="${p}new-row-cancel" data-action="cancel-new-row" title="Cancelar">${RO_SVGS.x}</button></td>`;
  return `<tr class="${p}tr ${p}tr-new">${cells}</tr>`;
}
function renderNewRowInput(column, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const type = column.type || "text";
  if (column.options) {
    const optsHtml = column.options.map((opt) => {
      const val = typeof opt === "object" ? opt.value : opt;
      const label = typeof opt === "object" ? opt.label : opt;
      return `<option value="${val}">${label}</option>`;
    }).join("");
    return `<select class="${p}new-input" data-col="${column.id}"><option value="">Selecione...</option>${optsHtml}</select>`;
  }
  if (["boolean", "bool"].indexOf(type) >= 0) return `<input type="checkbox" class="${p}new-input" data-col="${column.id}" />`;
  if (["date", "datetime"].indexOf(type) >= 0) return `<input type="date" class="${p}new-input" data-col="${column.id}" />`;
  if (["number", "currency", "percent"].indexOf(type) >= 0) return `<input type="number" class="${p}new-input" data-col="${column.id}" step="any" placeholder="0" />`;
  return `<input type="text" class="${p}new-input" data-col="${column.id}" placeholder="${column.placeholder || ""}" />`;
}
function renderDeleteConfirmation(rowsToDelete, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const count = Array.isArray(rowsToDelete) ? rowsToDelete.length : 1;
  return `<div class="${p}delete-confirm-modal"><div class="${p}delete-confirm-content"><div class="${p}delete-confirm-icon">\u{1F5D1}\uFE0F</div><h3 class="${p}delete-confirm-title">Confirmar exclus\xE3o</h3><p class="${p}delete-confirm-message">Voc\xEA est\xE1 prestes a excluir <strong>${count}</strong> registro${count > 1 ? "s" : ""}. Esta a\xE7\xE3o n\xE3o pode ser desfeita.</p><div class="${p}delete-confirm-buttons"><button class="${p}delete-cancel" data-action="cancel-delete">Cancelar</button><button class="${p}delete-confirm" data-action="confirm-delete">Excluir</button></div></div></div>`;
}
function deleteRows(data, idsToDelete) {
  const idsSet = new Set(idsToDelete.map(String));
  return data.filter((row) => !idsSet.has(String(row.id)));
}
function addRow(data, newRow, position) {
  if (position === "start") return [newRow].concat(data);
  return data.concat([newRow]);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var row_operations_default = { createNewRow, renderAddRowButton, renderInlineAddRow, renderDeleteConfirmation, deleteRows, addRow, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addRow,
  createNewRow,
  row_operations_default as default,
  deleteRows,
  healthCheck,
  info,
  renderAddRowButton,
  renderDeleteConfirmation,
  renderInlineAddRow
};
