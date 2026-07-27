const MODULE_ID = "panel-orchestrator-manager.handlers.ui-actions";
const VERSION = "9.3.0-P2-ENTERPRISE";
function handleRefresh(state, render) {
  state.setLoading(true);
  render();
}
function handleFilterChange(state, key, value, render) {
  state.setFilter(key, value);
  render();
}
function handleSort(state, column, render) {
  const current = state.getSortConfig();
  const direction = current.column === column && current.direction === "asc" ? "desc" : "asc";
  state.setSortConfig({ column, direction });
  render();
}
function handleSelection(state, item, render) {
  state.toggleSelection(item);
  render();
}
function handleBulkAction(state, action, render) {
  const selected = state.getSelected();
  if (selected.length === 0) return;
  state.executeBulkAction(action, selected);
  render();
}
var ui_actions_default = { handleRefresh, handleFilterChange, handleSort, handleSelection, handleBulkAction };
function showModal(...args) {
}
function confirmDelete(...args) {
}
function closeAllModals(...args) {
}
export {
  MODULE_ID,
  VERSION,
  closeAllModals,
  confirmDelete,
  ui_actions_default as default,
  handleBulkAction,
  handleFilterChange,
  handleRefresh,
  handleSelection,
  handleSort,
  showModal
};
