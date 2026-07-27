// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-unlock-controller
// PURPOSE: unlock Icon - Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   validateProps from ./contracts.js
//   Lifecycle from ./lifecycle.js
//   EventsHandler from ./events.js
//
// PROVIDES:
//   Controller — exported value
//   getMetrics() — exported function
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
import { validateProps } from './contracts.js';
import { Lifecycle } from './lifecycle.js';
import { EventsHandler } from './events.js';
const MODULE_ID = 'footer-icon-unlock-controller';
const VERSION = '1.1.0-ENTERPRISE';
let _metrics = { inits: 0, mounts: 0, unmounts: 0, destroys: 0, errors: 0 };
export const Controller = {
  async init() { _metrics.inits++; if (Lifecycle.isReady()) return { success: true, alreadyInitialized: true }; Lifecycle.setInitializing(); EventsHandler.init(); Lifecycle.setReady(); return { success: true }; },

  // @ts-expect-error TS migration - TS2339
  async mount(container, props: Record<string, unknown> = {}) { _metrics.mounts++; if (!container) { _metrics.errors++; throw new Error('Container required'); } const v = validateProps(props); const { Template } = await import('../ui/template.js'); container.innerHTML = Template.render(v.props); Lifecycle.setMounted(container); if (v.props.clickable) { const el = container.querySelector('.dsd-icon--unlock'); if (el) EventsHandler.bindClick(el, () => EventsHandler.emitClicked(v.props)); } EventsHandler.emitMounted(v.props); return { success: true, props: v.props }; },
  async unmount() { _metrics.unmounts++; Lifecycle.setUnmounting(); EventsHandler.cleanup(); const c = Lifecycle.getContainer(); if (c) c.innerHTML = ''; EventsHandler.emitUnmounted(); Lifecycle.reset(); return { success: true }; },
  async destroy() { _metrics.destroys++; await this.unmount(); EventsHandler.destroy(); Lifecycle.setDestroyed(); return { success: true }; },
  getLifecycle() { return Lifecycle.info(); }
};
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, lifecycle: Lifecycle.info(), metrics: getMetrics() }; }
export function healthCheck() { const isReady = Lifecycle.isReady(); return { status: isReady ? 'HEALTHY' : 'IDLE', version: VERSION, moduleId: MODULE_ID, checks: { lifecycleReady: isReady }, metrics: getMetrics() }; }
export { MODULE_ID, VERSION };
export default { ...Controller, getMetrics, info, healthCheck, MODULE_ID, VERSION };
