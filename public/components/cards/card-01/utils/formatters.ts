// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-01.utils.formatters
// PURPOSE: Number/percent formatting and API data parsing for Card 01
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_NUMBER - formatNumber(value) returns formatted pt-BR number
// @contract FORMAT_PERCENT - formatPercent(value) returns percentage string
// @contract PARSE_API - parseApiData(data) extracts successRate/counts from API
// @contract PARSE_SPARKLINE - parseSparklineData(history) returns rate array
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: Intl.NumberFormat (native)
// PROVIDES: formatNumber, formatPercent, parseApiData, parseSparklineData, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.3.0-P17WI: Initial version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-01.utils.formatters';

const numberFormatter = new Intl.NumberFormat('pt-BR');

export function formatNumber(value: unknown) {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return numberFormatter.format(num);
}

export function formatPercent(value: unknown) {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return `${Math.round(num)}%`;
}

export function parseApiData(data: unknown) {
  if (!data) return { successRate: null, successCount: null, errorCount: null };
  const _data = data as Record<string, any>;
  const apiData = _data.data || _data;
  return {
    successRate: apiData.success_rate !== undefined ? apiData.success_rate : apiData.successRate,
    successCount: apiData.sucesso !== undefined ? apiData.sucesso : apiData.success,
    errorCount: apiData.erro !== undefined ? apiData.erro : (apiData.error !== undefined ? apiData.error : apiData.errors)
  };
}

export function parseSparklineData(history: unknown) {
  if (!history || !Array.isArray(history) || (history as unknown[]).length === 0) return [];
  return history.map(h => Math.max(0, Math.min(100, Number(h && h.rate ? h.rate : 0))));
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['formatNumber', 'formatPercent', 'parseApiData', 'parseSparklineData'],
    timestamp: Date.now()
  };
}

export default { formatNumber, formatPercent, parseApiData, parseSparklineData };
