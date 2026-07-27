// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/actions
// PURPOSE: Panel-01 Actions Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/actions';

export class ActionsHandler {
  [key: string]: any;
  constructor(container: HTMLElement, options: Record<string, unknown> = {}) {
    this.container = container;
    this.handlers = options.handlers || {};
    this._listener = null;
  }

  init() {
    if (!this.container) return;
    this._listener = (e: MouseEvent) => {
      const btn = (e.target as Element).closest('[data-action]') as HTMLElement | null;
      if (!btn) return;
      const action = btn.dataset.action;
      // @ts-expect-error strict migration — TS2538
      if (this.handlers[action]) {
        e.preventDefault();
        // @ts-expect-error strict migration — TS2538
        this.handlers[action](btn, e);
      }
    };
    this.container.addEventListener('click', this._listener);
  }

  registerHandler(action: string, handler: (...args: unknown[]) => unknown) {
    this.handlers[action] = handler;
  }

  destroy() {
    if (this._listener && this.container) {
      this.container.removeEventListener('click', this._listener);
    }
    this._listener = null;
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default ActionsHandler;
