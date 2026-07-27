// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-permissions-admin:templates-helpers
// PURPOSE: Panel Permissions Admin - Templates Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getLevelBadgeClass() — exported function
//   getLevelLabel() — exported function
//   getLevelColor() — exported function
//   getLevelIcon() — exported function
//   formatDate() — exported function
//   formatRelativeDate() — exported function
//   formatPermissionState() — exported function
//   getStateIcon() — exported function
//   getStateBadgeClass() — exported function
//   truncateText() — exported function
//   escapeHtml() — exported function
//   getInitials() — exported function
//   getLevelClass() — exported function
//   groupByArea() — exported function
//   formatArea() — exported function
//   formatTimeAgo() — exported function
//   calculatePercentage() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
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
export const MODULE_ID = 'panel-permissions-admin:templates-helpers';

// P3.5: NOTA - Estas funções são para EXIBIÇÃO VISUAL apenas
// O controle de acesso real é feito via UARPSGate no backend
// Níveis são usados apenas para mostrar badges informativos na UI

// P3.5: Mapeamento visual de níveis para classes CSS (UI only)
export function getLevelBadgeClass(level: number) {
  // P3.5: UI VISUAL - Não é controle de acesso
  if (level >= 100) return 'ppa-badge--super-admin';
  if (level >= 80) return 'ppa-badge--admin';
  if (level >= 60) return 'ppa-badge--moderator';
  if (level >= 40) return 'ppa-badge--advanced';
  if (level >= 20) return 'ppa-badge--user';
  return 'ppa-badge--guest';
}

// P3.5: Mapeamento visual de níveis para labels (UI only)
export function getLevelLabel(level: number) {
  // P3.5: UI VISUAL - Não é controle de acesso
  if (level >= 100) return 'Super Admin';
  if (level >= 80) return 'Admin';
  if (level >= 60) return 'Moderador';
  if (level >= 40) return 'Avançado';
  if (level >= 20) return 'Usuário';
  return 'Visitante';
}

// P3.5: Mapeamento visual de níveis para cores (UI only)
export function getLevelColor(level: number) {
  // P3.5: UI VISUAL - Não é controle de acesso
  if (level >= 100) return '#9c27b0'; // Roxo
  if (level >= 80) return '#f44336';  // Vermelho
  if (level >= 60) return '#ff9800';  // Laranja
  if (level >= 40) return '#4caf50';  // Verde
  if (level >= 20) return '#2196f3';  // Azul
  return '#9e9e9e'; // Cinza
}

// P3.5: Mapeamento visual de níveis para ícones (UI only)
export function getLevelIcon(level: number) {
  // P3.5: UI VISUAL - Não é controle de acesso
  if (level >= 100) return 'crown';
  if (level >= 80) return 'shield-check';
  if (level >= 60) return 'shield';
  if (level >= 40) return 'user-check';
  if (level >= 20) return 'user';
  return 'user-x';
}

export function formatDate(dateString: string, options: Record<string, unknown> = {}) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleString('pt-BR', { ...defaultOptions, ...options } as Intl.DateTimeFormatOptions);
  } catch (e) {
    return dateString;
  }
}

export function formatRelativeDate(dateString: string) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const now = new Date();

    // @ts-expect-error TS migration - TS2362, TS2363
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return formatDate(dateString, { hour: undefined, minute: undefined });
  } catch (e) {
    return dateString;
  }
}

export function formatPermissionState(state: string) {
  const stateMap: Record<string, string> = {
    'allow': 'Permitido',
    'deny': 'Negado',
    'inherit': 'Herdado'
  };
  return stateMap[state] || state || '-';
}

export function getStateIcon(state: string) {
  const iconMap: Record<string, string> = {
    'allow': '<svg class="ppa-icon ppa-icon--allow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    'deny': '<svg class="ppa-icon ppa-icon--deny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    'inherit': '<svg class="ppa-icon ppa-icon--inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  return iconMap[state] || '';
}

export function getStateBadgeClass(state: string) {
  const classMap: Record<string, string> = {
    'allow': 'ppa-state--allow',
    'deny': 'ppa-state--deny',
    'inherit': 'ppa-state--inherit'
  };
  return classMap[state] || 'ppa-state--unknown';
}

export function truncateText(text: string, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

export function escapeHtml(text: string) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// P3.5: Iniciais do nome (UI only)
export function getInitials(name: string) {
  if (!name) return '?';
  return name.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// P3.5: Classe CSS baseada no nível (UI only)
export function getLevelClass(level: number) {
  if (level >= 100) return 'super-admin';
  if (level >= 80) return 'admin';
  if (level >= 60) return 'moderator';
  if (level >= 40) return 'advanced';
  if (level >= 20) return 'user';
  return 'guest';
}

// P3.5: Agrupa triggers por área (UI only)
export function groupByArea(triggers: Record<string, unknown>[]) {
  const grouped: Record<string, Record<string, unknown>[]> = {};
  (triggers || []).forEach((t: Record<string, unknown>) => {
    const area = String(t.area || t.region || 'other');
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(t);
  });
  return grouped;
}

// P3.5: Formata nome da área para exibição (UI only)
export function formatArea(area: string) {
  const areaMap: Record<string, string> = {
    'navrail': 'Nav Rail',
    'sidebar': 'Sidebar',
    'footer': 'Footer',
    'header': 'Header',
    'panel': 'Painel',
    'other': 'Outros'
  };
  return areaMap[area] || area || 'Outros';
}

// P3.5: Formato relativo de tempo (UI only)
export function formatTimeAgo(timestamp: number | string) {
  if (!timestamp) return '-';
  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    const now = new Date();

    // @ts-expect-error TS migration - TS2362, TS2363
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffSecs < 60) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`;
    return formatDate(String(date), { hour: undefined, minute: undefined });
  } catch (e) {
    return '-';
  }
}

// P3.5: Calcula percentual seguro (UI only)
export function calculatePercentage(part: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    note: 'UI visual helpers only - not access control'
  };
}

export function getVersion() {
  return VERSION;
}

export default {
  VERSION,
  MODULE_ID,
  getLevelBadgeClass,
  getLevelLabel,
  getLevelColor,
  getLevelIcon,
  formatDate,
  formatRelativeDate,
  formatPermissionState,
  getStateIcon,
  getStateBadgeClass,
  truncateText,
  escapeHtml,
  getInitials,
  getLevelClass,
  groupByArea,
  formatArea,
  formatTimeAgo,
  calculatePercentage,
  healthCheck,
  getVersion
};
