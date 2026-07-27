// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-07.utils.formatters
// PURPOSE: Number formatting and API data parsing for Card 07 (Running)
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_NUMBER - formatNumber(value) returns formatted pt-BR number
// @contract PARSE_API - parseApiData(data) extracts running count from API
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: Intl.NumberFormat (native)
// PROVIDES: formatNumber, parseApiData, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.3.0-P17WI: Initial version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-07.utils.formatters';

const numberFormatter = new Intl.NumberFormat('pt-BR');

export function formatNumber(value: unknown) {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return numberFormatter.format(num);
}

export function parseApiData(data: unknown) {
  if (!data) return { running: null };
  const _d = data as Record<string, any>;
  const apiData = _d.data || _d;
  const count = apiData.value !== undefined ? parseInt(apiData.value) : 0;
  return { running: count };
}

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['formatNumber', 'parseApiData'], timestamp: Date.now() }; }

export default { formatNumber, parseApiData };
