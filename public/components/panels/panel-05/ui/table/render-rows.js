import { ICONS } from "./constants.js";
import { escapeHtml } from "./utils.js";
import { formatCurrency, formatCNPJ } from "../../utils/dashboard-utils.js";
function createRowElement(ctx, item, idx, orderedCols) {
  const id = String(item.id);
  const isSelected = ctx._state.isSelected(id);
  const tr = document.createElement("tr");
  tr.className = `p05-tr-selectable p05-tr-expandable ${idx % 2 === 0 ? "p05-tr-even" : ""}${isSelected ? " p05-selected" : ""}`;
  tr.dataset.clienteId = id;
  tr.setAttribute("role", "row");
  tr.setAttribute("tabindex", "0");
  tr.setAttribute("aria-selected", String(isSelected));
  tr.innerHTML = renderRowCells(ctx, item, orderedCols);
  return tr;
}
function updateRowElement(ctx, row, item, idx, orderedCols) {
  const id = String(item.id);
  const isSelected = ctx._state.isSelected(id);
  row.classList.toggle("p05-tr-even", idx % 2 === 0);
  row.classList.toggle("p05-selected", isSelected);
  row.setAttribute("aria-selected", String(isSelected));
  const receitaCell = row.querySelector('[data-col="receita"]');
  if (receitaCell) {
    const newVal = formatCurrency(item.receita, { compact: true });
    if (receitaCell.textContent !== newVal) receitaCell.textContent = newVal;
  }
  const statusCell = row.querySelector('[data-col="status"] .p05-status-indicator');
  if (statusCell) {
    const newStatus = String(item.status || "N/A");
    const currentText = statusCell.textContent.trim();
    if (currentText !== newStatus) {
      const statusMap = { ativo: "p05-status-ativo", inativo: "p05-status-inativo", pendente: "p05-status-pendente", erro: "p05-status-erro" };
      const statusCls = statusMap[newStatus.toLowerCase()] || "";
      statusCell.className = `p05-status-indicator ${statusCls}`;
      statusCell.innerHTML = `<span class="p05-status-dot"></span>${escapeHtml(newStatus)}`;
    }
  }
  const starBtn = row.querySelector(".p05-btn-star");
  if (starBtn) starBtn.classList.toggle("p05-starred", ctx._state.isFavorito(id));
  const checkbox = row.querySelector(".p05-checkbox-row");
  if (checkbox) checkbox.checked = isSelected;
}
function renderRowCells(ctx, item, orderedCols) {
  const id = String(item.id);
  const isFav = ctx._state.isFavorito(id);
  const isSelected = ctx._state.isSelected(id);
  const isExpanded = ctx._state.isExpanded(id);
  const statusMap = { ativo: "p05-status-ativo", inativo: "p05-status-inativo", pendente: "p05-status-pendente", erro: "p05-status-erro" };
  const statusCls = item.status ? statusMap[String(item.status).toLowerCase()] || "" : "";
  const getPinClass = (colId) => {
    const pin = ctx._state.getColumnPin(colId);
    return pin === "left" ? "p05-pinned-left" : pin === "right" ? "p05-pinned-right" : "";
  };
  return orderedCols.map((col) => {
    switch (col.id) {
      case "expand":
        return `<td class="p05-td-expand" data-col="expand"><button class="p05-expand-btn ${isExpanded ? "p05-expanded" : ""}" data-action="toggle-expand" data-id="${id}" aria-label="Expandir">${ICONS.chevronRight}</button></td>`;
      case "checkbox":
        return `<td class="p05-td-checkbox" data-col="checkbox"><input type="checkbox" class="p05-checkbox p05-checkbox-row" data-id="${id}"${isSelected ? " checked" : ""}></td>`;
      case "fav":
        return `<td class="p05-td-fav ${getPinClass("fav")}" data-col="fav"><button class="p05-btn-star ${isFav ? "p05-starred" : ""}" data-action="toggle-favorito" data-id="${id}">${ICONS.star}</button></td>`;
      case "nome":
        return `<td class="p05-td-nome ${getPinClass("nome")}" data-col="nome"><span class="p05-cliente-nome">${escapeHtml(item.nome)}</span>${item.cnpj ? `<span class="p05-cliente-cnpj">${formatCNPJ(item.cnpj)}</span>` : ""}</td>`;
      case "cidade":
        return `<td class="p05-td-cidade ${getPinClass("cidade")}" data-col="cidade">${escapeHtml(item.cidade || "")}${item.uf ? `/${item.uf}` : ""}</td>`;
      case "receita":
        return `<td class="p05-td-receita ${getPinClass("receita")}" data-col="receita">${formatCurrency(item.receita, { compact: true })}</td>`;
      case "status":
        return `<td class="p05-td-status ${getPinClass("status")}" data-col="status"><span class="p05-status-indicator ${statusCls}"><span class="p05-status-dot"></span>${escapeHtml(item.status || "N/A")}</span></td>`;
      case "actions":
        return `<td class="p05-td-actions ${getPinClass("actions")}" data-col="actions"><button class="p05-btn-icon" data-action="view-cliente" data-id="${id}" title="Ver detalhes">${ICONS.eye}</button></td>`;
      default:
        return `<td data-col="${col.id}">\u2014</td>`;
    }
  }).join("");
}
var render_rows_default = { createRowElement, updateRowElement, renderRowCells };
const MODULE_ID = "panel-05-table-render-rows";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderRowsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  createRowElement,
  render_rows_default as default,
  healthCheck,
  info,
  renderRowCells,
  updateRowElement
};
