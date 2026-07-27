// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-views
// PURPOSE: Panel-01 - Alternative Views Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   initFeature, loadFeature from ./feature-loader.js
//   FeatureModules from ./feature-registry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { CONFIG } from '../core/config.js';
import { initFeature, loadFeature } from './feature-loader.js';
import { FeatureModules } from './feature-registry.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-views';

export async function initViews(ctx: Record<string, unknown>, result: Record<string, unknown>) {
  const features: Record<string, unknown> = CONFIG.features || {};
  const handlers = ctx.handlers || {};

  // Card View
  if (features.cardView !== false) {
    const cardModule = await loadFeature('cardView', FeatureModules.cardView);
    if (cardModule && (cardModule as Record<string, unknown>).CardViewManager) {
      const CardViewManager = (cardModule as Record<string, new (...args: unknown[]) => unknown>).CardViewManager;
      result.cardView = initFeature('cardView.init', () => new CardViewManager({
        onCardClick: (handlers as Record<string, unknown>).onRowClick,
        onCardAction: (handlers as Record<string, unknown>).onRowAction
      }), { fallback: null });
    }
  }

  // Kanban View
  if (features.kanbanView !== false) {
    const kanbanModule = await loadFeature('kanbanView', FeatureModules.kanbanView);
    if (kanbanModule && (kanbanModule as Record<string, unknown>).KanbanViewManager) {
      const KanbanViewManager = (kanbanModule as Record<string, new (...args: unknown[]) => unknown>).KanbanViewManager;
      result.kanbanView = initFeature('kanbanView.init', () => new KanbanViewManager({
        groupField: 'situacao',
        onMove(itemId: string | number, newStatus: string) {
          (handlers as Record<string, unknown>).onStatusChange && ((handlers as Record<string, (...a: unknown[]) => void>).onStatusChange)(itemId, newStatus);
        }
      }), { fallback: null });
    }
  }

  // Split View
  if (features.splitView !== false) {
    const splitModule = await loadFeature('splitView', FeatureModules.splitView);
    if (splitModule && (splitModule as Record<string, unknown>).SplitViewManager) {
      const SplitViewManager = (splitModule as Record<string, new (...args: unknown[]) => unknown>).SplitViewManager;
      result.splitView = initFeature('splitView.init', () => new SplitViewManager({ onSelect: (handlers as Record<string, unknown>).onRowClick }), { fallback: null });
    }
  }

  // Timeline View
  if (features.timelineView !== false) {
    const timelineModule = await loadFeature('timelineView', FeatureModules.timelineView);
    if (timelineModule && (timelineModule as Record<string, unknown>).TimelineViewManager) {
      const TimelineViewManager = (timelineModule as Record<string, new (...args: unknown[]) => unknown>).TimelineViewManager;
      result.timelineView = initFeature('timelineView.init', () => new TimelineViewManager({
        dateField: 'data',
        onItemClick: (handlers as Record<string, unknown>).onRowClick
      }), { fallback: null });
    }
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initViews, info };
