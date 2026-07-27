const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/helpers";
function getRowById(container, id) {
  return container?.querySelector(`.p01-row[data-id="${id}"]`);
}
function getAllRows(container) {
  return container?.querySelectorAll(".p01-row") || [];
}
function getSelectedRows(container) {
  return container?.querySelectorAll(".p01-row--selected") || [];
}
function getVisibleRows(container) {
  return container?.querySelectorAll(".p01-row:not([hidden])") || [];
}
function highlightRow(container, id, duration = 2e3) {
  const row = getRowById(container, id);
  if (!row) return;
  row.classList.add("p01-row--highlight");
  setTimeout(() => row.classList.remove("p01-row--highlight"), duration);
}
function scrollToRow(container, id, behavior = "smooth") {
  const row = getRowById(container, id);
  if (row) {
    row.scrollIntoView({ behavior, block: "center" });
  }
}
function focusRow(container, id) {
  const row = getRowById(container, id);
  if (row) row.focus();
}
function getNextRow(container, currentId) {
  const rows = Array.from(getAllRows(container));
  const idx = rows.findIndex((r) => r.dataset.id === String(currentId));
  return rows[idx + 1]?.dataset.id || null;
}
function getPrevRow(container, currentId) {
  const rows = Array.from(getAllRows(container));
  const idx = rows.findIndex((r) => r.dataset.id === String(currentId));
  return rows[idx - 1]?.dataset.id || null;
}
function getFirstRow(container) {
  const row = container?.querySelector(".p01-row");
  return row?.dataset.id || null;
}
function getLastRow(container) {
  const rows = Array.from(getAllRows(container));
  return rows[rows.length - 1]?.dataset.id || null;
}
function setRowState(container, id, state) {
  const row = getRowById(container, id);
  if (!row) return;
  Object.entries(state).forEach(([key, value]) => {
    if (value) {
      row.classList.add(`p01-row--${key}`);
    } else {
      row.classList.remove(`p01-row--${key}`);
    }
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var helpers_default = { getRowById, getAllRows, getSelectedRows, getVisibleRows, highlightRow, scrollToRow, focusRow, getNextRow, getPrevRow, getFirstRow, getLastRow, setRowState };
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  focusRow,
  getAllRows,
  getFirstRow,
  getLastRow,
  getNextRow,
  getPrevRow,
  getRowById,
  getSelectedRows,
  getVisibleRows,
  healthCheck,
  highlightRow,
  info,
  scrollToRow,
  setRowState
};
