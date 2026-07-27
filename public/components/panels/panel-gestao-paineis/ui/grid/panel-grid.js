import { CSS_PREFIX } from "../../core/constants.js";
import { renderPanelCard } from "./panel-card.js";
function renderGrid(panels, pendingScreenshots) {
  if (panels.length === 0) return "";
  const cards = panels.map((panel) => {
    const isPending = pendingScreenshots.has(panel.panel_id);
    return renderPanelCard(panel, isPending);
  }).join("");
  return `<div class="${CSS_PREFIX}-grid">${cards}</div>`;
}
function updateGrid(container, panels, pendingScreenshots) {
  const gridEl = container.querySelector(`.${CSS_PREFIX}-grid`);
  if (!gridEl) return;
  const html = panels.map((panel) => {
    const isPending = pendingScreenshots.has(panel.panel_id);
    return renderPanelCard(panel, isPending);
  }).join("");
  gridEl.innerHTML = html;
}
export {
  renderGrid,
  updateGrid
};
