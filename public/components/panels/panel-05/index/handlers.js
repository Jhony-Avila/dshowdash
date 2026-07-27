import { store } from "../state/store.js";
import { _refs, toggleFavorito, toggleSelection, selectAll, clearSelection, setCurrentView } from "./state.js";
import { updateFavorito, updateSelection } from "../renderer/table.js";
import { refresh as manualRefresh } from "../scheduler/refresh.js";
function handleClick(e, loadClientes, loadCliente360, loadAllData) {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  switch (action) {
    case "refresh":
      manualRefresh();
      break;
    case "view":
      if (id) loadCliente360(id);
      break;
    case "back":
      store.clearCliente360();
      break;
    case "sort":
      const field = target.dataset.sort;
      if (field) {
        store.setSort(field);
        loadClientes();
      }
      break;
    case "page":
      const page = parseInt(target.dataset.page);
      if (page && !isNaN(page)) {
        store.setPage(page);
        loadClientes();
      }
      break;
    case "toggle-fav":
      if (id) toggleFavorito(id, updateFavorito);
      break;
    case "retry":
      store.clearError();
      loadAllData();
      break;
    case "view-change":
      const view = target.dataset.view;
      if (view) setView(view);
      break;
  }
}
function handleChange(e, loadClientes) {
  const target = e.target;
  if (target.dataset.filter) {
    const filters = {};
    filters[target.dataset.filter] = target.value;
    store.setFilters(filters);
    loadClientes();
  }
  if (target.classList.contains("p05-checkbox-all")) {
    const clientes = store.get("clientes") || [];
    if (target.checked) selectAll(clientes.map((c) => c.Id_Organizacao || c.id), updateSelection);
    else clearSelection(updateSelection);
  }
  if (target.classList.contains("p05-row-checkbox")) {
    const tr = target.closest("tr");
    if (tr?.dataset.id) toggleSelection(tr.dataset.id, updateSelection);
  }
}
function handleInput(e, loadClientes) {
  const target = e.target;
  if (target.dataset.action === "search" || target.classList.contains("p05-search-input")) {
    clearTimeout(handleInput._timer);
    handleInput._timer = setTimeout(() => {
      store.setFilters({ search: target.value });
      loadClientes();
    }, 300);
  }
}
function setView(view) {
  setCurrentView(view);
  _refs?.panel && _refs.panel?.querySelectorAll('[data-action="view-change"]').forEach((btn) => {
    btn.classList.toggle("p05-active", btn.dataset.view === view);
  });
  if (_refs?.chartsArea) _refs.chartsArea.style.display = view === "charts" ? "block" : "none";
  if (_refs?.tableContainer) _refs.tableContainer.parentElement.style.display = view === "list" ? "block" : "none";
  if (_refs?.pagination) _refs.pagination.style.display = view === "list" ? "flex" : "none";
}
var handlers_default = { handleClick, handleChange, handleInput, setView };
const MODULE_ID = "panel-05:index:handlers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { handlersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  handlers_default as default,
  handleChange,
  handleClick,
  handleInput,
  healthCheck,
  info,
  setView
};
