// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: render-virtual
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createVirtualRenderer() — exported function
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

export const MODULE_ID = 'panel-01.ui.table.render-virtual';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 01 - Virtual Table Renderer
 * @module panel-01/ui/table/render-virtual
 * @version 1.1.0-AAA
 */

export function createVirtualRenderer(container: HTMLElement, { rowHeight = 40, bufferSize = 5 }: { rowHeight?: number; bufferSize?: number } = {}) {
    let data: Record<string, unknown>[] = [];
    let columns: Record<string, unknown>[] = [];
    let scrollTop = 0;
    
    const viewport = container.querySelector('.table-viewport') || container;
    
    const calculateVisibleRange = () => {
        const viewportHeight = viewport.clientHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferSize);
        const visibleCount = Math.ceil(viewportHeight / rowHeight) + bufferSize * 2;
        const endIndex = Math.min(data.length, startIndex + visibleCount);
        return { startIndex, endIndex };
    };
    
    const render = () => {
        const { startIndex, endIndex } = calculateVisibleRange();
        const visibleData = data.slice(startIndex, endIndex);
        const offsetY = startIndex * rowHeight;
        
        const tbody = container.querySelector('tbody');
        if (tbody) {
            tbody.style.transform = `translateY(${offsetY}px)`;
            tbody.innerHTML = visibleData.map((row: Record<string, unknown>, i: number) =>
                `<tr data-index="${startIndex + i}">${columns.map((c: Record<string, unknown>) => `<td>${row[c.key as string] ?? ''}</td>`).join('')}</tr>`
            ).join('');
        }
    };
    
    return {
        setData: (d: Record<string, unknown>[]) => { data = d; render(); },
        setColumns: (c: Record<string, unknown>[]) => { columns = c; },
        onScroll: (top: number) => { scrollTop = top; render(); },
        render
    };
}

export default { createVirtualRenderer };
