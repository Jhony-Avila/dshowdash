import { CONFIG } from "../core/config.js";
import { initFeature, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-ui-extras";
async function initUIExtras(ctx, result) {
  const features = CONFIG.features || {};
  const toastModule = await loadFeature("toast", FeatureModules.toast);
  if (features.savedViews) {
    const m = await loadFeature("savedViews", FeatureModules.savedViews);
    if (m) {
      const SavedViewsManager = m.SavedViewsManager;
      result.savedViews = initFeature("savedViews.init", () => new SavedViewsManager({ onApply: ctx.applyView }), { fallback: null });
    }
  }
  if (features.bulkEdit) {
    const m = await loadFeature("bulkEdit", FeatureModules.bulkEdit);
    if (m) {
      const BulkEditManager = m.BulkEditManager;
      result.bulkEdit = initFeature("bulkEdit.init", () => new BulkEditManager({
        editableFields: CONFIG.table && CONFIG.table.editableFields ? CONFIG.table.editableFields : ["descricao", "observacao"],
        onSave: ctx.saveBulkEdit,
        onProgress() {
        }
      }), { fallback: null });
    }
  }
  if (features.tags) {
    const m = await loadFeature("tags", FeatureModules.tags);
    if (m) {
      const TagsManager = m.TagsManager;
      result.tags = initFeature("tags.init", () => new TagsManager({ onTagAdd() {
      }, onTagRemove() {
      } }), { fallback: null });
    }
  }
  if (features.preview) {
    const m = await loadFeature("preview", FeatureModules.preview);
    if (m) {
      const PreviewManager = m.PreviewManager;
      result.preview = initFeature("preview.init", () => new PreviewManager({ container: document.body, onClose() {
      } }), { fallback: null });
    }
  }
  if (features.badgeNew) {
    const m = await loadFeature("badgeNew", FeatureModules.badgeNew);
    if (m && toastModule) {
      const NewBadgeManager = m.NewBadgeManager;
      const toast = toastModule;
      result.badgeNew = initFeature("badgeNew.init", () => new NewBadgeManager({
        timestampField: "updated_at",
        onNewItems(items) {
          if (items.length > 0 && toast.info) toast.info(`${items.length} novos itens`);
        }
      }), { fallback: null });
    }
  }
  if (features.animations) {
    const m = await loadFeature("animations", FeatureModules.animations);
    if (m) {
      const AnimationManager = m.AnimationManager;
      result.animations = initFeature("animations.init", () => new AnimationManager({ duration: 200 }), { fallback: null });
    }
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_ui_extras_default = { initUIExtras, info };
export {
  MODULE_ID,
  VERSION,
  init_ui_extras_default as default,
  info,
  initUIExtras
};
