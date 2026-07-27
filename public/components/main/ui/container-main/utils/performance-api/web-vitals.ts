// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: web-vitals
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   observeWebVitals() — exported function
//   getWebVitals() — exported function
//   getWebVitalsRating() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Performance API - Web Vitals
 * @module performance-api/web-vitals
 */
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.web-vitals';

export function observeWebVitals(state: Record<string, unknown>, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      (state.webVitals as Record<string, unknown>).LCP = lastEntry.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0];
      if (firstInput) {

        // @ts-expect-error TS migration - TS2339
        state.webVitals.FID = firstInput.processingStart - firstInput.startTime;
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {

        // @ts-expect-error TS migration - TS2339
        if (!entry.hadRecentInput) {
          clsValue += (entry as any).value;
          (state.webVitals as Record<string, unknown>).CLS = clsValue;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          (state.webVitals as Record<string, unknown>).FCP = entry.startTime;
        }
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });

  } catch (e) {
    // @ts-expect-error strict migration — TS2345
    if (logger) logger.warn('Web Vitals observation failed:', e);
  }
}

export function getWebVitals(state: Record<string, unknown>) {
  // @ts-expect-error strict migration — TS2774
  if (performance.getEntriesByType) {
    const navEntry = ((performance as any).getEntriesByType('navigation') as any)[0];
    if (navEntry) {
      (state.webVitals as Record<string, unknown>).TTFB = navEntry.responseStart - navEntry.requestStart;
    }
  }
  // @ts-expect-error TS migration - TS2698
  return { ...(state as Record<string, unknown>).webVitals };
}

export function getWebVitalsRating(state: Record<string, unknown>) {
  const vitals = getWebVitals(state);
  const ratings: Record<string, unknown> = {};

  if (vitals.LCP !== null) {
    ratings.LCP = vitals.LCP < 2500 ? 'good' : vitals.LCP < 4000 ? 'needs-improvement' : 'poor';
  }
  if (vitals.FID !== null) {
    ratings.FID = vitals.FID < 100 ? 'good' : vitals.FID < 300 ? 'needs-improvement' : 'poor';
  }
  if (vitals.CLS !== null) {
    ratings.CLS = vitals.CLS < 0.1 ? 'good' : vitals.CLS < 0.25 ? 'needs-improvement' : 'poor';
  }

  return { vitals, ratings };
}
