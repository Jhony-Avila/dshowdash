// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer/components/buttons/bell
// PURPOSE: Footer Notificações Button Component P3 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BUTTON_CONFIG, ACTION_PAYLOAD from ./contracts.js
//   createTemplate from ./ui/template.js
//   attachEvents from ./ui/events.js
//   track from ./telemetry/tracker.js
//   runCleanups from ../_shared/listener-helpers.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   mount() — exported function
//   unmount() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getInstance() — exported function
//   createBellButton() — exported function
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

import { BUTTON_CONFIG, ACTION_PAYLOAD } from './contracts.js';
import { createTemplate } from './ui/template.js';
import { attachEvents } from './ui/events.js';
import { track } from './telemetry/tracker.js';
import { runCleanups } from '../_shared/listener-helpers.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

export const VERSION = '1.0.1-P18EC';
export const MODULE_ID = 'footer/components/buttons/bell';

class BellButton {
  [key: string]: any;
  constructor() {
    this._element = null;
    this._hostEl = null;
    this._mounted = false;
    this._initialized = false;
    this._cleanups = [];
    this._config = { ...BUTTON_CONFIG };
  }

  init(ctx = {}) {
    if (this._initialized) return this;
    this._ctx = ctx;
    this._initialized = true;
    return this;
  }

  mount(hostEl: HTMLElement, props = {}) {
    if (!hostEl) {
      track('error', { message: 'hostEl required' });
      return this;
    }
    if (this._mounted && this._hostEl === hostEl) return this;
    if (this._mounted) this.unmount();
    const html = createTemplate({ ...this._config, ...props });
    const temp = document.createElement('div');
    temp.innerHTML = html;
    this._element = temp.firstElementChild;
    attachEvents(this._element, this._cleanups, () => { track('clicked'); });
    hostEl.appendChild(this._element);
    this._hostEl = hostEl;
    this._mounted = true;
    track('mounted');
    return this;
  }

  unmount() {
    if (!this._mounted) return this;
    runCleanups(this._cleanups);
    if (this._element?.parentNode) this._element.parentNode.removeChild(this._element);
    this._element = null;
    this._hostEl = null;
    this._mounted = false;
    track('unmounted');
    return this;
  }

  healthCheck() {
    const checks = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl };
    const score = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: score === total ? 'HEALTHY' : score >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${score}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
  }

  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: VERSION, moduleId: MODULE_ID, emits: [UI_EVENTS.ACTION], actionPayload: ACTION_PAYLOAD };
  }

  getElement() { return this._element; }
  isMounted() { return this._mounted; }
  getId() { return this._config.id; }
}

let _instance: {[k:string]:Function}|null = null;
export function getInstance() { if (!_instance) _instance = new BellButton(); return _instance; }
export function createBellButton() { return new BellButton(); }
export const init = (ctx?: Record<string, unknown>) => getInstance().init(ctx);
export const mount = (hostEl?: HTMLElement, props?: Record<string, unknown>) => getInstance().mount(hostEl, props);
export const unmount = () => getInstance().unmount();
export const healthCheck = () => getInstance().healthCheck();
export const info = () => getInstance().info();
export default { BellButton, getInstance, createBellButton, init, mount, unmount, healthCheck, info, VERSION, MODULE_ID };
