import { CSS_PREFIX } from "../core/constants.js";
function renderEmptyState(hasFilters) {
  const icon = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`;
  const message = hasFilters ? "Nenhum painel encontrado com os filtros atuais" : "Nenhum painel registrado";
  const clearBtn = hasFilters ? `<button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--clear" data-action="clear-filters">Limpar filtros</button>` : "";
  return `
    <div class="${CSS_PREFIX}-empty-state">
      ${icon}
      <p>${message}</p>
      ${clearBtn}
    </div>`;
}
function renderErrorState(message) {
  return `
    <div class="${CSS_PREFIX}-error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error, #f87171)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>${message}</p>
      <button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--primary" data-action="retry">Tentar novamente</button>
    </div>`;
}
export {
  renderEmptyState,
  renderErrorState
};
