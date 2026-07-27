// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-templates-matrix
// PURPOSE: UARPS Admin - Matrix Templates (Collapsible + Hybrid Icons)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Lucide, getAreaLucideIcon, serverIconImg from ../config/icons-system.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isAreaCollapsed() — exported function
//   toggleAreaCollapse() — exported function
//   collapseAllAreas() — exported function
//   expandAllAreas() — exported function
//   triggerMatrix() — exported function
//   triggerCell() — exported function
//   matrixToolbar() — exported function
//   matrixLegend() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { Lucide, getAreaLucideIcon, serverIconImg } from '../config/icons-system.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-templates-matrix';

const COLLAPSE_KEY = 'uarps-collapsed-areas';
let _collapsedAreas: Record<string, boolean> | null = null;

function _initCollapsedAreas() {
  if (_collapsedAreas !== null) return;
  _collapsedAreas = {};
  try {
    const saved: string[] = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || 'null') || [];
    for (let i = 0; i < saved.length; i++) { _collapsedAreas[saved[i]] = true; }
  } catch (e) { _collapsedAreas = {}; }
}

function _saveCollapsedState() {
  try {
    const keys = [];
    for (const k in _collapsedAreas) { if (_collapsedAreas[k]) keys.push(k); }
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(keys));
  } catch (e) {}
}

_initCollapsedAreas();

export function isAreaCollapsed(area: string) {
  _initCollapsedAreas();
  return !!(_collapsedAreas as Record<string, boolean>)[area];
}

export function toggleAreaCollapse(area: string) {
  _initCollapsedAreas();
  if ((_collapsedAreas as Record<string, boolean>)[area]) { delete (_collapsedAreas as Record<string, boolean>)[area]; }
  else { (_collapsedAreas as Record<string, boolean>)[area] = true; }
  _saveCollapsedState();
  return !(_collapsedAreas as Record<string, boolean>)[area];
}

export function collapseAllAreas(areas: string[]) {
  _initCollapsedAreas();
  for (let i = 0; i < areas.length; i++) { (_collapsedAreas as Record<string, boolean>)[areas[i]] = true; }
  _saveCollapsedState();
}

export function expandAllAreas() {
  _collapsedAreas = {};
  _saveCollapsedState();
}

function _groupByArea(triggers: Record<string, unknown>[]) {
  const grouped: Record<string, Record<string, unknown>[]> = {};
  for (let i = 0; i < triggers.length; i++) {
    const t = triggers[i];
    const area = (t.area || t.category || 'outros') as string;
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(t);
  }
  return grouped;
}

function _formatArea(area: string) {
  return area.charAt(0).toUpperCase() + area.slice(1).replace(/_/g, ' ');
}

