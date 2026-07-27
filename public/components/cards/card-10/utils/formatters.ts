// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-10.utils.formatters
// PURPOSE: Percent formatting and API data parsing for Card 10 (Performance)
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_PERCENT - formatPercent(value) returns formatted percentage
// @contract PARSE_API - parseApiData(data) extracts performanceScore from API
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (native Number methods)
// PROVIDES: formatPercent, parseApiData, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ENTERPRISE: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-10.utils.formatters';

export function formatPercent(value: unknown) {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return `${num.toFixed(1)}%`;
}

export function parseApiData(data: unknown) {
  if (!data) return { performanceScore: null };
  const _d = data as Record<string, any>;
  const apiData = _d.data || _d;
  const value = apiData.value !== undefined ? parseFloat(apiData.value) : 0;
  return { performanceScore: value };
}

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['formatPercent', 'parseApiData'], timestamp: Date.now() }; }

export default { formatPercent, parseApiData };
