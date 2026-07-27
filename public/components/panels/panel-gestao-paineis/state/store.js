import { DEFAULT_PER_PAGE } from "../core/constants.js";
function createInitialState() {
  return {
    panels: [],
    categories: [],
    filters: {
      category: null,
      status: "all",
      search: ""
    },
    pagination: {
      page: 1,
      per_page: DEFAULT_PER_PAGE,
      total: 0,
      total_pages: 0
    },
    loading: false,
    error: null,
    selectedPanel: null,
    modalOpen: false,
    pendingScreenshots: /* @__PURE__ */ new Map()
  };
}
class PanelGestaoStore {
  _state;
  _listeners = /* @__PURE__ */ new Set();
  constructor() {
    this._state = createInitialState();
  }
  getState() {
    return this._state;
  }
  setState(partial) {
    this._state = { ...this._state, ...partial };
    this._notify();
  }
  subscribe(listener) {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }
  setPanels(panels, meta) {
    const update = { panels, loading: false, error: null };
    if (meta) {
      update.pagination = { ...this._state.pagination, ...meta };
    }
    this.setState(update);
  }
  setCategories(categories) {
    this.setState({ categories });
  }
  setFilters(filters) {
    this.setState({
      filters: { ...this._state.filters, ...filters },
      pagination: { ...this._state.pagination, page: 1 }
    });
  }
  setPage(page) {
    this.setState({
      pagination: { ...this._state.pagination, page }
    });
  }
  setLoading(loading) {
    this.setState({ loading });
  }
  setError(error) {
    this.setState({ error, loading: false });
  }
  selectPanel(panel) {
    this.setState({ selectedPanel: panel, modalOpen: panel !== null });
  }
  closeModal() {
    this.setState({ selectedPanel: null, modalOpen: false });
  }
  updatePanelInList(panelId, updates) {
    const panels = this._state.panels.map(
      (p) => p.panel_id === panelId ? { ...p, ...updates } : p
    );
    const selectedPanel = this._state.selectedPanel?.panel_id === panelId ? { ...this._state.selectedPanel, ...updates } : this._state.selectedPanel;
    this.setState({ panels, selectedPanel });
  }
  addPendingScreenshot(panelId, request) {
    const pending = new Map(this._state.pendingScreenshots);
    pending.set(panelId, request);
    this.setState({ pendingScreenshots: pending });
  }
  removePendingScreenshot(panelId) {
    const pending = new Map(this._state.pendingScreenshots);
    pending.delete(panelId);
    this.setState({ pendingScreenshots: pending });
  }
  reset() {
    this._state = createInitialState();
    this._listeners.clear();
  }
  _notify() {
    const state = this._state;
    this._listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (_) {
      }
    });
  }
}
const store = new PanelGestaoStore();
export {
  store
};
