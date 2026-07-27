// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: grid
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderGrid() — exported function
//   updateGridItem() — exported function
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

export const MODULE_ID = 'panel-15.ui.grid';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 15 - Grid Component
 * @module panel-15/ui/grid
 * @version 1.1.0-AAA
 */

export function renderGrid(container: HTMLElement, { items = [] as unknown[], columns = 3, renderItem }: { items?: unknown[]; columns?: number; renderItem: (item: unknown, index: number) => string }) {
    if (!container) return;
    
    const gridHTML = `
        <div class="panel-grid" style="grid-template-columns: repeat(${columns}, 1fr)">
            ${items.map((item, index) => `
                <div class="grid-item" data-index="${index}">
                    ${typeof renderItem === 'function' ? renderItem(item, index) : JSON.stringify(item)}
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = gridHTML;
}

export function updateGridItem(container: HTMLElement, index: number, content: string) {
    const item = container.querySelector(`.grid-item[data-index="${index}"]`);
    if (item) item.innerHTML = content;
}

export default { renderGrid, updateGridItem };
