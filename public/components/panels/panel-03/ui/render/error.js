function renderError(message) {
  return `
    <div class="p03-error-state" role="alert">
      <svg class="p03-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="p03-error-message">${message || "Erro ao carregar dados"}</p>
      <button class="p03-retry-btn" data-action="retry">Tentar novamente</button>
    </div>
  `;
}
var error_default = { renderError };
const MODULE_ID = "panel-03/ui/render/error";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  error_default as default,
  healthCheck,
  info,
  renderError
};
