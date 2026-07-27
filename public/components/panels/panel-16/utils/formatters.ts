// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16/utils/formatters
// PURPOSE: Panel-16 Formatters - Fornecedores 360º
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatCurrency() — exported function
//   formatNumber() — exported function
//   formatCompact() — exported function
//   formatDate() — exported function
//   formatDateTime() — exported function
//   formatPercent() — exported function
//   formatCNPJ() — exported function
//   formatPhone() — exported function
//   formatUF() — exported function
//   formatRiscoNivel() — exported function
//   formatStatus() — exported function
//   escapeHtml() — exported function
//   truncate() — exported function
//   ... and 3 more exports
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-16/utils/formatters';

export function formatCurrency(value: unknown) {
  if (value === null || value === undefined) return 'R$ 0,00';
  const num = parseFloat(String(value));
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatNumber(value: unknown) {
  if (value === null || value === undefined) return '0';
  const num = parseFloat(String(value));
  if (isNaN(num)) return '0';
  return num.toLocaleString('pt-BR');
}

export function formatCompact(value: unknown) {
  if (value === null || value === undefined) return '0';
  const num = parseFloat(String(value));
  if (isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('pt-BR');
}

export function formatDate(dateStr: unknown) {
  if (!dateStr) return '--';
  try { const date = new Date(dateStr as string | number); if (isNaN(date.getTime())) return '--'; return date.toLocaleDateString('pt-BR'); } catch { return '--'; }
}

export function formatDateTime(dateStr: unknown) {
  if (!dateStr) return '--';
  try { const date = new Date(dateStr as string | number); if (isNaN(date.getTime())) return '--'; return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return '--'; }
}

export function formatPercent(value: unknown, decimals = 1) {
  if (value === null || value === undefined) return '0%';
  const num = parseFloat(String(value));
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

export function formatCNPJ(cnpj: unknown) {
  if (!cnpj) return '--';
  const clean = String(cnpj).replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatPhone(phone: unknown) {
  if (!phone) return '--';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 11) return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (clean.length === 10) return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return phone;
}

export function formatUF(uf: unknown) {
  if (!uf) return '--';
  return String(uf).toUpperCase().slice(0, 2);
}

export function formatRiscoNivel(nivel: unknown) {
  const niveis: Record<string, string> = { baixo: '🟢 Baixo', medio: '🟡 Médio', alto: '🟠 Alto', critico: '🔴 Crítico' };
  return niveis[String(nivel).toLowerCase()] || nivel || '--';
}

export function formatStatus(status: unknown) {
  const map: Record<string, string> = { ativo: '✓ Ativo', inativo: '✗ Inativo', pendente: '⏳ Pendente', bloqueado: '🚫 Bloqueado' };
  return map[String(status).toLowerCase()] || status || '--';
}

export function escapeHtml(text: unknown) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text as string; return div.innerHTML; }
export function truncate(text: unknown, maxLength = 50) { if (!text) return ''; if ((text as string).length <= maxLength) return text; return `${(text as string).substring(0, maxLength)}...`; }
export function debounce(fn: (...args: unknown[]) => void, delay = 300) { let timer: ReturnType<typeof setTimeout> | null = null; return (...args: unknown[]) => { clearTimeout(timer ?? undefined); timer = setTimeout(() => fn(...args), delay); }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { formatCurrency, formatNumber, formatCompact, formatDate, formatDateTime, formatPercent, formatCNPJ, formatPhone, formatUF, formatRiscoNivel, formatStatus, escapeHtml, truncate, debounce };
