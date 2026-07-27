import { CSS_PREFIX } from "../core/constants.js";
function _escape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderEmptyState(message = "Nenhum bot\xE3o encontrado na sidebar.") {
  return `
    <div class="${CSS_PREFIX}-empty" role="status">
      <div class="${CSS_PREFIX}-empty__icon">\u25FB</div>
      <p class="${CSS_PREFIX}-empty__text">${_escape(message)}</p>
    </div>`;
}
function renderErrorState(message = "Falha ao carregar.") {
  return `
    <div class="${CSS_PREFIX}-error" role="alert">
      <div class="${CSS_PREFIX}-error__icon">\u26A0</div>
      <p class="${CSS_PREFIX}-error__text">${_escape(message)}</p>
    </div>`;
}
export {
  renderEmptyState,
  renderErrorState
};
