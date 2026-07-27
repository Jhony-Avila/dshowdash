const VERSION = "8.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-02.ui.renderer";
const escapeHtml = (text) => {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};
const renderSkeleton = () => `
  <div class="card-header skeleton-header">
    <div class="skeleton skeleton-header-icon"></div>
    <div class="skeleton skeleton-header-text"></div>
  </div>
  <div class="card-body">
    <div class="skeleton skeleton-value"></div>
    <div class="skeleton skeleton-label"></div>
  </div>
  <span class="sr-only">Carregando taxa global...</span>`;
const renderCard = () => `
  <div class="card-header">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>Taxa Global</span>
  </div>
  <div class="card-body">
    <div class="card-value" data-el="percent">--</div>
    <div class="card-label">Todos os jobs ativos</div>
  </div>
  <div class="card-status" data-el="status" role="status" aria-live="polite"></div>`;
const renderError = (message) => `
  <div class="card-error-state">
    <svg viewBox="0 0 24 24" class="error-icon-small">
      <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>
      <path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <span class="error-text">${escapeHtml(message)}</span>
  </div>`;
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
const info = () => ({ moduleId: MODULE_ID, version: VERSION, exports: ["renderSkeleton", "renderCard", "renderError"], timestamp: Date.now() });
var renderer_default = { renderSkeleton, renderCard, renderError };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info,
  renderCard,
  renderError,
  renderSkeleton
};
