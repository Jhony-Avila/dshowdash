const MODULE_ID = "panel-12.ui.component";
const VERSION = "9.3.0-P2-ENTERPRISE";
function initComponent(container, config = {}) {
  if (!container) {
    console.error("[panel-12] Container not found");
    return null;
  }
  const state = {
    initialized: false,
    loading: false,
    data: null,
    error: null
  };
  const render = () => {
    if (state.loading) {
      container.innerHTML = '<div class="panel-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    } else if (state.error) {
      container.innerHTML = `<div class="panel-error">${state.error}</div>`;
    } else if (state.data) {
      container.innerHTML = `<div class="panel-12-content">${renderData(state.data)}</div>`;
    } else {
      container.innerHTML = '<div class="panel-empty">Sem dados</div>';
    }
  };
  const renderData = (data) => `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  state.initialized = true;
  render();
  return {
    setData: (d) => {
      state.data = d;
      render();
    },
    setLoading: (l) => {
      state.loading = l;
      render();
    },
    setError: (e) => {
      state.error = e;
      render();
    },
    refresh: () => render()
  };
}
var component_default = { initComponent };
export {
  MODULE_ID,
  VERSION,
  component_default as default,
  initComponent
};
