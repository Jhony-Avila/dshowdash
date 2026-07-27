// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-sessions/ui/template
// PURPOSE: Panel User Sessions - Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID as CORE_MODULE_ID from ../core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderSkeleton() — exported function
//   renderAuthBlocked() — exported function
//   renderError() — exported function
//   renderSessions() — exported function
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

import { MODULE_ID as CORE_MODULE_ID } from '../core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-sessions/ui/template';

export interface Session {
  id: string;
  active?: boolean;
  device_type?: string;
  device?: string;
  browser?: string;
  os?: string;
  ip?: string;
  location?: string;
  last_activity?: string;
}

export interface LoginHistoryEntry {
  success: boolean;
  timestamp?: string;
  device?: string;
  ip?: string;
}

export function renderSkeleton() {
  return `\
    <div class="panel-user-sessions skeleton" data-module="${CORE_MODULE_ID}">\
      <div class="panel-header"><div class="skeleton-title"></div></div>\
      <div class="panel-content">\
        <div class="skeleton-card"></div>\
        <div class="skeleton-card"></div>\
        <div class="skeleton-card"></div>\
      </div>\
    </div>\
  `;
}

export function renderAuthBlocked() {
  return `\
    <div class="panel-user-sessions auth-blocked" data-module="${CORE_MODULE_ID}">\
      <div class="panel-header"><h2>Sessões Ativas</h2></div>\
      <div class="panel-content">\
        <div class="auth-message">\
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>\
            <line x1="8" y1="21" x2="16" y2="21"></line>\
            <line x1="12" y1="17" x2="12" y2="21"></line>\
          </svg>\
          <h3>Acesso Restrito</h3>\
          <p>Faça login para ver suas sessões ativas</p>\
          <button class="btn-login" data-action="login">Entrar</button>\
        </div>\
      </div>\
    </div>\
  `;
}

export function renderError(message: string) {
  return `\
    <div class="panel-user-sessions error" data-module="${CORE_MODULE_ID}">\
      <div class="panel-header"><h2>Sessões Ativas</h2></div>\
      <div class="panel-content">\
        <div class="error-message">\
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
            <circle cx="12" cy="12" r="10"></circle>\
            <line x1="12" y1="8" x2="12" y2="12"></line>\
            <line x1="12" y1="16" x2="12.01" y2="16"></line>\
          </svg>\
          <h3>Erro ao Carregar</h3>\
          <p>${message}</p>\
          <button class="btn-retry" data-action="retry">Tentar Novamente</button>\
        </div>\
      </div>\
    </div>\
  `;
}

export function renderSessions(sessions: Session[], currentSessionId: string | null, loginHistory: LoginHistoryEntry[], terminating: string | null) {
  const activeSessions = sessions.filter((s: Session) => s.active !== false);
  const otherSessions = activeSessions.filter((s: Session) => s.id !== currentSessionId);
  const currentSession = sessions.find((s: Session) => s.id === currentSessionId) || sessions[0];
  
  let otherSessionsHtml = '';
  if (otherSessions.length > 0) {
    const sessionCards = otherSessions.map((session: Session) => renderSessionCard(session, terminating)).join('');
    otherSessionsHtml = `<div class="sessions-list">${sessionCards}</div>`;
  } else {
    otherSessionsHtml = '<div class="empty-state"><p>Nenhuma outra sessão ativa</p></div>';
  }
  
  const terminateAllBtn = otherSessions.length > 0 ? '<button class="btn-danger-outline" data-action="terminate-all">Encerrar Todas</button>' : '';
  
  let historyHtml = '';
  if (loginHistory.length > 0) {
    const rows = loginHistory.slice(0, 10).map((entry: LoginHistoryEntry) => {
      const rowClass = entry.success ? '' : 'failed';
      const statusClass = entry.success ? 'success' : 'failed';
      const statusText = entry.success ? 'Sucesso' : 'Falhou';
      return `<tr class="${rowClass}"><td>${formatDate(entry.timestamp)}</td><td>${entry.device || 'Desconhecido'}</td><td>${entry.ip || 'N/A'}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td></tr>`;
    }).join('');
    historyHtml = `<div class="login-history"><table class="history-table"><thead><tr><th>Data/Hora</th><th>Dispositivo</th><th>IP</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else {
    historyHtml = '<div class="empty-state"><p>Nenhum histórico disponível</p></div>';
  }
  
  return `\
    <div class="panel-user-sessions" data-module="${CORE_MODULE_ID}">\
      <div class="panel-header">\
        <h2>Sessões Ativas</h2>\
        <p class="panel-subtitle">Gerencie dispositivos conectados à sua conta</p>\
      </div>\
      <div class="panel-content">\
        <section class="sessions-section">\
          <h3>Sessão Atual</h3>\
          ${renderCurrentSession(currentSession)}\
        </section>\
        <section class="sessions-section">\
          <div class="section-header">\
            <h3>Outras Sessões (${otherSessions.length})</h3>\
            ${terminateAllBtn}\
          </div>\
          ${otherSessionsHtml}\
        </section>\
        <section class="sessions-section">\
          <h3>Últimos Logins</h3>\
          ${historyHtml}\
        </section>\
      </div>\
    </div>\
  `;
}

function renderCurrentSession(session: Session | undefined) {
  if (!session) return '<div class="empty-state"><p>Sessão atual não identificada</p></div>';
  
  return `\
    <div class="session-card current">\
      <div class="session-icon">${getDeviceIcon(session.device_type)}</div>\
      <div class="session-info">\
        <div class="session-device">\
          <strong>${session.device || 'Este dispositivo'}</strong>\
          <span class="current-badge">Atual</span>\
        </div>\
        <div class="session-details">\
          <span>${session.browser || 'Navegador'} • ${session.os || 'Sistema'}</span>\
          <span>${session.ip || 'IP não disponível'} • ${session.location || ''}</span>\
        </div>\
        <div class="session-activity">\
          Última atividade: ${formatDate(session.last_activity) || 'Agora'}\
        </div>\
      </div>\
    </div>\
  `;
}

function renderSessionCard(session: Session, terminating: string | null) {
  const isTerminating = terminating === session.id;
  const disabledAttr = isTerminating ? 'disabled' : '';
  const btnText = isTerminating ? 'Encerrando...' : 'Encerrar';
  
  return `\
    <div class="session-card" data-session-id="${session.id}">\
      <div class="session-icon">${getDeviceIcon(session.device_type)}</div>\
      <div class="session-info">\
        <div class="session-device">\
          <strong>${session.device || 'Dispositivo desconhecido'}</strong>\
        </div>\
        <div class="session-details">\
          <span>${session.browser || 'Navegador'} • ${session.os || 'Sistema'}</span>\
          <span>${session.ip || 'IP não disponível'} • ${session.location || ''}</span>\
        </div>\
        <div class="session-activity">\
          Última atividade: ${formatDate(session.last_activity) || 'Desconhecido'}\
        </div>\
      </div>\
      <button class="btn-terminate" data-action="terminate" data-session-id="${session.id}" ${disabledAttr}>${btnText}</button>\
    </div>\
  `;
}

function getDeviceIcon(type: string | undefined) {
  const icons: Record<string, string> = {
    desktop: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    mobile: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
    tablet: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'
  };
  return (type && icons[type]) || icons['desktop'];
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    const now = new Date();

    // @ts-expect-error TS migration - TS2362, TS2363
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return 'N/A'; }
}

export default { renderSkeleton, renderAuthBlocked, renderError, renderSessions };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } }; }
