const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-health-dashboard-store";
const initialState = {
  loading: false,
  error: null,
  snapshot: null,
  lastUpdate: null,
  selectedModule: null,
  expandedCategories: ["core", "components", "panels"]
};
let _state = { ...initialState };
const _listeners = /* @__PURE__ */ new Set();
const Store = {
  getState: () => ({ ..._state }),
  setState: (partial) => {
    _state = { ..._state, ...partial };
    _listeners.forEach((fn) => {
      try {
        fn(_state);
      } catch (e) {
      }
    });
  },
  subscribe: (fn) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
  reset: () => {
    _state = { ...initialState };
    _listeners.forEach((fn) => {
      try {
        fn(_state);
      } catch (e) {
      }
    });
  }
};
const actions = {
  setLoading: (loading) => Store.setState({ loading }),
  setError: (error) => Store.setState({ error }),
  setSnapshot: (snapshot) => Store.setState({ snapshot, lastUpdate: Date.now() }),
  setSelectedModule: (module) => Store.setState({ selectedModule: module }),
  toggleCategory: (category) => {
    const expanded = [..._state.expandedCategories];
    const idx = expanded.indexOf(category);
    if (idx >= 0) expanded.splice(idx, 1);
    else expanded.push(category);
    Store.setState({ expandedCategories: expanded });
  }
};
const selectors = {
  isLoading: () => _state.loading,
  getError: () => _state.error,
  getSnapshot: () => _state.snapshot,
  getLastUpdate: () => _state.lastUpdate,
  getSelectedModule: () => _state.selectedModule,
  isExpanded: (category) => _state.expandedCategories.includes(category)
};
var store_default = Store;
export {
  MODULE_ID,
  Store,
  VERSION,
  actions,
  store_default as default,
  selectors
};
