const MODULE_ID = "panel-16.ui.render.table";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderTable(container, { columns, data, onRowClick, onSort }) {
  if (!container) return;
  const thead = columns.map(
    (col) => `<th data-key="${col.key}" class="${col.sortable ? "sortable" : ""}">${col.label}</th>`
  ).join("");
  const tbody = data.map((row, i) => `
        <tr data-index="${i}">
            ${columns.map((col) => `<td>${row[col.key] ?? "-"}</td>`).join("")}
        </tr>
    `).join("");
  container.innerHTML = `
        <table class="data-table">
            <thead><tr>${thead}</tr></thead>
            <tbody>${tbody}</tbody>
        </table>
    `;
  if (onSort) {
    container.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", () => onSort(th.dataset.key ?? ""));
    });
  }
  if (onRowClick) {
    container.querySelectorAll("tbody tr").forEach((tr) => {
      tr.addEventListener("click", () => onRowClick(data[parseInt(tr.dataset.index ?? "0")], tr.dataset.index ?? ""));
    });
  }
}
function renderEmpty(hasFilters) {
  return `
        <div class="p16-empty-state">
            <i class="fas ${hasFilters ? "fa-filter" : "fa-inbox"}"></i>
            <p>${hasFilters ? "Nenhum resultado encontrado para os filtros aplicados." : "Nenhum fornecedor encontrado."}</p>
        </div>
    `;
}
var table_default = { renderTable, renderEmpty };
export {
  MODULE_ID,
  VERSION,
  table_default as default,
  renderEmpty,
  renderTable
};
