import { CSS_PREFIX } from "../../core/constants.js";
function renderStatusBadge(isActive) {
  const cls = isActive ? `${CSS_PREFIX}-badge--active` : `${CSS_PREFIX}-badge--inactive`;
  const label = isActive ? "Ativo" : "Inativo";
  return `<span class="${CSS_PREFIX}-badge ${cls}">${label}</span>`;
}
export {
  renderStatusBadge
};
