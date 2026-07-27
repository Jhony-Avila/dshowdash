// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin/ui/component
// PURPOSE: Panel Feature Flags Admin - UI Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderFlags, renderLoading, renderError, renderEmpty from ./renderer.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { renderFlags, renderLoading, renderError, renderEmpty } from './renderer.js';

export const MODULE_ID = 'panel-feature-flags-admin/ui/component';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement | null, logger: Record<string, unknown>, options: Record<string, unknown> = {}) {
    this.container = container;
    this.logger = logger;
    this.onToggle = options.onToggle || (() => {});
    this.onEdit = options.onEdit || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.mounted = false;
  }

  async init() {
    if (!this.container) {
      this.logger?.error?.('ui.no-container');
      return;
    }
    this.mounted = true;
    this.logger?.debug?.('ui.init');
  }

  showLoading() {
    if (!this.container) return;
    this.container.innerHTML = renderLoading();
  }

  showError(message: string) {
    if (!this.container) return;
    this.container.innerHTML = renderError(message);
  }

  showEmpty() {
    if (!this.container) return;
    this.container.innerHTML = renderEmpty();
  }

  update(flags: unknown[]) {
    if (!this.container || !flags) return;
    if (flags.length === 0) {
      this.showEmpty();
      return;
    }
    this.container.innerHTML = renderFlags(flags as Record<string, unknown>[]);
    this._bindCardEvents();
  }

  _bindCardEvents() {
    this.container.querySelectorAll('[data-action="toggle"]').forEach((el: HTMLElement) => {
      el.addEventListener('change', () => this.onToggle((el as HTMLElement).dataset.flag));
    });
    this.container.querySelectorAll('[data-action="edit"]').forEach((el: HTMLElement) => {
      el.addEventListener('click', () => this.onEdit((el as HTMLElement).dataset.flag));
    });
    this.container.querySelectorAll('[data-action="delete"]').forEach((el: HTMLElement) => {
      el.addEventListener('click', () => this.onDelete((el as HTMLElement).dataset.flag));
    });
  }

  async destroy() {
    this.container = null;
    this.mounted = false;
  }

  healthCheck() {
    return { status: this.mounted ? 'HEALTHY' : 'NOT_MOUNTED', moduleId: MODULE_ID, version: VERSION };
  }
}

export default UIComponent;
