// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-templates-compare
// PURPOSE: UARPS Admin - Compare Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ./icons.js
//   getInitials, groupByArea, formatArea from ./templates-helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   compareLegend() — exported function
//   compareUsers() — exported function
//   compareStats() — exported function
//   triggerMatrixCompare() — exported function
//   keyboardNavHint() — exported function
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

import { Icons } from './icons.js';
import { getInitials, groupByArea, formatArea } from './templates-helpers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-templates-compare';

const ARROW_SVGS = {
  up: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  down: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  left: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  right: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
};

function _getAreaIcon(area: string) { const map: Record<string, string> = { navrail: Icons.compass as string, sidebar: Icons.menu as string, footer: Icons.chevronDown as string, header: Icons.chevronUp as string, panel: Icons.layout as string, other: Icons.grid as string }; return map[area] || Icons.grid; }

export function compareLegend() {
  return '<div class="uarps-compare-legend"><div class="uarps-compare-legend__item"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--a"></div><span>Apenas Usuário A</span></div><div class="uarps-compare-legend__item"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--b"></div><span>Apenas Usuário B</span></div><div class="uarps-compare-legend__item"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--both"></div><span>Ambos</span></div><div class="uarps-compare-legend__item"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--none"></div><span>Nenhum</span></div></div>';
}

export function compareUsers(userA: Record<string, unknown> | null, userB: Record<string, unknown> | null) {
  const initialsA = getInitials(String((userA && userA.nome) || 'A'));
  const initialsB = getInitials(String((userB && userB.nome) || 'B'));
  return `<div class="uarps-compare-users"><span class="uarps-compare-users__label">Comparando:</span><div class="uarps-compare-users__list"><div class="uarps-compare-users__avatar uarps-tooltip" data-tooltip="${(userA && userA.nome) || 'Usuário A'}">${initialsA}</div><div class="uarps-compare-users__avatar uarps-tooltip" data-tooltip="${(userB && userB.nome) || 'Usuário B'}">${initialsB}</div></div></div>`;
}

interface CompareData {
  userA?: { nome?: string; name?: string; id?: string | number; triggers?: string[] };
  userB?: { nome?: string; name?: string; id?: string | number; triggers?: string[] };
  stats?: { onlyA: number; onlyB: number; both: number; neither: number };
  onlyA?: string[];
  onlyB?: string[];
  both?: string[];
  neither?: string[];
}

export function compareStats(data: CompareData) {
  return `<div class="uarps-compare-stats"><div class="uarps-stats__item uarps-tooltip" data-tooltip="Triggers exclusivos de ${data.userA && data.userA.nome}"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--a"></div><span class="uarps-stats__value">${data.stats?.onlyA}</span></div><div class="uarps-stats__item uarps-tooltip" data-tooltip="Triggers exclusivos de ${data.userB && data.userB.nome}"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--b"></div><span class="uarps-stats__value">${data.stats?.onlyB}</span></div><div class="uarps-stats__item uarps-tooltip" data-tooltip="Triggers em comum"><div class="uarps-compare-legend__dot uarps-compare-legend__dot--both"></div><span class="uarps-stats__value">${data.stats?.both}</span></div></div>`;
}

export function triggerMatrixCompare(triggers: Record<string, unknown>[], compareData: CompareData | null) {
  if (!triggers.length || !compareData) { return `<div class="uarps-matrix__empty">${Icons.inbox} Selecione dois usuários para comparar</div>`; }
  const grouped = groupByArea(triggers);
  const onlyASet = new Set<string>(compareData.onlyA || []);
  const onlyBSet = new Set<string>(compareData.onlyB || []);
  const bothSet = new Set<string>(compareData.both || []);
  let html = compareLegend();
  html += '<div class="uarps-matrix__grid">';
  Object.keys(grouped).forEach(area => {
    const items = grouped[area];
    html += `<div class="uarps-matrix__group"><div class="uarps-matrix__group-header"><span class="uarps-matrix__group-icon">${_getAreaIcon(area)}</span><span class="uarps-matrix__group-title">${formatArea(area)}</span><span class="uarps-matrix__group-count">${items.length}</span></div><div class="uarps-matrix__group-items">`;
    items.forEach((t: Record<string, unknown>) => {
      let compareClass = 'uarps-cell--compare-none';
      if (onlyASet.has(t.id as string)) compareClass = 'uarps-cell--compare-only-a';
      else if (onlyBSet.has(t.id as string)) compareClass = 'uarps-cell--compare-only-b';
      else if (bothSet.has(t.id as string)) compareClass = 'uarps-cell--compare-both';
      html += `<div class="uarps-cell ${compareClass}" data-trigger-id="${t.id}" tabindex="0"><div class="uarps-cell__content"><span class="uarps-cell__label">${t.label || t.id}</span><span class="uarps-cell__id">${t.id}</span></div></div>`;
    });
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

export function keyboardNavHint() {
  return `<div class="uarps-nav-hint"><div class="uarps-nav-hint__keys"><span class="uarps-kbd">${ARROW_SVGS.up}</span><span class="uarps-kbd">${ARROW_SVGS.down}</span><span class="uarps-kbd">${ARROW_SVGS.left}</span><span class="uarps-kbd">${ARROW_SVGS.right}</span></div><span>Navegar</span><span class="uarps-kbd">Enter</span><span>Selecionar</span><span class="uarps-kbd">Esc</span><span>Sair</span></div>`;
}