export function triggerMatrix(triggers: Record<string, unknown>[], grantedTriggers: string[], options: Record<string, unknown>) {
  if (!grantedTriggers) grantedTriggers = [];
  if (!options) options = {};
  
  if (!triggers.length) {
    return `<div class="uarps-matrix__empty">${Lucide.inbox}<span>Nenhum trigger encontrado</span></div>`;
  }
  
  const grouped = _groupByArea(triggers);
  const showCheckbox = Boolean(options.bulkMode);
  const areas = Object.keys(grouped);
  let html = '';
  
  html += matrixToolbar(areas);
  html += '<div class="uarps-matrix__grid">';
  
  for (let a = 0; a < areas.length; a++) {
    const area = areas[a];
    const items = grouped[area];
    const isCollapsed = isAreaCollapsed(area);
    let grantedCount = 0;
    for (let g = 0; g < items.length; g++) {
      if (grantedTriggers.indexOf(items[g].id as string) > -1) grantedCount++;
    }
    
    html += `<div class="uarps-matrix__group ${isCollapsed ? 'uarps-matrix__group--collapsed' : ''}" data-area="${area}">`;
    html += `<div class="uarps-matrix__group-header" data-action="toggle-area" data-area="${area}">`;
    html += `  <button class="uarps-matrix__toggle" type="button" aria-expanded="${!isCollapsed}">`;
    html += `    <span class="uarps-matrix__toggle-icon">${isCollapsed ? Lucide.chevronRight : Lucide.chevronDown}</span>`;
    html += '  </button>';
    html += `  <span class="uarps-matrix__group-icon">${getAreaLucideIcon(area)}</span>`;
    html += `  <span class="uarps-matrix__group-title">${_formatArea(area)}</span>`;
    html += '  <span class="uarps-matrix__group-stats">';
    html += `    <span class="uarps-matrix__group-granted">${grantedCount}</span>`;
    html += '    <span class="uarps-matrix__group-separator">/</span>';
    html += `    <span class="uarps-matrix__group-total">${items.length}</span>`;
    html += '  </span>';
    if (showCheckbox) {
      html += `  <input type="checkbox" class="uarps-checkbox uarps-checkbox--group" data-area="${area}" title="Selecionar todos">`;
    }
    html += '</div>';
    html += `<div class="uarps-matrix__group-items" ${isCollapsed ? 'style="display:none"' : ''}>`;
    for (let t = 0; t < items.length; t++) {
      html += triggerCell(items[t], grantedTriggers.indexOf(items[t].id as string) > -1, showCheckbox, area);
    }
    html += '</div>';
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

export function triggerCell(trigger: Record<string, unknown>, isGranted: boolean, showCheckbox: boolean, area: string) {
  if (showCheckbox === undefined) showCheckbox = false;
  if (!area) area = (trigger.area as string) || '';
  const stateClass = isGranted ? 'granted' : 'denied';
  const tooltip = `${trigger.label || trigger.id}&#10;ID: ${trigger.id}&#10;Status: ${isGranted ? 'Liberado' : 'Bloqueado'}`;
  
  let html = `<div class="uarps-cell uarps-cell--${stateClass}" `;
  html += `data-trigger-id="${trigger.id}" `;
  html += `data-area="${area}" `;
  html += `title="${tooltip}" `;
  html += `role="button" tabindex="0" aria-pressed="${isGranted}">`;
  
  if (showCheckbox) {
    html += `<input type="checkbox" class="uarps-checkbox uarps-checkbox--cell" data-trigger-id="${trigger.id}">`;
  }
  
  html += '<div class="uarps-cell__icon">';
  html += `  ${serverIconImg(trigger.id as string, area, 'uarps-trigger-icon')}`;
  html += '</div>';
  html += '<div class="uarps-cell__status">';
  html += isGranted ? Lucide.checkCircle : Lucide.lock;
  html += '</div>';
  html += `<span class="uarps-cell__label">${trigger.label || trigger.id}</span>`;
  html += `<span class="uarps-cell__id">${trigger.id}</span>`;
  html += '<div class="uarps-cell__glow"></div>';
  html += '</div>';
  return html;
}

export function matrixToolbar(areas: string[]) {
  if (!areas) areas = [];
  return `<div class="uarps-matrix__toolbar"><button class="uarps-btn uarps-btn--ghost uarps-btn--sm" data-action="expand-all" title="Expandir todas">${Lucide.chevronDown} <span>Expandir</span></button><button class="uarps-btn uarps-btn--ghost uarps-btn--sm" data-action="collapse-all" title="Recolher todas">${Lucide.chevronUp} <span>Recolher</span></button><span class="uarps-matrix__toolbar-divider"></span><span class="uarps-matrix__toolbar-info"><span class="uarps-matrix__toolbar-count">${areas.length}</span> áreas</span></div>`;
}

export function matrixLegend() {
  return '<div class="uarps-matrix__legend">' +
    '<div class="uarps-matrix__legend-item">' +
      '<span class="uarps-matrix__legend-dot uarps-matrix__legend-dot--granted"></span>' +
      '<span>Liberado</span>' +
    '</div>' +
    '<div class="uarps-matrix__legend-item">' +
      '<span class="uarps-matrix__legend-dot uarps-matrix__legend-dot--denied"></span>' +
      '<span>Bloqueado</span>' +
    '</div>' +
  '</div>';
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { triggerMatrixReady: typeof triggerMatrix === 'function', triggerCellReady: typeof triggerCell === 'function' } }; }

export default { triggerMatrix, triggerCell, matrixToolbar, matrixLegend, isAreaCollapsed, toggleAreaCollapse, collapseAllAreas, expandAllAreas, VERSION, MODULE_ID, info, healthCheck };
