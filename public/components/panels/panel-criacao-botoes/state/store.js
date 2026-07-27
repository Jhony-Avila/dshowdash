function createInitialState() {
  return {
    groups: [],
    realPanels: [],
    icons: [],
    mode: "list",
    editing: null,
    loading: false,
    error: null
  };
}
class PanelCriacaoStore {
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
  setLoading(loading) {
    this.setState({ loading });
  }
  setError(error) {
    this.setState({ error, loading: false });
  }
  setGroups(groups) {
    this.setState({ groups, loading: false, error: null });
  }
  setRealPanels(realPanels) {
    this.setState({ realPanels });
  }
  setIcons(icons) {
    this.setState({ icons });
  }
  setMode(mode, editing = null) {
    this.setState({ mode, editing });
  }
  reset() {
    this._state = createInitialState();
    this._notify();
  }
  _notify() {
    for (const listener of this._listeners) {
      try {
        listener(this._state);
      } catch {
      }
    }
  }
}
const store = new PanelCriacaoStore();
export {
  PanelCriacaoStore,
  store
};
