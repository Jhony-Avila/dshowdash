// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/renderer
// PURPOSE: Panel-01 Table - Main Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderTableSkeleton from ../render/skeleton.js
//   renderEmpty from ../render/empty.js
//   renderError from ../render/error.js
//   renderFlat from ./render-flat.js
//   renderGrouped from ./render-grouped.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   render() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { renderTableSkeleton } from '../render/skeleton.js';
import { renderEmpty } from '../render/empty.js';
import { renderError } from '../render/error.js';

// @ts-expect-error TS migration - TS2614
import { renderFlat } from './render-flat.js';
import { renderGrouped } from './render-grouped.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/renderer';

export const render = (ctx: Record<string, unknown>, state: Record<string, unknown>) => {
  if (!ctx.container) return null;
  const { loading, error, items = [], selectedIds = new Set(), sort = {} } = state;
  if (loading && (items as unknown[]).length === 0) { const colCount = (ctx.columns as Record<string, unknown>[]).filter((c: Record<string, unknown>) => c.visible).length; (ctx.container as HTMLElement).innerHTML = renderTableSkeleton(colCount); return { items, isVirtual: false }; }
  if (error) { (ctx.container as HTMLElement).innerHTML = renderError(error as string | Error); return { items, isVirtual: false, hasError: true }; }
  if ((items as unknown[]).length === 0) { (ctx.container as HTMLElement).innerHTML = renderEmpty(); return { items, isVirtual: false }; }
  const groupField = ctx.grouping ? (ctx.grouping as Record<string, () => unknown>).get() : null;
  if (groupField) { renderGrouped(ctx, items as Record<string, unknown>[], selectedIds as Set<string>, sort); } else { renderFlat(ctx, items as Record<string, unknown>[], selectedIds as Set<string>, sort); }
  return { items, isVirtual: false };
};

export const healthCheck = () => { const checks = { renderFlatAvailable: typeof renderFlat === 'function', renderGroupedAvailable: typeof renderGrouped === 'function', renderSkeletonAvailable: typeof renderTableSkeleton === 'function' }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, timestamp: Date.now() }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
