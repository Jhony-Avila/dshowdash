import { CSS_PREFIX } from "../core/constants.js";
function renderSkeleton(rows = 5) {
  const items = Array.from({ length: rows }).map(() => `<div class="${CSS_PREFIX}-skeleton__row"></div>`).join("");
  return `
    <div class="${CSS_PREFIX}-skeleton" aria-busy="true" aria-label="Carregando bot\xF5es">
      <div class="${CSS_PREFIX}-skeleton__group"></div>
      ${items}
    </div>`;
}
export {
  renderSkeleton
};
