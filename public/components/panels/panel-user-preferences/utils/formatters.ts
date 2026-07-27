// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences/utils/formatters
// PURPOSE: Panel User Preferences - Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatDate() — exported function
//   formatDateTime() — exported function
//   formatRelativeTime() — exported function
//   formatTheme() — exported function
//   formatDensity() — exported function
//   formatLanguage() — exported function
//   formatFontSize() — exported function
//   formatBoolean() — exported function
//   formatToggle() — exported function
//   escapeHtml() — exported function
//   truncate() — exported function
//   debounce() — exported function
//   info() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences/utils/formatters';

export function formatDate(dateStr: string) {
  if (!dateStr) return '--';
  try { const date = new Date(dateStr); if (isNaN(date.getTime())) return '--'; return date.toLocaleDateString('pt-BR'); } catch { return '--'; }
}

export function formatDateTime(dateStr: string) {
  if (!dateStr) return '--';
  try { const date = new Date(dateStr); if (isNaN(date.getTime())) return '--'; return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return '--'; }
}

export function formatRelativeTime(dateStr: string) {
  if (!dateStr) return '--';
  try {
    const date = new Date(dateStr);
    const now = new Date();

    // @ts-expect-error TS migration - TS2362, TS2363
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
  } catch { return '--'; }
}

export function formatTheme(theme: string) {
  const map: Record<string, string> = { light: '☀️ Claro', dark: '🌙 Escuro', system: '🖥️ Sistema', auto: '🔄 Automático' };
  return map[theme] || theme || '--';
}

export function formatDensity(density: string) {
  const map: Record<string, string> = { compact: 'Compacto', comfortable: 'Confortável', spacious: 'Espaçoso' };
  return map[density] || density || '--';
}

export function formatLanguage(lang: string) {
  const map: Record<string, string> = { 'pt-BR': '🇧🇷 Português', 'en-US': '🇺🇸 English', 'es-ES': '🇪🇸 Español' };
  return map[lang] || lang || '--';
}

export function formatFontSize(size: string) {
  const map: Record<string, string> = { small: 'Pequeno', medium: 'Médio', large: 'Grande', 'x-large': 'Extra Grande' };
  return map[size] || size || '--';
}

export function formatBoolean(value: boolean, trueText = 'Sim', falseText = 'Não') {
  return value ? trueText : falseText;
}

export function formatToggle(value: boolean) {
  return value ? '✓ Ativo' : '✗ Inativo';
}

export function escapeHtml(text: string) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
export function truncate(text: string, maxLength = 50) { if (!text) return ''; if (text.length <= maxLength) return text; return `${text.substring(0, maxLength)}...`; }
export function debounce(fn: (...args: unknown[]) => void, delay = 300) { let timer: ReturnType<typeof setTimeout> | null = null; return (...args: unknown[]) => { clearTimeout(timer!); timer = setTimeout(() => fn(...args), delay); }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { formatDate, formatDateTime, formatRelativeTime, formatTheme, formatDensity, formatLanguage, formatFontSize, formatBoolean, formatToggle, escapeHtml, truncate, debounce };
