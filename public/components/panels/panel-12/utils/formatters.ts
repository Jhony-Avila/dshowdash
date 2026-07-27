// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.9.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-12-utils-formatters
// PURPOSE: Formatters Utility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   escapeHtml() — exported function
//   formatDatetime() — exported function
//   formatNumber() — exported function
//   normalizeText() — exported function
//   highlightText() — exported function
//   clamp() — exported function
//   formatPercentage() — exported function
//   formatDuration() — exported function
//   truncate() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   ... and 1 more exports
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-panel-12-utils-formatters';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
const _debug = () => _getPort('config')?.app?.debug ?? false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (level === 'error') { logger?.error?.('[Formatters]', ...args); return; } if (level === 'warn') { logger?.warn?.('[Formatters]', ...args); return; } if (_debug()) logger?.debug?.('[Formatters]', ...args); };
export const escapeHtml = (text: unknown) => { if (!text) return ''; const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return String(text).replace(/[&<>"']/g, (m: string) => map[m]); };
export const formatDatetime = (datetime: string | null | undefined) => { if (!datetime) return '--'; try { const date = new Date(datetime); if (isNaN(date.getTime())) return '--'; return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { _log('error', 'Erro ao formatar data:', e); return '--'; } };
export const formatNumber = (num: unknown) => (!num || isNaN(Number(num))) ? '0' : parseInt(String(num)).toLocaleString('pt-BR');
export const normalizeText = (text: unknown) => text ? String(text).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') : '';
export const highlightText = (text: string, term: string) => { if (!term || !text) return escapeHtml(text); const escapedText = escapeHtml(text); const escapedTerm = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return escapedText.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<span class="painel-12-highlight">$1</span>'); };
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const formatPercentage = (value: unknown, decimals = 2) => `${(parseFloat(String(value)) || 0).toFixed(decimals)}%`;
export const formatDuration = (seconds: unknown) => { if (!seconds || isNaN(Number(seconds))) return '--'; const num = parseFloat(String(seconds)); if (num < 60) return `${num.toFixed(2)}s`; return `${Math.floor(num / 60)}m ${Math.floor(num % 60)}s`; };
export const truncate = (text: unknown, maxLength = 50, suffix = '...') => { if (!text) return ''; const str = String(text); return str.length <= maxLength ? str : str.substring(0, maxLength - suffix.length) + suffix; };
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized, timestamp: Date.now() });
export const healthCheck = () => ({ status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: true, loggerReady: !!_getPort('logger'), portsInitialized: Ports.snapshot()._initialized }, timestamp: Date.now() });
export function getVersion() { return VERSION; }
