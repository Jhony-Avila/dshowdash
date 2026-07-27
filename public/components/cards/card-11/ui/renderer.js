const VERSION = "8.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-11.ui.renderer";
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function renderSkeleton() {
  return '<div class="card-header skeleton-header"><div class="skeleton skeleton-header-icon"></div><div class="skeleton skeleton-header-text"></div></div><div class="card-body"><div class="skeleton skeleton-value"></div><div class="skeleton skeleton-label"></div></div><span class="sr-only">Carregando tempo m\xE9dio...</span>';
}
function renderCard() {
  return '<div class="card-header"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg><span>Tempo M\xE9dio</span></div><div class="card-body"><div class="card-value" data-el="time">--</div><div class="card-label">Dura\xE7\xE3o m\xE9dia</div></div><div class="card-status" data-el="status" role="status" aria-live="polite"></div>';
}
function renderError(message) {
  return '<div class="card-error-state"><svg viewBox="0 0 24 24" class="error-icon-small"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="error-text">' + escapeHtml(message) + "</span></div>";
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["renderSkeleton", "renderCard", "renderError"], timestamp: Date.now() };
}
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
