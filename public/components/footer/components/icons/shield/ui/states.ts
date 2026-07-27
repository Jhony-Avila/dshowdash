// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-shield-states
// PURPOSE: shield Icon - UI States
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   States — exported value
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const MODULE_ID = 'footer-icon-shield-states';
export const VERSION = '1.2.0-ENTERPRISE';

let _metrics = { stateChanges: 0, variantChanges: 0 };

export const States = {
  applyState(el: HTMLElement|null, s: unknown) {
    if (!el) return;
    _metrics.stateChanges++;
    el.classList.remove('dsd-icon--state-default', 'dsd-icon--state-active', 'dsd-icon--state-disabled', 'dsd-icon--state-loading');
    el.classList.add(`dsd-icon--state-${s}`);
  },
  applyVariant(el: HTMLElement|null, v: unknown) {
    if (!el) return;
    _metrics.variantChanges++;
    ['primary', 'secondary', 'brand', 'success', 'warning', 'danger', 'muted'].forEach(x => el.classList.remove(`dsd-icon--${x}`));
    el.classList.add(`dsd-icon--${v}`);
  }
};

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { statesReady: true }, metrics: getMetrics() };
}


export default { ...States, getMetrics, info, healthCheck, MODULE_ID, VERSION };
