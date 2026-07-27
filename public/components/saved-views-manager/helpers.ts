// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components-saved-views-manager-helpers
// PURPOSE: SavedViewsManager - Helpers Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as api from ./api.js
//   SAVED_VIEWS_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   saveCurrentView() — exported function
//   apply() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as api from './api.js';
import { SAVED_VIEWS_EVENTS } from '/core/runtime/events/catalog/saved-views.events.js';
import type { SavedView } from './state.js';

const MODULE_ID = 'components-saved-views-manager-helpers';
const VERSION = '2.1.0-P18EC';

interface MetricsModule {
  listCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  applyCount: number;
  errorCount: number;
  lastActivity: number | null;
}

interface SaveViewOptions {
  isDefault?: boolean;
  isShared?: boolean;
  [key: string]: unknown;
}

export function saveCurrentView(key: string, label: string, type: string, config: Record<string, unknown>, options: SaveViewOptions, createFn: (data: Record<string, unknown>) => Promise<unknown>): Promise<unknown> {
  return createFn({ view_key: key, view_label: label, view_type: type, config, is_default: options.isDefault || false, is_shared: options.isShared || false });
}

export function apply(viewId: number | string, getFn: (id: number | string) => Promise<SavedView>, metrics: MetricsModule, trackTelemetry: (action: string, data?: Record<string, unknown>) => void, emit: (event: string, data: Record<string, unknown>) => void): Promise<SavedView | null> {
  return getFn(viewId).then((view: SavedView) => {
    if (view) { metrics.applyCount++; trackTelemetry('apply', { viewId, viewType: view.view_type }); emit(SAVED_VIEWS_EVENTS.APPLY, { view: view as unknown as Record<string, unknown> }); return view; }
    return null;
  }).catch((error: Error) => { metrics.errorCount++; emit(SAVED_VIEWS_EVENTS.ERROR, { action: 'apply', error: error.message }); throw error; });
}

export { MODULE_ID, VERSION };
export function info(): Record<string, string> { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck(): Record<string, unknown> { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
