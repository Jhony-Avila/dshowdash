import { Lucide, getAreaLucideIcon, serverIconImg } from "../config/icons-system.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-templates-matrix";
const COLLAPSE_KEY = "uarps-collapsed-areas";
let _collapsedAreas = null;
function _initCollapsedAreas() {
  if (_collapsedAreas !== null) return;
  _collapsedAreas = {};
  try {
    const saved = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "null") || [];
    for (let i = 0; i < saved.length; i++) {
      _collapsedAreas[saved[i]] = true;
    }
  } catch (e) {
    _collapsedAreas = {};
  }
}
function _saveCollapsedState() {
  try {
    const keys = [];
    for (const k in _collapsedAreas) {
      if (_collapsedAreas[k]) keys.push(k);
    }
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(keys));
  } catch (e) {
  }
}
_initCollapsedAreas();
function isAreaCollapsed(area) {
  _initCollapsedAreas();
  return !!_collapsedAreas[area];
}
function toggleAreaCollapse(area) {
  _initCollapsedAreas();
  if (_collapsedAreas[area]) {
    delete _collapsedAreas[area];
  } else {
    _collapsedAreas[area] = true;
  }
  _saveCollapsedState();
  return !_collapsedAreas[area];
}
function collapseAllAreas(areas) {
  _initCollapsedAreas();
  for (let i = 0; i < areas.length; i++) {
    _collapsedAreas[areas[i]] = true;
  }
  _saveCollapsedState();
}
function expandAllAreas() {
  _collapsedAreas = {};
  _saveCollapsedState();
}
function _groupByArea(triggers) {
  const grouped = {};
  for (let i = 0; i < triggers.length; i++) {
    const t = triggers[i];
    const area = t.area || t.category || "outros";
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(t);
  }
  return grouped;
}
function _formatArea(area) {
  return area.charAt(0).toUpperCase() + area.slice(1).replace(/_/g, " ");
}
function triggerMatrix(triggers, grantedTriggers, options) {
  if (!grantedTriggers) grantedTriggers = [];
  if (!options) options = {};
  if (!triggers.length) {
    return `<div class="uarps-matrix__empty">${Lucide.inbox}<span>Nenhum trigger encontrado</span></div>`;
  }
  const grouped = _groupByArea(triggers);
  const showCheckbox = Boolean(options.bulkMode);
  const areas = Object.keys(grouped);
  let html = "";
  html += matrixToolbar(areas);
  html += '<div class="uarps-matrix__grid">';
  for (let a = 0; a < areas.length; a++) {
    const area = areas[a];
    const items = grouped[area];
    const isCollapsed = isAreaCollapsed(area);
    let grantedCount = 0;
    for (let g = 0; g < items.length; g++) {
      if (grantedTriggers.indexOf(items[g].id) > -1) grantedCount++;
    }
    html += `<div class="uarps-matrix__group ${isCollapsed ? "uarps-matrix__group--collapsed" : ""}" data-area="${area}">`;
    html += `<div class="uarps-matrix__group-header" data-action="toggle-area" data-area="${area}">`;
    html += `  <button class="uarps-matrix__toggle" type="button" aria-expanded="${!isCollapsed}">`;
    html += `    <span class="uarps-matrix__toggle-icon">${isCollapsed ? Lucide.chevronRight : Lucide.chevronDown}</span>`;
    html += "  </button>";
    html += `  <span class="uarps-matrix__group-icon">${getAreaLucideIcon(area)}</span>`;
    html += `  <span class="uarps-matrix__group-title">${_formatArea(area)}</span>`;
    html += '  <span class="uarps-matrix__group-stats">';
    html += `    <span class="uarps-matrix__group-granted">${grantedCount}</span>`;
    html += '    <span class="uarps-matrix__group-separator">/</span>';
    html += `    <span class="uarps-matrix__group-total">${items.length}</span>`;
    html += "  </span>";
    if (showCheckbox) {
      html += `  <input type="checkbox" class="uarps-checkbox uarps-checkbox--group" data-area="${area}" title="Selecionar todos">`;
    }
    html += "</div>";
    html += `<div class="uarps-matrix__group-items" ${isCollapsed ? 'style="display:none"' : ""}>`;
    for (let t = 0; t < items.length; t++) {
      html += triggerCell(items[t], grantedTriggers.indexOf(items[t].id) > -1, showCheckbox, area);
    }
    html += "</div>";
    html += "</div>";
  }
  html += "</div>";
  return html;
}
function triggerCell(trigger, isGranted, showCheckbox, area) {
  if (showCheckbox === void 0) showCheckbox = false;
  if (!area) area = trigger.area || "";
  const stateClass = isGranted ? "granted" : "denied";
  const tooltip = `${trigger.label || trigger.id}&#10;ID: ${trigger.id}&#10;Status: ${isGranted ? "Liberado" : "Bloqueado"}`;
  let html = `<div class="uarps-cell uarps-cell--${stateClass}" `;
  html += `data-trigger-id="${trigger.id}" `;
  html += `data-area="${area}" `;
  html += `title="${tooltip}" `;
  html += `role="button" tabindex="0" aria-pressed="${isGranted}">`;
  if (showCheckbox) {
    html += `<input type="checkbox" class="uarps-checkbox uarps-checkbox--cell" data-trigger-id="${trigger.id}">`;
  }
  html += '<div class="uarps-cell__icon">';
  html += `  ${serverIconImg(trigger.id, area, "uarps-trigger-icon")}`;
  html += "</div>";
  html += '<div class="uarps-cell__status">';
  html += isGranted ? Lucide.checkCircle : Lucide.lock;
  html += "</div>";
  html += `<span class="uarps-cell__label">${trigger.label || trigger.id}</span>`;
  html += `<span class="uarps-cell__id">${trigger.id}</span>`;
  html += '<div class="uarps-cell__glow"></div>';
  html += "</div>";
  return html;
}
function matrixToolbar(areas) {
  if (!areas) areas = [];
  return `<div class="uarps-matrix__toolbar"><button class="uarps-btn uarps-btn--ghost uarps-btn--sm" data-action="expand-all" title="Expandir todas">${Lucide.chevronDown} <span>Expandir</span></button><button class="uarps-btn uarps-btn--ghost uarps-btn--sm" data-action="collapse-all" title="Recolher todas">${Lucide.chevronUp} <span>Recolher</span></button><span class="uarps-matrix__toolbar-divider"></span><span class="uarps-matrix__toolbar-info"><span class="uarps-matrix__toolbar-count">${areas.length}</span> \xE1reas</span></div>`;
}
function matrixLegend() {
  return '<div class="uarps-matrix__legend"><div class="uarps-matrix__legend-item"><span class="uarps-matrix__legend-dot uarps-matrix__legend-dot--granted"></span><span>Liberado</span></div><div class="uarps-matrix__legend-item"><span class="uarps-matrix__legend-dot uarps-matrix__legend-dot--denied"></span><span>Bloqueado</span></div></div>';
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { triggerMatrixReady: typeof triggerMatrix === "function", triggerCellReady: typeof triggerCell === "function" } };
}
var templates_matrix_default = { triggerMatrix, triggerCell, matrixToolbar, matrixLegend, isAreaCollapsed, toggleAreaCollapse, collapseAllAreas, expandAllAreas, VERSION, MODULE_ID, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  collapseAllAreas,
  templates_matrix_default as default,
  expandAllAreas,
  healthCheck,
  info,
  isAreaCollapsed,
  matrixLegend,
  matrixToolbar,
  toggleAreaCollapse,
  triggerCell,
  triggerMatrix
};
