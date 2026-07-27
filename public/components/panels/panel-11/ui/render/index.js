const MODULE_ID = "panel-11.ui.render";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderPanel(container, state) {
  if (!container) return;
  const { loading, error, data } = state;
  if (loading) {
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
    return;
  }
  if (error) {
    container.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i> ${error}</div>`;
    return;
  }
  if (!data || Array.isArray(data) && data.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i> Nenhum dado dispon\xEDvel</div>';
    return;
  }
  container.innerHTML = `<div class="panel-11-data">${renderData(data)}</div>`;
}
function renderData(data) {
  return Array.isArray(data) ? data.map((item) => `<div class="data-item">${JSON.stringify(item)}</div>`).join("") : JSON.stringify(data);
}
const renderConsole = renderPanel;
const renderError = renderPanel;
var render_default = { renderPanel, renderConsole, renderError };
export {
  MODULE_ID,
  VERSION,
  render_default as default,
  renderConsole,
  renderError,
  renderPanel
};
