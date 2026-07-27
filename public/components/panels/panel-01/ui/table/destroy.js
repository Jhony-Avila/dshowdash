const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/destroy";
function destroy(ctx) {
  if (ctx.clickListener && ctx.container) {
    ctx.container.removeEventListener("click", ctx.clickListener);
  }
  if (ctx.contextListener && ctx.container) {
    ctx.container.removeEventListener("contextmenu", ctx.contextListener);
  }
  if (ctx.dragDrop) ctx.dragDrop.destroy();
  if (ctx.resize) ctx.resize.destroy();
  if (ctx.sticky) ctx.sticky.remove();
  if (ctx.inlineEditor) ctx.inlineEditor.cancel();
  if (ctx.eventManager) ctx.eventManager.destroy();
  if (ctx.grouping) ctx.grouping.reset();
  if (ctx.sorting) ctx.sorting.reset();
  if (ctx.keyboard) ctx.keyboard.destroy();
  if (ctx.rowHoverMenu) ctx.rowHoverMenu.destroy();
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
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  destroy,
  healthCheck,
  info
};
