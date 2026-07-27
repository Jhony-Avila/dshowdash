import { store } from "../state/store.js";
import { buildGroups, deriveIcons } from "../core/transform.js";
import { fetchRealPanels } from "../core/panels-source.js";
const ADAPTER_URL = "../core/nav-data-adapter.js";
async function loadRealPanels(opts = {}) {
  const panels = await fetchRealPanels(opts);
  store.setRealPanels(panels);
}
async function loadData(opts = {}) {
  store.setLoading(true);
  try {
    const adapter = await import(ADAPTER_URL);
    const [itemsRes, sections] = await Promise.all([
      adapter.fetchItems(true, opts),
      adapter.fetchSections(opts)
    ]);
    const items = itemsRes && itemsRes.success && Array.isArray(itemsRes.data) ? itemsRes.data : [];
    const sectionList = Array.isArray(sections) ? sections : [];
    if (!itemsRes || itemsRes.success === false) {
      store.setError(itemsRes?.error || "Falha ao carregar itens da sidebar.");
      return;
    }
    store.setGroups(buildGroups(items, sectionList));
    store.setIcons(deriveIcons(items));
  } catch (err) {
    store.setError(err instanceof Error ? err.message : String(err));
  }
}
export {
  loadData,
  loadRealPanels
};
