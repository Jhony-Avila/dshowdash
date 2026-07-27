// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.9.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/formatters
// PURPOSE: Panel 01 - Formatters Utility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//   escapeHtml() — exported function
//   formatCurrency() — exported function
//   formatDate() — exported function
//   formatDateTime() — exported function
//   formatNumber() — exported function
//   truncate() — exported function
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
export const MODULE_ID = 'panel-01/utils/formatters';
const escapeHtml = (text: unknown) => { if (!text) return ''; const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return String(text).replace(/[&<>"']/g, m => map[m]); };
const formatCurrency = (value: unknown) => { if (value === null || value === undefined) return 'R$ 0,00'; const num = parseFloat(String(value)); if (isNaN(num)) return 'R$ 0,00'; return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
const formatDate = (dateStr: unknown) => { if (!dateStr) return '--'; try { const date = new Date(String(dateStr)); if (isNaN(date.getTime())) return '--'; return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return '--'; } };
const formatDateTime = (dateStr: unknown) => { if (!dateStr) return '--'; try { const date = new Date(String(dateStr)); if (isNaN(date.getTime())) return '--'; return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '--'; } };
const formatNumber = (num: unknown) => (!num || isNaN(Number(num))) ? '0' : parseInt(String(num)).toLocaleString('pt-BR');
const truncate = (text: unknown, maxLength = 50, suffix = '...') => { if (!text) return ''; const str = String(text); return str.length <= maxLength ? str : str.substring(0, maxLength - suffix.length) + suffix; };
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: true }, timestamp: Date.now() });
export function getVersion() { return VERSION; }
export { escapeHtml, formatCurrency, formatDate, formatDateTime, formatNumber, truncate };
