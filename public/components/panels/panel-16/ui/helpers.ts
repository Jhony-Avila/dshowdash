// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-16-ui-helpers
// PURPOSE: Panel-16 UI Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   formatCurrency() — exported function
//   formatNumber() — exported function
//   formatPercent() — exported function
//   formatDoc() — exported function
//   formatDate() — exported function
//   truncate() — exported function
//   download() — exported function
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

export function formatCurrency(v: unknown) { return `R$ ${(parseFloat(v as string) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
export function formatNumber(v: unknown) { return (parseInt(v as string) || 0).toLocaleString('pt-BR'); }
export function formatPercent(v: unknown) { return `${(parseFloat(v as string) || 0).toFixed(1)}%`; }
export function formatDoc(d: unknown) { if (!d) return '—'; const c = (d as string).replace(/\D/g, ''); if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); if (c.length === 14) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'); return d; }
export function formatDate(d: unknown) { if (!d) return '—'; try { return new Date(d as string).toLocaleDateString('pt-BR'); } catch { return d; } }
export function truncate(s: unknown, l: number) { if (!s) return '—'; return (s as string).length > l ? `${(s as string).substring(0, l)}...` : s; }
export function download(content: string, filename: string, type: string) { const blob = new Blob([`\ufeff${content}`], { type: `${type};charset=utf-8` }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); }

export default { formatCurrency, formatNumber, formatPercent, formatDoc, formatDate, truncate, download };

export const MODULE_ID = 'panels-panel-16-ui-helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } }; }
