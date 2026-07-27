const MODULE_ID = "panel-01.ui.table.render-flat";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderFlatTable(container, { columns, data, onRowClick }) {
  if (!container) return;
  const table = document.createElement("table");
  table.className = "table table-flat";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>${columns.map(
    (col) => `<th data-key="${col.key}" ${col.sortable ? 'class="sortable"' : ""}>${col.label}</th>`
  ).join("")}</tr>`;
  const tbody = document.createElement("tbody");
  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.dataset.index = String(index);
    tr.innerHTML = columns.map((col) => `<td>${row[col.key] ?? "-"}</td>`).join("");
    if (typeof onRowClick === "function") {
      tr.addEventListener("click", () => onRowClick(row, index));
    }
    tbody.appendChild(tr);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  container.innerHTML = "";
  container.appendChild(table);
}
var render_flat_default = { renderFlatTable };
export {
  MODULE_ID,
  VERSION,
  render_flat_default as default,
  renderFlatTable
};
