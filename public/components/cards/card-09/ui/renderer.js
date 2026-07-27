const VERSION = "8.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-09.ui.renderer";
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
  <span class="sr-only">Carregando total de execu\xE7\xF5es...</span>`;
const renderCard = () => `
  <div class="card-header">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
    <span>Total</span>
  </div>
  <div class="card-body">
    <div class="card-value" data-el="count">--</div>
    <div class="card-label">Execu\xE7\xF5es totais</div>
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
const healthCheck = () => ({
  status: "HEALTHY",
  moduleId: MODULE_ID,
  version: VERSION,
  timestamp: Date.now()
});
const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  exports: ["renderSkeleton", "renderCard", "renderError"],
  timestamp: Date.now()
});
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
