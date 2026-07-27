// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:utils:charts
// PURPOSE: Panel-05 Dashboard Utils - Charts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   formatPercent from ./number-formatters.js
//
// PROVIDES:
//   generateSparkline() — exported function
//   generateMiniBar() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { formatPercent } from './number-formatters.js';

export function generateSparkline(data: Array<unknown>, options: Record<string, unknown> = {}) {
  const { width = 80, height = 24, stroke = 'currentColor', strokeWidth = 1.5, fill = false, fillOpacity = 0.15, showDots = false, dotRadius = 2 } = options;
  const _width = Number(width), _height = Number(height);

  if (!data?.length) return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-empty"></svg>`;

  const values = data.map((d: unknown) => typeof d === 'object' && d !== null ? Number((d as Record<string, unknown>).value) : Number(d)).filter((v: number) => !isNaN(v));
  if (!values.length) return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-empty"></svg>`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const chartWidth = _width - padding * 2;
  const chartHeight = _height - padding * 2;

  const points = values.map((v: number, i: number) => ({
    x: padding + (i / (values.length - 1)) * chartWidth,
    y: padding + chartHeight - ((v - min) / range) * chartHeight,
    value: v
  }));

  const pathD = points.map((p: { x: number; y: number }, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

  let fillPath = '';
  if (fill) {
    fillPath = `<path d="${pathD} L ${points[points.length - 1].x.toFixed(2)} ${_height - padding} L ${padding} ${_height - padding} Z" fill="${stroke}" fill-opacity="${fillOpacity}" class="p05-sparkline-fill"/>`;
  }

  let dots = '';
  if (showDots) {
    dots = points.map((p: { x: number; y: number }, i: number) => {
      const isLast = i === points.length - 1;
      return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${isLast ? Number(dotRadius) + 0.5 : dotRadius}" fill="${isLast ? stroke : 'var(--p05-bg-surface)'}" stroke="${stroke}" stroke-width="1" class="p05-sparkline-dot ${isLast ? 'p05-sparkline-dot-last' : ''}"/>`;
    }).join('');
  }

  const trend = values[values.length - 1] > values[0] ? 'up' : values[values.length - 1] < values[0] ? 'down' : 'neutral';

  return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-${trend}" preserveAspectRatio="none">${fillPath}<path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="p05-sparkline-line"/>${dots}</svg>`;
}

export function generateMiniBar(value: unknown, max: unknown, options: Record<string, unknown> = {}) {
  const { width = 60, height = 8, color = 'var(--p05-primary)', bgColor = 'var(--p05-bg-surface-alt)', radius = 4, showValue = false } = options;
  const percent = Math.min(100, Math.max(0, (Number(value) / Number(max)) * 100));
  return `<div class="p05-mini-bar" style="width: ${width}px; height: ${height}px;"><div class="p05-mini-bar-track" style="background: ${bgColor}; border-radius: ${radius}px;"><div class="p05-mini-bar-fill" style="width: ${percent}%; background: ${color}; border-radius: ${radius}px;"></div></div>${showValue ? `<span class="p05-mini-bar-value">${formatPercent(percent, { decimals: 0 })}</span>` : ''}</div>`;
}

export default { generateSparkline, generateMiniBar };

export const MODULE_ID = 'panel-05:utils:charts';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { chartsReady: true } }; }
