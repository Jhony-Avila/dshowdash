// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-08.utils.formatters
// PURPOSE: Decimal formatting and API data parsing for Card 08 (Average/Hour)
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_DECIMAL - formatDecimal(value) returns formatted pt-BR decimal
// @contract PARSE_API - parseApiData(data) extracts averagePerHour from API
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: Intl.NumberFormat (native)
// PROVIDES: formatDecimal, parseApiData, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ENTERPRISE: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-08.utils.formatters';

const decimalFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function formatDecimal(value: unknown) {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return '--';
  return decimalFormatter.format(num);
}

export function parseApiData(data: unknown) {
  if (!data) return { averagePerHour: null };
  const _d = data as Record<string, any>;
  const apiData = _d.data || _d;
  const value = apiData.value !== undefined ? parseFloat(apiData.value) : 0;
  return { averagePerHour: value };
}

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['formatDecimal', 'parseApiData'], timestamp: Date.now() }; }

export default { formatDecimal, parseApiData };
