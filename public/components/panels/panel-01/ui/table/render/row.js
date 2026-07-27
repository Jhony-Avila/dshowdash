import { COLUMNS } from "../constants.js";
import { formatSituacao, formatValor, formatDescricao, formatDataRequisicao, formatCentro, formatFornecedor } from "../formatters.js";
import { escapeHtml } from "../../../utils/formatters.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/render/row";
const EDITABLE_FIELDS = ["descricao", "observacao", "centro"];
function isEditable(fieldId) {
  return EDITABLE_FIELDS.indexOf(fieldId) !== -1;
}
function renderRow(item, index, options = {}) {
  const opts = options || {};
  const selectedIds = opts.selectedIds || /* @__PURE__ */ new Set();
  const columns = opts.columns || COLUMNS;
  const startIndex = opts.startIndex || 0;
  const showNewBadge = opts.showNewBadge || false;
  const isNew = opts.isNew || false;
  const id = item.id || item.Id_Requisicao;
  const isSelected = selectedIds.has(String(id));
  const visibleCols = columns.filter((c) => c.visible);
  const actualIndex = startIndex + index;
  const cells = visibleCols.map((col) => {
    const editable = isEditable(col.id) ? ' data-editable="true"' : "";
    const fieldAttr = ` data-field="${col.id}"`;
    const columnAttr = ` data-column="${col.id}"`;
    const baseAttrs = fieldAttr + columnAttr + editable;
    switch (col.id) {
      case "select":
        return `<td class="p01-td-select" data-column="select"><input type="checkbox" class="p01-row-checkbox" data-id="${id}"${isSelected ? " checked" : ""} aria-label="Selecionar"></td>`;
      case "id":
        return `<td class="p01-td-id"${fieldAttr}${columnAttr}>${id}</td>`;
      case "descricao":
        return `<td class="p01-td-desc"${baseAttrs}>${formatDescricao(item.descricao || item.Descricao_Requisicao)}</td>`;
      case "situacao":
        return `<td class="p01-td-situacao"${fieldAttr}${columnAttr}>${formatSituacao(item.id_situacao || item.Id_Situacao, item.situacao || item.Situacao)}</td>`;
      case "centro":
        return `<td class="p01-td-centro"${baseAttrs}>${formatCentro(item.centro_custo || item.Centro_De_Custo)}</td>`;
      case "fornecedor":
        return `<td class="p01-td-fornecedor"${fieldAttr}${columnAttr}>${formatFornecedor(item.fornecedor || item.Fornecedor)}</td>`;
      case "total":
        return `<td class="p01-td-total"${fieldAttr}${columnAttr}>${formatValor(item.total || item.Total)}</td>`;
      case "data":
        return `<td class="p01-td-data"${fieldAttr}${columnAttr}>${formatDataRequisicao(item.data_requisicao || item.Data_Requisicao)}</td>`;
      case "observacao":
        const obs = item.observacao || item.Observacao || "";
        return `<td class="p01-td-obs"${baseAttrs}>${escapeHtml(obs)}</td>`;
      case "actions":
        return `<td class="p01-td-actions" data-column="actions"><div class="p01-row-actions"><button class="p01-row-btn" data-action="view" data-id="${id}" title="Ver detalhes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="p01-row-btn" data-action="edit" data-id="${id}" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="p01-row-btn p01-row-btn--danger" data-action="delete" data-id="${id}" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></td>`;
      default:
        return `<td${fieldAttr}${columnAttr}>--</td>`;
    }
  }).join("");
  let rowClasses = "p01-row";
  if (isSelected) rowClasses += " p01-row--selected";
  if (isNew) rowClasses += " p01-row-new";
  const newIndicator = showNewBadge && isNew ? '<span class="p01-new-indicator" title="Novo"></span>' : "";
  return `<tr class="${rowClasses}" data-id="${id}" data-index="${actualIndex}" tabindex="0">${newIndicator}${cells}</tr>`;
}
function renderRows(items, options = {}) {
  if (!items || !items.length) return "";
  const opts = options || {};
  return items.map((item, idx) => renderRow(item, idx, opts)).join("");
}
function renderVirtualRows(items, startIndex, options = {}) {
  if (!items || !items.length) return "";
  const opts = Object.assign({}, options || {}, { startIndex });
  return items.map((item, idx) => renderRow(item, idx, opts)).join("");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var row_default = { renderRow, renderRows, renderVirtualRows };
export {
  MODULE_ID,
  VERSION,
  row_default as default,
  healthCheck,
  info,
  renderRow,
  renderRows,
  renderVirtualRows
};
