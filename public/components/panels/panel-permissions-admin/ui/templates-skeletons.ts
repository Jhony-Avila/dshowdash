// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-templates-skeletons
// PURPOSE: UARPS Admin - Skeleton Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   skeletonUserGrid() — exported function
//   skeletonUserFocus() — exported function
//   skeletonMatrix() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-templates-skeletons';

export function skeletonUserGrid(count = 8) {
  return Array(count).fill(0).map(() => `
    <div class="uarps-user-skeleton">
      <div class="uarps-skeleton uarps-skeleton--circle uarps-user-skeleton__avatar"></div>
      <div class="uarps-user-skeleton__info">
        <div class="uarps-skeleton uarps-user-skeleton__name"></div>
        <div class="uarps-skeleton uarps-user-skeleton__level"></div>
      </div>
    </div>
  `).join('');
}

export function skeletonUserFocus() {
  return `
    <div class="uarps-focus-skeleton">
      <div class="uarps-skeleton uarps-skeleton--circle uarps-focus-skeleton__avatar"></div>
      <div class="uarps-skeleton uarps-focus-skeleton__name"></div>
      <div class="uarps-skeleton uarps-focus-skeleton__email"></div>
      <div class="uarps-focus-skeleton__badges">
        <div class="uarps-skeleton uarps-skeleton--badge"></div>
        <div class="uarps-skeleton uarps-skeleton--badge"></div>
      </div>
      <div class="uarps-focus-skeleton__stats">
        <div class="uarps-skeleton uarps-focus-skeleton__stat"></div>
        <div class="uarps-skeleton uarps-focus-skeleton__stat"></div>
      </div>
    </div>
  `;
}

export function skeletonMatrix(groups = 3, cells = 5) {
  return Array(groups).fill(0).map(() => `
    <div class="uarps-matrix__group" style="animation:none">
      <div class="uarps-matrix__group-header">
        <div class="uarps-skeleton" style="width:20px;height:20px;border-radius:4px"></div>
        <div class="uarps-skeleton" style="width:100px;height:16px"></div>
      </div>
      <div class="uarps-matrix__group-items">
        ${Array(cells).fill(0).map(() => `
          <div class="uarps-cell-skeleton">
            <div class="uarps-skeleton" style="width:24px;height:24px;border-radius:4px"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:4px">
              <div class="uarps-skeleton" style="height:12px;width:70%"></div>
              <div class="uarps-skeleton" style="height:8px;width:90%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}
