import { CONFIG } from "../core/config.js";
import { initFeature, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-views";
async function initViews(ctx, result) {
  const features = CONFIG.features || {};
  const handlers = ctx.handlers || {};
  if (features.cardView !== false) {
    const cardModule = await loadFeature("cardView", FeatureModules.cardView);
    if (cardModule && cardModule.CardViewManager) {
      const CardViewManager = cardModule.CardViewManager;
      result.cardView = initFeature("cardView.init", () => new CardViewManager({
        onCardClick: handlers.onRowClick,
        onCardAction: handlers.onRowAction
      }), { fallback: null });
    }
  }
  if (features.kanbanView !== false) {
    const kanbanModule = await loadFeature("kanbanView", FeatureModules.kanbanView);
    if (kanbanModule && kanbanModule.KanbanViewManager) {
      const KanbanViewManager = kanbanModule.KanbanViewManager;
      result.kanbanView = initFeature("kanbanView.init", () => new KanbanViewManager({
        groupField: "situacao",
        onMove(itemId, newStatus) {
          handlers.onStatusChange && handlers.onStatusChange(itemId, newStatus);
        }
      }), { fallback: null });
    }
  }
  if (features.splitView !== false) {
    const splitModule = await loadFeature("splitView", FeatureModules.splitView);
    if (splitModule && splitModule.SplitViewManager) {
      const SplitViewManager = splitModule.SplitViewManager;
      result.splitView = initFeature("splitView.init", () => new SplitViewManager({ onSelect: handlers.onRowClick }), { fallback: null });
    }
  }
  if (features.timelineView !== false) {
    const timelineModule = await loadFeature("timelineView", FeatureModules.timelineView);
    if (timelineModule && timelineModule.TimelineViewManager) {
      const TimelineViewManager = timelineModule.TimelineViewManager;
      result.timelineView = initFeature("timelineView.init", () => new TimelineViewManager({
        dateField: "data",
        onItemClick: handlers.onRowClick
      }), { fallback: null });
    }
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_views_default = { initViews, info };
export {
  MODULE_ID,
  VERSION,
  init_views_default as default,
  info,
  initViews
};
