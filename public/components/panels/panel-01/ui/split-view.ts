// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/split-view
// PURPOSE: Panel-01 - Split View
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SPLIT_MODES — exported value
//   SPLIT_SIZES — exported value
//   SplitViewManager() — exported function
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
export const MODULE_ID = 'panel-01/ui/split-view';

export const SPLIT_MODES = Object.freeze({ OFF: 'off', HORIZONTAL: 'horizontal', VERTICAL: 'vertical' });
export const SPLIT_SIZES = Object.freeze({ SMALL: 30, MEDIUM: 50, LARGE: 70 });

export function SplitViewManager(this: any, options: Record<string, unknown> = {}) {
  this.container = options.container || null;
  this.onResize = options.onResize || (() => {});
  this.onModeChange = options.onModeChange || (() => {});
  this.onItemSelect = options.onItemSelect || (() => {});
  this.onSelect = options.onSelect || (() => {});
  this._mode = SPLIT_MODES.OFF;
  this._splitSize = SPLIT_SIZES.MEDIUM;
  this._selectedItem = null;
}

SplitViewManager.prototype.setContainer = function(container: HTMLElement) { this.container = container; };
SplitViewManager.prototype.setMode = function(mode: string) { this._mode = mode; this.onModeChange(mode); };
SplitViewManager.prototype.getMode = function() { return this._mode; };
SplitViewManager.prototype.setSplitSize = function(size: number) { this._splitSize = size; this.onResize(size); };
SplitViewManager.prototype.selectItem = function(item: unknown) { this._selectedItem = item; this.onItemSelect(item); };
SplitViewManager.prototype.render = function() {
  if (!this.container || this._mode === SPLIT_MODES.OFF) return;
  let html = `<div class="p01-split-view p01-split-view--${this._mode}">`;
  html += `<div class="p01-split-list" style="flex: ${this._splitSize}%;"></div>`;
  html += '<div class="p01-split-divider"></div>';
  html += `<div class="p01-split-detail" style="flex: ${100 - this._splitSize}%;"></div>`;
  html += '</div>';
  this.container.innerHTML = html;
};
SplitViewManager.prototype.destroy = function() { if (this.container) this.container.innerHTML = ''; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });
export default { SplitViewManager, SPLIT_MODES, SPLIT_SIZES, info, healthCheck };
