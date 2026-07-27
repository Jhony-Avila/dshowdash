// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.3.0-VISUAL-ENHANCEMENTS)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin:renderer:kpis
// PURPOSE: Panel Nav Admin KPIs Renderer - AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   updateKPIs() — exported function
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
// @changelog
//   13.3.0-VISUAL-ENHANCEMENTS: MELHORIA 6 — animated count-up on KPI values (800ms easing)
//   9.3.0-P2-ENTERPRISE: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '13.3.0-VISUAL-ENHANCEMENTS';
export const MODULE_ID = 'panel-nav-admin:renderer:kpis';

interface KPIRefs {
  kpiTotalItems?: HTMLElement | null;
  kpiTotalSections?: HTMLElement | null;
  kpiActiveItems?: HTMLElement | null;
  kpiAdminItems?: HTMLElement | null;
  [key: string]: HTMLElement | null | undefined;
}

interface KPIValues {
  totalItems?: number | string | null;
  totalSections?: number | string | null;
  activeItems?: number | string | null;
  adminItems?: number | string | null;
}

// ═══ MELHORIA 6: Animated count-up for KPI values ═══
function _animateCountTo(el: HTMLElement, targetValue: number, duration: number) {
  var start = parseInt(el.textContent || '0', 10) || 0;
  var diff = targetValue - start;
  if (diff === 0) { el.textContent = String(targetValue); return; }
  var startTime = performance.now();
  function step(now: number) {
    var elapsed = now - startTime;
    var progress = Math.min(elapsed / duration, 1);
    // easeOutCubic
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(start + diff * eased));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function updateKPIs(refs: KPIRefs, kpis: KPIValues) {
  if (!refs || !kpis) return;
  const updates = [ { ref: refs.kpiTotalItems, value: kpis.totalItems }, { ref: refs.kpiTotalSections, value: kpis.totalSections }, { ref: refs.kpiActiveItems, value: kpis.activeItems }, { ref: refs.kpiAdminItems, value: kpis.adminItems } ];
  updates.forEach(({ ref, value }) => {
    if (ref) {
      if (value == null) {
        if (ref.textContent !== '—') ref.textContent = '—';
        return;
      }
      var numVal = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (!isNaN(numVal)) {
        _animateCountTo(ref, numVal, 800);
      } else {
        var text = String(value);
        if (ref.textContent !== text) ref.textContent = text;
      }
    }
  });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export default { updateKPIs, info, healthCheck, VERSION, MODULE_ID };
