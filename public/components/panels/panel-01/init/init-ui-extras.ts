// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-ui-extras
// PURPOSE: Panel-01 - UI Extras Initializer
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
export const MODULE_ID = 'panel-01:init:init-ui-extras';

export async function initUIExtras(ctx: Record<string, unknown>, result: Record<string, unknown>) {
  const features = CONFIG.features || {};
  const toastModule = await loadFeature('toast', FeatureModules.toast);

  // Saved Views

  if (features.savedViews) {
    const m = await loadFeature('savedViews', FeatureModules.savedViews);
    if (m) {
      const SavedViewsManager = (m as Record<string, new (...args: unknown[]) => unknown>).SavedViewsManager;
      result.savedViews = initFeature('savedViews.init', () => new SavedViewsManager({ onApply: ctx.applyView }), { fallback: null });
    }
  }

  // Bulk Edit

  if (features.bulkEdit) {
    const m = await loadFeature('bulkEdit', FeatureModules.bulkEdit);
    if (m) {
      const BulkEditManager = (m as Record<string, new (...args: unknown[]) => unknown>).BulkEditManager;
      result.bulkEdit = initFeature('bulkEdit.init', () => new BulkEditManager({
        editableFields: CONFIG.table && CONFIG.table.editableFields ? CONFIG.table.editableFields : ['descricao', 'observacao'],
        onSave: ctx.saveBulkEdit,
        onProgress() {}
      }), { fallback: null });
    }
  }

  // Tags

  if (features.tags) {
    const m = await loadFeature('tags', FeatureModules.tags);
    if (m) {
      const TagsManager = (m as Record<string, new (...args: unknown[]) => unknown>).TagsManager;
      result.tags = initFeature('tags.init', () => new TagsManager({ onTagAdd() {}, onTagRemove() {} }), { fallback: null });
    }
  }

  // Preview

  if (features.preview) {
    const m = await loadFeature('preview', FeatureModules.preview);
    if (m) {
      const PreviewManager = (m as Record<string, new (...args: unknown[]) => unknown>).PreviewManager;
      result.preview = initFeature('preview.init', () => new PreviewManager({ container: document.body, onClose() {} }), { fallback: null });
    }
  }

  // Badge New

  if (features.badgeNew) {
    const m = await loadFeature('badgeNew', FeatureModules.badgeNew);
    if (m && toastModule) {
      const NewBadgeManager = (m as Record<string, new (...args: unknown[]) => unknown>).NewBadgeManager;
      const toast = toastModule as Record<string, ((msg: string) => void) | undefined>;
      result.badgeNew = initFeature('badgeNew.init', () => new NewBadgeManager({
        timestampField: 'updated_at',
        onNewItems(items: unknown[]) {
          if (items.length > 0 && toast.info) toast.info(`${items.length} novos itens`);
        }
      }), { fallback: null });
    }
  }

  // Animations

  if (features.animations) {
    const m = await loadFeature('animations', FeatureModules.animations);
    if (m) {
      const AnimationManager = (m as Record<string, new (...args: unknown[]) => unknown>).AnimationManager;
      result.animations = initFeature('animations.init', () => new AnimationManager({ duration: 200 }), { fallback: null });
    }
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initUIExtras, info };
