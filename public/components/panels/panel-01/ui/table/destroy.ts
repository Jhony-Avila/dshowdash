// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/destroy
// PURPOSE: Panel-01 Table - Destroy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   destroy() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/destroy';

export function destroy(ctx: Record<string, unknown>) {
    // Remove event listeners
    if (ctx.clickListener && ctx.container) {
        (ctx.container as HTMLElement).removeEventListener('click', ctx.clickListener as EventListenerOrEventListenerObject);
    }
    if (ctx.contextListener && ctx.container) {
        (ctx.container as HTMLElement).removeEventListener('contextmenu', ctx.contextListener as EventListenerOrEventListenerObject);
    }

    // Core features cleanup
    if (ctx.dragDrop) (ctx.dragDrop as Record<string, () => void>).destroy();
    if (ctx.resize) (ctx.resize as Record<string, () => void>).destroy();
    if (ctx.sticky) (ctx.sticky as Record<string, () => void>).remove();
    if (ctx.inlineEditor) (ctx.inlineEditor as Record<string, () => void>).cancel();
    if (ctx.eventManager) (ctx.eventManager as Record<string, () => void>).destroy();
    if (ctx.grouping) (ctx.grouping as Record<string, () => void>).reset();
    if (ctx.sorting) (ctx.sorting as Record<string, () => void>).reset();

    // Extended features cleanup
    if (ctx.keyboard) (ctx.keyboard as Record<string, () => void>).destroy();
    if (ctx.rowHoverMenu) (ctx.rowHoverMenu as Record<string, () => void>).destroy();

    // Nullify references
    ctx.clickListener = null;
    ctx.contextListener = null;
    ctx.tableEl = null;
    ctx.tbodyEl = null;
    ctx.dragDrop = null;
    ctx.resize = null;
    ctx.sticky = null;
    ctx.eventManager = null;
    ctx.columnsManager = null;
    ctx.bulkEdit = null;
    ctx.tags = null;
    ctx.savedViews = null;
    ctx.badgeNew = null;
    ctx.summaryRow = null;
    ctx.highlightingRules = null;
    ctx.anomalyDetector = null;
    ctx.currentItems = [];
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
