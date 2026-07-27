import { CSS_PREFIX, DATA_ATTRS } from "../core/constants.js";
import { store } from "../state/store.js";
import { loadPanels, togglePanelActive, savePanelChanges, applyFilter, loadScreenshotHistory, reSortPanels } from "./data.js";
import { handleScreenshotRequest } from "./screenshot.js";
import { getModalFormData, renderScreenshotHistory } from "../ui/modal/panel-detail-modal.js";
import { openScreenshotViewer } from "../ui/modal/screenshot-viewer.js";
import { createSearchDebounce } from "../ui/filters/search-input.js";
import { syncFiltersToURL } from "../state/filters.js";
import { openCustomSelect, closeCustomSelect } from "../ui/custom-select.js";
import { getSavedSort, saveSort } from "../ui/filters/filter-bar.js";
let _container = null;
let _abortController = null;
let _searchDebounce = null;
function setupEventListeners(container, abortController) {
  _container = container;
  _abortController = abortController;
  const signal = abortController.signal;
  _searchDebounce = createSearchDebounce((value) => {
    applyFilter({ search: value });
    syncFiltersToURL(store.getState().filters);
    loadPanels(signal);
  });
  container.addEventListener("click", _handleClick, { signal });
  container.addEventListener("input", _handleInput, { signal });
  document.addEventListener("keydown", _handleKeydown, { signal });
}
function _handleClick(e) {
  const target = e.target;
  const actionEl = target.closest(`[${DATA_ATTRS.action}]`);
  if (!actionEl) {
    const card = target.closest(`.${CSS_PREFIX}-card`);
    if (card && !target.closest("button") && !target.closest("a")) {
      const panelId2 = card.getAttribute(DATA_ATTRS.panelId);
      if (panelId2) _openDetailModal(panelId2);
    }
    return;
  }
  const action = actionEl.getAttribute(DATA_ATTRS.action);
  const panelId = actionEl.getAttribute(DATA_ATTRS.panelId) || "";
  const signal = _abortController?.signal;
  switch (action) {
    case "toggle-active":
      e.stopPropagation();
      togglePanelActive(panelId, signal);
      break;
    case "screenshot":
      e.stopPropagation();
      handleScreenshotRequest(panelId, signal);
      break;
    case "modal-screenshot":
      handleScreenshotRequest(panelId, signal);
      break;
    case "modal-toggle":
      togglePanelActive(panelId, signal);
      break;
    case "save-panel":
      _saveFromModal(panelId, signal);
      break;
    case "close-modal":
      if (target === actionEl || target.closest(`.${CSS_PREFIX}-modal__close`) || target.classList.contains(`${CSS_PREFIX}-modal-overlay`)) {
        store.closeModal();
      }
      break;
    case "clear-filters":
      applyFilter({ category: null, status: "all", search: "" });
      syncFiltersToURL(store.getState().filters);
      _updateSearchInput("");
      closeCustomSelect();
      loadPanels(signal);
      break;
    case "export-panels":
      _exportPanelsJSON();
      break;
    case "remove-tag":
      _removeTag(actionEl.getAttribute("data-tag") || "");
      break;
    case "view-screenshot": {
      const panel = store.getState().selectedPanel;
      if (panel?.thumbnail_url) {
        openScreenshotViewer(panel.thumbnail_url, panel.title);
      }
      break;
    }
    case "open-category-select":
      e.stopPropagation();
      _openCategoryDropdown(actionEl);
      break;
    case "open-status-select":
      e.stopPropagation();
      _openStatusDropdown(actionEl);
      break;
    case "open-panel": {
      e.stopPropagation();
      const route = actionEl.getAttribute("data-panel-route");
      if (route) {
        window.location.hash = route.startsWith("/") ? route : `/${route}`;
      }
      break;
    }
    case "open-sort-select":
      e.stopPropagation();
      _openSortDropdown(actionEl);
      break;
    case "load-screenshot-history":
      _loadScreenshotHistoryInModal(actionEl);
      break;
  }
}
function _openCategoryDropdown(trigger) {
  const state = store.getState();
  const categories = state.categories;
  const signal = _abortController?.signal;
  const options = [
    { value: "", label: "Todas categorias" },
    ...categories.map((c) => ({
      value: c.category,
      label: `${c.category} (${c.total})`
    }))
  ];
  openCustomSelect({
    anchor: trigger,
    options,
    value: state.filters.category || "",
    searchable: categories.length > 5,
    searchPlaceholder: "Buscar categoria...",
    width: 220,
    onSelect(value) {
      applyFilter({ category: value || null });
      syncFiltersToURL(store.getState().filters);
      loadPanels(signal);
    }
  });
}
function _openStatusDropdown(trigger) {
  const state = store.getState();
  const signal = _abortController?.signal;
  const options = [
    { value: "all", label: "Todos", color: "#64748b" },
    { value: "active", label: "Ativos", color: "#34d399" },
    { value: "inactive", label: "Inativos", color: "#f87171" }
  ];
  openCustomSelect({
    anchor: trigger,
    options,
    value: state.filters.status,
    searchable: false,
    width: 180,
    onSelect(value) {
      applyFilter({ status: value });
      syncFiltersToURL(store.getState().filters);
      loadPanels(signal);
    }
  });
}
function _openSortDropdown(trigger) {
  const currentSort = getSavedSort();
  const signal = _abortController?.signal;
  const sortOptions = [
    { field: "title", label: "Nome (A-Z)" },
    { field: "category", label: "Categoria" },
    { field: "last_screenshot_at", label: "Data do Screenshot" },
    { field: "is_active", label: "Status" }
  ];
  const options = sortOptions.map((o) => ({
    value: `${o.field}`,
    label: o.label
  }));
  openCustomSelect({
    anchor: trigger,
    options,
    value: currentSort.field,
    searchable: false,
    width: 200,
    onSelect(value) {
      const field = value;
      let order = "asc";
      if (currentSort.field === field) {
        order = currentSort.order === "asc" ? "desc" : "asc";
      } else if (field === "last_screenshot_at") {
        order = "desc";
      }
      const newSort = { field, order };
      saveSort(newSort);
      reSortPanels();
    }
  });
}
async function _loadScreenshotHistoryInModal(el) {
  const panelId = el.getAttribute(DATA_ATTRS.panelId);
  if (!panelId) return;
  if (el.getAttribute("data-loaded") === "true") return;
  el.setAttribute("data-loaded", "true");
  const signal = _abortController?.signal;
  const screenshots = await loadScreenshotHistory(panelId, signal);
  el.innerHTML = renderScreenshotHistory(screenshots);
}
function _handleInput(e) {
  const target = e.target;
  const action = target.getAttribute(DATA_ATTRS.action);
  if (action === "search" && _searchDebounce) {
    _searchDebounce(target.value);
  }
}
function _handleKeydown(e) {
  if (e.key === "Escape" && store.getState().modalOpen) {
    store.closeModal();
  }
}
function _openDetailModal(panelId) {
  const panel = store.getState().panels.find((p) => p.panel_id === panelId);
  if (panel) {
    store.selectPanel(panel);
  }
}
async function _saveFromModal(panelId, signal) {
  if (!_container) return;
  const changes = getModalFormData(_container);
  const success = await savePanelChanges(panelId, changes, signal);
  if (success) {
    store.closeModal();
  }
}
function _removeTag(tag) {
  const panel = store.getState().selectedPanel;
  if (!panel) return;
  const tags = (panel.tags || []).filter((t) => t !== tag);
  store.updatePanelInList(panel.panel_id, { tags });
  store.selectPanel({ ...panel, tags });
}
function _exportPanelsJSON() {
  const state = store.getState();
  const panels = state.panels;
  if (panels.length === 0) return;
  const exportData = {
    exported_at: (/* @__PURE__ */ new Date()).toISOString(),
    total: panels.length,
    filters: state.filters,
    panels: panels.map((p) => ({
      panel_id: p.panel_id,
      title: p.title,
      description: p.description,
      category: p.category,
      is_active: p.is_active,
      version: p.version,
      author: p.author,
      route: p.route,
      tags: p.tags,
      sort_order: p.sort_order,
      thumbnail_url: p.thumbnail_url,
      last_screenshot_at: p.last_screenshot_at,
      created_at: p.created_at,
      updated_at: p.updated_at
    }))
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `paineis_export_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function _updateSearchInput(value) {
  if (!_container) return;
  const input = _container.querySelector(`.${CSS_PREFIX}-search-input`);
  if (input) input.value = value;
}
function _handleTagInput(e) {
  if (e.key !== "Enter") return;
  const input = e.target;
  const tag = input.value.trim();
  if (!tag) return;
  const panel = store.getState().selectedPanel;
  if (!panel) return;
  const tags = [...panel.tags || [], tag];
  store.updatePanelInList(panel.panel_id, { tags });
  store.selectPanel({ ...panel, tags });
  input.value = "";
}
function setupTagInput(container, signal) {
  container.addEventListener("keydown", (e) => {
    if (e.target.getAttribute(DATA_ATTRS.action) === "add-tag") {
      _handleTagInput(e);
    }
  }, { signal });
}
function cleanupEventListeners() {
  closeCustomSelect();
  _container = null;
  _abortController = null;
  _searchDebounce = null;
}
export {
  cleanupEventListeners,
  setupEventListeners,
  setupTagInput
};
