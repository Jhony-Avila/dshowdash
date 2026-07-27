const MODULE_ID = "panel-06.ui.component";
const VERSION = "9.3.0-P2-ENTERPRISE";
function initComponent(container, options = {}) {
  if (!container) {
    console.error("[panel-06] Container not found");
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
      container.innerHTML = '<div class="loading-spinner"></div>';
    } else if (state.error) {
      container.innerHTML = `<div class="error-message">${state.error}</div>`;
    } else if (state.data) {
      container.innerHTML = renderContent(state.data);
    }
  };
  const renderContent = (data) => `<div class="panel-06-content">${JSON.stringify(data)}</div>`;
  state.initialized = true;
  render();
  return {
    setData: (data) => {
      state.data = data;
      render();
    },
    setLoading: (loading) => {
      state.loading = loading;
      render();
    },
    setError: (error) => {
      state.error = error;
      render();
    },
    getState: () => ({ ...state })
  };
}
var component_default = { initComponent };
export {
  MODULE_ID,
  VERSION,
  component_default as default,
  initComponent
};
