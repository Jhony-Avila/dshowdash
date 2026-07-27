// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P25-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04-ui-cards
// PURPOSE: Panel-04 UI - Cards & Sparklines
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   updateCards() — exported function
//   renderSparklines() — exported function
//   pulseCard() — exported function
//   highlightCard() — exported function
//   resetCards() — exported function
//   healthCheck() — exported function
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

export const MODULE_ID = 'panel-04-ui-cards';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const BELL_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

const SPARKLINE_COLORS = { total: '#6366f1', critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

const CARD_SELECTORS = { total: '[data-total]', critical: '[data-critical]', high: '[data-high]', medium: '[data-medium]', low: '[data-low]', uniqueJobs: '[data-unique-jobs]', recent: '[data-recent]' };

export function updateCards(container: HTMLElement, summary: Record<string, unknown>) {
  if (!container) return;
  const s = summary || {};
  const updates = [
    { selector: CARD_SELECTORS.total, value: s.total !== undefined ? s.total : '--' },
    { selector: CARD_SELECTORS.critical, value: s.critical !== undefined ? s.critical : 0 },
    { selector: CARD_SELECTORS.high, value: s.high !== undefined ? s.high : 0 },
    { selector: CARD_SELECTORS.medium, value: s.medium !== undefined ? s.medium : 0 },
    { selector: CARD_SELECTORS.low, value: s.low !== undefined ? s.low : 0 },
    { selector: CARD_SELECTORS.uniqueJobs, value: s.unique_jobs !== undefined ? s.unique_jobs : '--' }
  ];

  updates.forEach(item => {
    const el = container.querySelector(item.selector) as HTMLElement | null;
    if (el) {
      const oldValue = el.textContent;
      el.textContent = String(item.value);
      if (oldValue !== String(item.value) && oldValue !== '--') {
        el.style.transform = 'scale(1.1)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
      }
    }
  });

  const recentEl = container.querySelector(CARD_SELECTORS.recent) as HTMLElement | null;
  if (recentEl) {
    const recentCount = (s.recent_5min as number) || 0;
    if (recentCount > 0) {
      recentEl.innerHTML = `<span class="p04-recent-badge" style="display:inline-flex;align-items:center;gap:4px;padding:2px 6px;background:rgba(99,102,241,0.2);border-radius:4px;animation:p04-pulse 1s infinite;">${BELL_SVG} ${recentCount}</span>`;
    } else {
      recentEl.textContent = '';
    }
  }

  if ((s.critical as number) > 0) {
    const criticalCard = container.querySelector('[data-filter-btn="alert-critical"]') as HTMLElement | null;
    if (criticalCard && !criticalCard.classList.contains('p04-highlighted')) {
      criticalCard.classList.add('p04-highlighted');
      criticalCard.style.boxShadow = '0 0 0 2px rgba(220,38,38,0.5)';
    }
  }
}

export function renderSparklines(container: HTMLElement, sparklines: Record<string, number[]>) {
  if (!container || !sparklines) return;
  const types = ['total', 'critical', 'high', 'medium', 'low'];
  types.forEach(type => {
    const sparkContainer = container.querySelector(`[data-sparkline-${type}]`);
    if (!sparkContainer) return;
    const data = sparklines[type] || [];
    if (!data.length) {
      sparkContainer.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#2a2a3a;font-size:8px;">--</div>';
      return;
    }
    const max = Math.max(...data.concat([1]));
    const width = 100 / data.length;
    const color = (SPARKLINE_COLORS as Record<string, string>)[type] || '#606070';
    const bars = data.map((v: number, i: number) => {
      const h = Math.max((v / max) * 18, 1);
      return `<rect x="${i * width}" y="${20 - h}" width="${Math.max(width - 0.5, 1)}" height="${h}" fill="${color}" opacity="0.7" rx="1"><animate attributeName="height" from="0" to="${h}" dur="0.3s" fill="freeze"/><animate attributeName="y" from="20" to="${20 - h}" dur="0.3s" fill="freeze"/></rect>`;
    }).join('');
    sparkContainer.innerHTML = `<svg viewBox="0 0 100 20" preserveAspectRatio="none" style="width:100%;height:100%;">${bars}</svg>`;
  });
}

export function pulseCard(container: HTMLElement, type: string) {
  if (!container) return;
  const card = container.querySelector(`[data-filter-btn="alert-${type}"]`) as HTMLElement | null;
  if (!card) return;
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'p04-card-pulse 0.5s ease-in-out 3';
  setTimeout(() => { card.style.animation = ''; }, 1500);
}

export function highlightCard(container: HTMLElement, type: string, highlight = true) {
  if (!container) return;
  const card = container.querySelector(`[data-filter-btn="alert-${type}"]`) as HTMLElement | null;
  if (!card) return;
  if (highlight) {
    card.classList.add('p04-card-highlight');
    card.style.transform = 'scale(1.02)';
    card.style.boxShadow = '0 0 0 2px #6366f1';
  } else {
    card.classList.remove('p04-card-highlight');
    card.style.transform = '';
    card.style.boxShadow = '';
  }
}

export function resetCards(container: HTMLElement) {
  if (!container) return;
  // @ts-expect-error strict migration — TS2345
  container.querySelectorAll('[data-filter-btn]').forEach((card: Element & { style: CSSStyleDeclaration }) => {
    card.classList.remove('p04-highlighted', 'p04-card-highlight');
    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.animation = '';
  });
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { moduleAvailable: true }, p25Compliant: true, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, sparklineTypes: Object.keys(SPARKLINE_COLORS).length, p25Compliant: true };
}

export default { updateCards, renderSparklines, pulseCard, highlightCard, resetCards, healthCheck, info };
