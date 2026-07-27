import { Icons } from "./icons.js";
import { getInitials, groupByArea, formatArea } from "./templates-helpers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-templates-compare";
const ARROW_SVGS = {
  up: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  down: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  left: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  right: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
};
function _getAreaIcon(area) {
  const map = { navrail: Icons.compass, sidebar: Icons.menu, footer: Icons.chevronDown, header: Icons.chevronUp, panel: Icons.layout, other: Icons.grid };
  return map[area] || Icons.grid;
}
function compareLegend() {
  return '<div class="uarps-compare-legend"><div class="uarps-compare-legend__item"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--a"></div><span>Apenas Usu\xE1rio A</span></div><div class="uarps-compare-legend__item"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--b"></div><span>Apenas Usu\xE1rio B</span></div><div class="uarps-compare-legend__item"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--both"></div><span>Ambos</span></div><div class="uarps-compare-legend__item"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--none"></div><span>Nenhum</span></div></div>';
}
function compareUsers(userA, userB) {
  const initialsA = getInitials(String(userA && userA.nome || "A"));
  const initialsB = getInitials(String(userB && userB.nome || "B"));
  return `<div class="uarps-compare-users"><span class="uarps-compare-users__label">Comparando:</span><div class="uarps-compare-users__list"><div class="uarps-compare-users__avatar uarps-tooltip" data-tooltip="${userA && userA.nome || "Usu\xE1rio A"}">${initialsA}</div><div class="uarps-compare-users__avatar uarps-tooltip" data-tooltip="${userB && userB.nome || "Usu\xE1rio B"}">${initialsB}</div></div></div>`;
}
function compareStats(data) {
  return `<div class="uarps-compare-stats"><div class="uarps-stats__item uarps-tooltip" data-tooltip="Triggers exclusivos de ${data.userA && data.userA.nome}"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--a"></div><span class="uarps-stats__value">${data.stats?.onlyA}</span></div><div class="uarps-stats__item uarps-tooltip" data-tooltip="Triggers exclusivos de ${data.userB && data.userB.nome}"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--b"></div><span class="uarps-stats__value">${data.stats?.onlyB}</span></div><div class="uarps-stats__item uarps-tooltip" data-tooltip="Triggers em comum"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--both"></div><span class="uarps-stats__value">${data.stats?.both}</span></div></div>`;
}
function triggerMatrixCompare(triggers, compareData) {
  if (!triggers.length || !compareData) {
    return `<div class="uarps-matrix__empty">${Icons.inbox} Selecione dois usu\xE1rios para comparar</div>`;
  }
  const grouped = groupByArea(triggers);
  const onlyASet = new Set(compareData.onlyA || []);
  const onlyBSet = new Set(compareData.onlyB || []);
  const bothSet = new Set(compareData.both || []);
  let html = compareLegend();
  html += '<div class="uarps-matrix__grid">';
  Object.keys(grouped).forEach((area) => {
    const items = grouped[area];
    html += `<div class="uarps-matrix__group"><div class="uarps-matrix__group-header"><span class="uarps-matrix__group-icon">${_getAreaIcon(area)}</span><span class="uarps-matrix__group-title">${formatArea(area)}</span><span class="uarps-matrix__group-count">${items.length}</span></div><div class="uarps-matrix__group-items">`;
    items.forEach((t) => {
      let compareClass = "uarps-cell--compare-none";
      if (onlyASet.has(t.id)) compareClass = "uarps-cell--compare-only-a";
      else if (onlyBSet.has(t.id)) compareClass = "uarps-cell--compare-only-b";
      else if (bothSet.has(t.id)) compareClass = "uarps-cell--compare-both";
      html += `<div class="uarps-cell ${compareClass}" data-trigger-id="${t.id}" tabindex="0"><div class="uarps-cell__content"><span class="uarps-cell__label">${t.label || t.id}</span><span class="uarps-cell__id">${t.id}</span></div></div>`;
    });
    html += "</div></div>";
  });
  html += "</div>";
  return html;
}
function keyboardNavHint() {
  return `<div class="uarps-nav-hint"><div class="uarps-nav-hint__keys"><span class="uarps-kbd">${ARROW_SVGS.up}</span><span class="uarps-kbd">${ARROW_SVGS.down}</span><span class="uarps-kbd">${ARROW_SVGS.left}</span><span class="uarps-kbd">${ARROW_SVGS.right}</span></div><span>Navegar</span><span class="uarps-kbd">Enter</span><span>Selecionar</span><span class="uarps-kbd">Esc</span><span>Sair</span></div>`;
}
export {
  MODULE_ID,
  VERSION,
  compareLegend,
  compareStats,
  compareUsers,
  keyboardNavHint,
  triggerMatrixCompare
};
