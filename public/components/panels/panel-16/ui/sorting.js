import { COLUMN_TYPES } from "./constants.js";
function sortData(data, sortColumns) {
  if (!sortColumns || sortColumns.length === 0) return;
  data.sort((a, b) => {
    for (const { column, direction } of sortColumns) {
      const dir = direction === "asc" ? 1 : -1;
      let va = a[column] ?? "", vb = b[column] ?? "";
      const colType = COLUMN_TYPES[column];
      if (colType?.type === "currency" || colType?.type === "number" || ["total_pago", "qtd_requisicoes"].includes(column)) {
        const diff = (parseFloat(va) || 0) - (parseFloat(vb) || 0);
        if (diff !== 0) return diff * dir;
      } else {
        const cmp = String(va).localeCompare(String(vb), "pt-BR");
        if (cmp !== 0) return cmp * dir;
      }
    }
    return 0;
  });
}
function handleSort(sortColumns, column, addToSort = false) {
  const existingIdx = sortColumns.findIndex((s) => s.column === column);
  if (addToSort) {
    if (existingIdx >= 0) {
      sortColumns[existingIdx].direction = sortColumns[existingIdx].direction === "asc" ? "desc" : "asc";
    } else if (sortColumns.length < 3) {
      sortColumns.push({ column, direction: "asc" });
    }
  } else {
    if (existingIdx >= 0 && sortColumns.length === 1) {
      sortColumns[0].direction = sortColumns[0].direction === "asc" ? "desc" : "asc";
    } else {
      sortColumns.length = 0;
      sortColumns.push({ column, direction: "asc" });
    }
  }
  return sortColumns;
}
var sorting_default = { sortData, handleSort };
const MODULE_ID = "panels-panel-16-ui-sorting";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { sortingReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  sorting_default as default,
  handleSort,
  healthCheck,
  info,
  sortData
};
