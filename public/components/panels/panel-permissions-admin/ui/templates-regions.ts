// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-templates-regions
// PURPOSE: UARPS Admin - Region Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ./icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   regionMatrix() — exported function
//   matrixEmpty() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-templates-regions';

export function regionMatrix(regions: Record<string, unknown>[], grantedRegions: string[] = []) {
  if (!regions.length) return `<div class="uarps-matrix__empty">${Icons.inbox} Nenhuma região</div>`;
  
  let html = '<div class="uarps-matrix__regions">';
  html += regions.map((r: Record<string, unknown>) => {
    const isGranted = grantedRegions.includes(r.id as string);
    const stateClass = isGranted ? 'granted' : 'denied';
    const icon = isGranted ? Icons.eye : Icons.eyeOff;
    const tooltip = `${r.label || r.id}\nID: ${r.id}\nStatus: ${isGranted ? 'Visível' : 'Oculta'}`;
    return `
<div class="uarps-region uarps-region--${stateClass} uarps-tooltip--bottom" data-region-id="${r.id}" data-tooltip="${tooltip}" role="button" tabindex="0">
  <div class="uarps-region__indicator">${icon}</div>
  <div class="uarps-region__content">
    <span class="uarps-region__label">${r.label || r.id}</span>
    <span class="uarps-region__id">${r.id}</span>
  </div>
  <div class="uarps-region__glow"></div>
</div>`;
  }).join('');
  html += '</div>';
  return html;
}

export function matrixEmpty() {
  return `
<div class="uarps-matrix__empty">
  <div class="uarps-matrix__empty-icon">${Icons.shield}</div>
  <p>Selecione um usuário para visualizar a matriz de permissões</p>
</div>`;
}
