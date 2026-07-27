// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-notifications-ui-template
// PURPOSE: Panel User Notifications - Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID, NOTIFICATION_CHANNELS, NOTIFICATION_TYPES from ../core/constants.js
//
// PROVIDES:
//   renderSkeleton() — exported function
//   renderAuthBlocked() — exported function
//   renderError() — exported function
//   renderNotifications() — exported function
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

import { NOTIFICATION_CHANNELS, NOTIFICATION_TYPES } from '../core/constants.js';
// MODULE_ID declared locally below

export function renderSkeleton() {
  return `
    <div class="panel-user-notifications skeleton" data-module="${MODULE_ID}">
      <div class="panel-header"><div class="skeleton-title"></div></div>
      <div class="panel-content">
        <div class="skeleton-section"></div>
        <div class="skeleton-section"></div>
      </div>
    </div>
  `;
}

export function renderAuthBlocked() {
  return `
    <div class="panel-user-notifications auth-blocked" data-module="${MODULE_ID}">
      <div class="panel-header"><h2>Notificações</h2></div>
      <div class="panel-content">
        <div class="auth-message">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <h3>Acesso Restrito</h3>
          <p>Faça login para configurar suas notificações</p>
          <button class="btn-login" data-action="login">Entrar</button>
        </div>
      </div>
    </div>
  `;
}

export function renderError(message: string) {
  return `
    <div class="panel-user-notifications error" data-module="${MODULE_ID}">
      <div class="panel-header"><h2>Notificações</h2></div>
      <div class="panel-content">
        <div class="error-message">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Erro ao Carregar</h3>
          <p>${message}</p>
          <button class="btn-retry" data-action="retry">Tentar Novamente</button>
        </div>
      </div>
    </div>
  `;
}

interface NotificationSettings {
  channels?: Record<string, unknown>;
  types?: Record<string, unknown>;
  frequency?: { mode?: string };
  quietHours?: { enabled?: boolean; start?: string; end?: string };
  [key: string]: unknown;
}

export function renderNotifications(settings: Record<string, unknown>, isDirty: boolean, saving: boolean) {
  const s = settings as NotificationSettings;
  return `
    <div class="panel-user-notifications" data-module="${MODULE_ID}">
      <div class="panel-header">
        <h2>Notificações</h2>
        <p class="panel-subtitle">Configure como e quando receber alertas</p>
      </div>
      
      <div class="panel-content">
        <!-- Seção Canais -->
        <section class="notifications-section">
          <h3>Canais de Notificação</h3>
          <div class="channels-grid">
            ${NOTIFICATION_CHANNELS.map(channel => `
              <div class="channel-card ${channel.disabled ? 'disabled' : ''}">
                <div class="channel-header">
                  <div class="channel-icon">${getChannelIcon(channel.icon)}</div>
                  <div class="channel-info">
                    <h4>${channel.label}</h4>
                    <p>${channel.description}</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" 
                           data-category="channels" 
                           data-key="${channel.id}" 
                           ${s.channels?.[channel.id] ? 'checked' : ''}
                           ${channel.disabled ? 'disabled' : ''}>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Seção Tipos -->
        <section class="notifications-section">
          <h3>Tipos de Notificação</h3>
          <div class="types-grid">
            ${NOTIFICATION_TYPES.map(type => `
              <div class="type-card">
                <div class="type-info">
                  <h4>${type.label}</h4>
                  <p>${type.description}</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" 
                         data-category="types" 
                         data-key="${type.id}" 
                         ${s.types?.[type.id] !== false ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Seção Frequência -->
        <section class="notifications-section">
          <h3>Frequência</h3>
          <div class="frequency-options">
            <label class="radio-option">
              <input type="radio" name="frequency" value="immediate" 
                     data-category="frequency" data-key="mode"
                     ${s.frequency?.mode !== 'digest' ? 'checked' : ''}>
              <span class="radio-label">
                <strong>Imediato</strong>
                <small>Receber notificações assim que ocorrerem</small>
              </span>
            </label>
            <label class="radio-option">
              <input type="radio" name="frequency" value="digest" 
                     data-category="frequency" data-key="mode"
                     ${s.frequency?.mode === 'digest' ? 'checked' : ''}>
              <span class="radio-label">
                <strong>Resumo Diário</strong>
                <small>Receber um resumo consolidado por dia</small>
              </span>
            </label>
          </div>
        </section>

        <!-- Seção Horário de Silêncio -->
        <section class="notifications-section">
          <h3>Horário de Silêncio</h3>
          <div class="quiet-hours">
            <label class="toggle-row">
              <span>Ativar horário de silêncio</span>
              <label class="toggle-switch">
                <input type="checkbox" 
                       data-category="quietHours" 
                       data-key="enabled"
                       ${s.quietHours?.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </label>
            <div class="time-range ${!s.quietHours?.enabled ? 'disabled' : ''}">
              <div class="time-input">
                <label>Início</label>
                <input type="time" value="${s.quietHours?.start || '22:00'}"
                       data-category="quietHours" data-key="start"
                       ${!s.quietHours?.enabled ? 'disabled' : ''}>
              </div>
              <span class="time-separator">até</span>
              <div class="time-input">
                <label>Fim</label>
                <input type="time" value="${s.quietHours?.end || '08:00'}"
                       data-category="quietHours" data-key="end"
                       ${!s.quietHours?.enabled ? 'disabled' : ''}>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="panel-footer">
        <div class="footer-status">
          ${isDirty ? '<span class="unsaved-indicator">Alterações não salvas</span>' : ''}
        </div>
        <div class="footer-actions">
          <button class="btn-cancel" data-action="cancel" ${!isDirty ? 'disabled' : ''}>Cancelar</button>
          <button class="btn-save" data-action="save" ${!isDirty || saving ? 'disabled' : ''}>
            ${saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function getChannelIcon(icon: string) {
  const icons: Record<string, string> = {
    bell: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
    mail: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
    'message-circle': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
    send: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'
  };
  return icons[icon] || icons.bell;
}

export default { renderSkeleton, renderAuthBlocked, renderError, renderNotifications };

export const MODULE_ID = 'panels-panel-user-notifications-ui-template';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } }; }
