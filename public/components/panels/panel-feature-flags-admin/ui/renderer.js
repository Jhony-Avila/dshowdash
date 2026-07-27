const MODULE_ID = "panel-feature-flags-admin/ui/renderer";
const VERSION = "9.3.0-P2-ENTERPRISE";
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("pt-BR");
}
function renderFlagCard(flag) {
  const isActive = flag.is_enabled;
  return `
    <div class="pfa-flag-card ${isActive ? "pfa-flag-card--active" : "pfa-flag-card--inactive"}" data-flag="${flag.flag_key}">
      <div class="pfa-flag-header">
        <div class="pfa-flag-info">
          <span class="pfa-flag-name">${flag.flag_name || flag.flag_key}</span>
          <code class="pfa-flag-key">${flag.flag_key}</code>
        </div>
        <label class="pfa-toggle-switch">
          <input type="checkbox" data-action="toggle" data-flag="${flag.flag_key}" ${isActive ? "checked" : ""}>
          <span class="pfa-slider"></span>
        </label>
      </div>
      ${flag.description ? `<p class="pfa-flag-description">${flag.description}</p>` : ""}
      <div class="pfa-flag-meta">
        <span class="pfa-badge pfa-badge--${flag.environment || "all"}">${flag.environment || "all"}</span>
        <span class="pfa-rollout">Rollout: ${flag.rollout_percentage ?? 100}%</span>
        ${flag.starts_at ? `<span class="pfa-date">In\xEDcio: ${formatDate(flag.starts_at)}</span>` : ""}
        ${flag.ends_at ? `<span class="pfa-date">Fim: ${formatDate(flag.ends_at)}</span>` : ""}
      </div>
      <div class="pfa-flag-actions">
        <button data-action="edit" data-flag="${flag.flag_key}" class="pfa-btn pfa-btn--sm">Editar</button>
        <button data-action="delete" data-flag="${flag.flag_key}" class="pfa-btn pfa-btn--sm pfa-btn--danger">Remover</button>
      </div>
    </div>
  `;
}
function renderFlags(flags) {
  if (!flags || flags.length === 0) return renderEmpty();
  return `<div class="pfa-flags-grid">${flags.map((f) => renderFlagCard(f)).join("")}</div>`;
}
function renderLoading() {
  return `
    <div class="pfa-loading">
      <div class="pfa-loading-spinner"></div>
      <span>Carregando flags...</span>
    </div>
  `;
}
function renderError(message) {
  return `
    <div class="pfa-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
      <span>${message || "Erro ao carregar dados"}</span>
    </div>
  `;
}
function renderEmpty() {
  return `
    <div class="pfa-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
        <line x1="4" y1="22" x2="4" y2="15"/>
      </svg>
      <span>Nenhum flag encontrado</span>
    </div>
  `;
}
var renderer_default = { renderFlagCard, renderFlags, renderLoading, renderError, renderEmpty, formatDate };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  formatDate,
  renderEmpty,
  renderError,
  renderFlagCard,
  renderFlags,
  renderLoading
};
