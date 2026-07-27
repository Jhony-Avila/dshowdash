const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/render/error";
function renderError(error, onRetry) {
  const message = typeof error === "string" ? error : error?.message || "Erro desconhecido";
  return `
    <div class="p01-error-state">
      <div class="p01-error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <h3 class="p01-error-title">Erro ao carregar dados</h3>
      <p class="p01-error-text">${message}</p>
      <button class="p01-btn p01-btn--primary" data-action="retry">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
        </svg>
        Tentar novamente
      </button>
    </div>
  `;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var error_default = { renderError };
export {
  MODULE_ID,
  VERSION,
  error_default as default,
  healthCheck,
  info,
  renderError
};
