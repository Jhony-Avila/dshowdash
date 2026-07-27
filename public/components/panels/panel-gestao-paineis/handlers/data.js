import { store } from "../state/store.js";
import { fetchPanels, fetchCategories, updatePanel, fetchScreenshotHistory } from "../services/api-client.js";
import { getSavedSort } from "../ui/filters/filter-bar.js";
function sortPanels(panels, config) {
  const sorted = [...panels];
  const dir = config.order === "asc" ? 1 : -1;
  sorted.sort((a, b) => {
    switch (config.field) {
      case "title":
        return dir * (a.title || "").localeCompare(b.title || "", "pt-BR", { sensitivity: "base" });
      case "category":
        return dir * (a.category || "").localeCompare(b.category || "", "pt-BR", { sensitivity: "base" });
      case "last_screenshot_at": {
        const ta = a.last_screenshot_at ? new Date(a.last_screenshot_at).getTime() : 0;
        const tb = b.last_screenshot_at ? new Date(b.last_screenshot_at).getTime() : 0;
        return dir * (ta - tb);
      }
      case "is_active": {
        const sa = a.is_active ? 1 : 0;
        const sb = b.is_active ? 1 : 0;
        return dir * (sa - sb);
      }
      default:
        return 0;
    }
  });
  return sorted;
}
async function loadPanels(signal) {
  const { filters, pagination } = store.getState();
  store.setLoading(true);
  try {
    const result = await fetchPanels(filters, pagination, signal);
    if (result.ok) {
      const meta = result.meta;
      const sortConfig = getSavedSort();
      const sortedPanels = sortPanels(result.data, sortConfig);
      store.setPanels(sortedPanels, meta ? {
        total: meta.total ?? 0,
        page: meta.page ?? 1,
        per_page: meta.per_page ?? 50,
        total_pages: meta.total_pages ?? 1
      } : void 0);
    } else {
      store.setError(result.error || "Erro ao carregar pain\xE9is");
    }
  } catch (err) {
    if (err?.name === "AbortError") return;
    store.setError(err instanceof Error ? err.message : "Erro de rede");
  }
}
async function loadCategories(signal) {
  try {
    const result = await fetchCategories(signal);
    if (result.ok) {
      store.setCategories(result.data);
    }
  } catch (_) {
  }
}
async function loadScreenshotHistory(panelId, signal) {
  try {
    const result = await fetchScreenshotHistory(panelId, signal);
    if (result.ok) {
      return result.data;
    }
  } catch (_) {
  }
  return [];
}
async function togglePanelActive(panelId, signal) {
  const panel = store.getState().panels.find((p) => p.panel_id === panelId);
  if (!panel) return;
  const newActive = !panel.is_active;
  try {
    const result = await updatePanel(panelId, { is_active: newActive }, signal);
    if (result.ok) {
      store.updatePanelInList(panelId, { is_active: newActive });
    }
  } catch (err) {
    console.error("[panel-gestao-paineis] Toggle failed:", err);
  }
}
async function savePanelChanges(panelId, changes, signal) {
  try {
    const result = await updatePanel(panelId, changes, signal);
    if (result.ok) {
      store.updatePanelInList(panelId, changes);
      return true;
    }
    return false;
  } catch (err) {
    console.error("[panel-gestao-paineis] Save failed:", err);
    return false;
  }
}
function applyFilter(partial) {
  store.setFilters(partial);
}
function changePage(page) {
  store.setPage(page);
}
function reSortPanels() {
  const { panels } = store.getState();
  const sortConfig = getSavedSort();
  const sorted = sortPanels(panels, sortConfig);
  store.setState({ panels: sorted });
}
export {
  applyFilter,
  changePage,
  loadCategories,
  loadPanels,
  loadScreenshotHistory,
  reSortPanels,
  savePanelChanges,
  togglePanelActive
};
