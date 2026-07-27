// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-cards/utils/formatters
// PURPOSE: Panel Cards - Formatters
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
//   formatPercent() — exported function
//   formatDate() — exported function
//   formatTime() — exported function
//   formatRelative() — exported function
//   escapeHtml() — exported function
//   truncate() — exported function
//   debounce() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-cards/utils/formatters';

export function formatCurrency(value: number | string | null | undefined) { if (value === null || value === undefined) return 'R$ 0,00'; const num = parseFloat(String(value)); if (isNaN(num)) return 'R$ 0,00'; return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
export function formatNumber(value: number | string | null | undefined) { if (value === null || value === undefined) return '0'; const num = parseFloat(String(value)); if (isNaN(num)) return '0'; return num.toLocaleString('pt-BR'); }
export function formatCompact(value: number | string | null | undefined) { if (value === null || value === undefined) return '0'; const num = parseFloat(String(value)); if (isNaN(num)) return '0'; if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`; if (num >= 1000) return `${(num / 1000).toFixed(1)}K`; return num.toLocaleString('pt-BR'); }
export function formatPercent(value: number | string | null | undefined, decimals = 1) { if (value === null || value === undefined) return '0%'; const num = parseFloat(String(value)); if (isNaN(num)) return '0%'; return `${num.toFixed(decimals)}%`; }
export function formatDate(dateStr: string | number | null | undefined) { if (!dateStr) return '--'; try { const date = new Date(dateStr as string | number); if (isNaN(date.getTime())) return '--'; return date.toLocaleDateString('pt-BR'); } catch { return '--'; } }
export function formatTime(dateStr: string | number | null | undefined) { if (!dateStr) return '--'; try { const date = new Date(dateStr as string | number); if (isNaN(date.getTime())) return '--'; return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return '--'; } }
export function formatRelative(dateStr: string | number | null | undefined) { if (!dateStr) return '--'; const now = Date.now(); const ts = new Date(dateStr as string | number).getTime(); const diff = now - ts; if (diff < 60000) return 'agora'; if (diff < 3600000) return `${Math.floor(diff / 60000)} min`; if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`; return `${Math.floor(diff / 86400000)}d`; }
export function escapeHtml(text: string) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
export function truncate(text: string, max = 50) { if (!text) return ''; return text.length <= max ? text : `${text.slice(0, max)}...`; }
export function debounce(fn: (...args: unknown[]) => void, delay = 300) { let t: ReturnType<typeof setTimeout>; return (...a: unknown[]) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { formatCurrency, formatNumber, formatCompact, formatPercent, formatDate, formatTime, formatRelative, escapeHtml, truncate, debounce };
