import { renderTableSkeleton } from "../render/skeleton.js";
import { renderEmpty } from "../render/empty.js";
import { renderError } from "../render/error.js";
import { renderFlat } from "./render-flat.js";
import { renderGrouped } from "./render-grouped.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/renderer";
const render = (ctx, state) => {
  if (!ctx.container) return null;
  const { loading, error, items = [], selectedIds = /* @__PURE__ */ new Set(), sort = {} } = state;
  if (loading && items.length === 0) {
    const colCount = ctx.columns.filter((c) => c.visible).length;
    ctx.container.innerHTML = renderTableSkeleton(colCount);
    return { items, isVirtual: false };
  }
  if (error) {
    ctx.container.innerHTML = renderError(error);
    return { items, isVirtual: false, hasError: true };
  }
  if (items.length === 0) {
    ctx.container.innerHTML = renderEmpty();
    return { items, isVirtual: false };
  }
  const groupField = ctx.grouping ? ctx.grouping.get() : null;
  if (groupField) {
    renderGrouped(ctx, items, selectedIds, sort);
  } else {
    renderFlat(ctx, items, selectedIds, sort);
  }
  return { items, isVirtual: false };
};
const healthCheck = () => {
  const checks = { renderFlatAvailable: typeof renderFlat === "function", renderGroupedAvailable: typeof renderGrouped === "function", renderSkeletonAvailable: typeof renderTableSkeleton === "function" };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, timestamp: Date.now() };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info,
  render
};
