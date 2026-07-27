// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panels-panel-account-security-template
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./icons.js
//   timeAgo, getSecurityScore, getPasswordStrengthLabel from ./helpers.js
//
// PROVIDES:
//   renderAuthBlocked() — exported function
//   renderSkeleton() — exported function
//   renderPanel() — exported function
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
// Panel Account Security - Templates
// @version 1.2.0-P17WI-AAA-ES6
// P14 AAA: Removido onclick com window.* - usa data-action

import { ICONS } from './icons.js';

// @ts-expect-error TS migration - TS2305
import { timeAgo, getSecurityScore, getPasswordStrengthLabel } from './helpers.js';

export function renderAuthBlocked() {
  return `<div class="pas-panel"><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;padding:2rem;text-align:center;"><div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,rgba(139,92,246,0.15) 0%,rgba(139,92,246,0.08) 100%);display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:#a78bfa;">${ICONS.lock}</div><h3 style="font-size:16px;font-weight:600;margin:0 0 6px;color:rgba(255,255,255,0.9);">Acesso Restrito</h3><p style="margin:0 0 20px;color:var(--pas-text-mut);font-size:12px;">Faça login para acessar as configurações de segurança</p><button data-action="auth:login-request" class="pas-btn primary">Entrar</button></div></div>`;
}

export function renderSkeleton() {
  return '<div class="pas-panel">' +
    '<div class="pas-scroll" style="padding-top:16px;">' +
      '<div class="pas-skel pas-skel-card"></div>' +
      '<div class="pas-skel pas-skel-card"></div>' +
      '<div class="pas-skel pas-skel-card" style="height:150px;"></div>' +
    '</div>' +
  '</div>';
}

interface PanelState {
  securityInfo?: Record<string, unknown>;
  showPasswordForm?: boolean;
  changingPassword?: boolean;
  sessions?: Record<string, unknown>[];
  twoFactorEnabled?: boolean;
  showPassword?: Record<string, boolean>;
  passwordStrength?: number;
  activityLog?: Record<string, unknown>[];
  [key: string]: unknown;
}

export function renderPanel(state: PanelState, mountedAt: number | null) {
  const securityInfo = state.securityInfo;
  const showPasswordForm = state.showPasswordForm;
  const changingPassword = state.changingPassword ?? false;
  const sessions = state.sessions ?? [];
  const twoFactorEnabled = state.twoFactorEnabled;
  const showPassword = state.showPassword ?? {};
  const passwordStrength = state.passwordStrength ?? 0;
  const activityLog = state.activityLog ?? [];
  const info = (securityInfo || {}) as Record<string, unknown>;
  const failedAttempts = (info.failedAttempts as number) || 0;
  const score = getSecurityScore(state);
  const scoreClass = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return `<div class="pas-panel" role="main"><div class="pas-live-region" role="status" aria-live="polite" aria-atomic="true"></div><header class="pas-hdr"><div class="pas-hdr-left"><div class="pas-hdr-icon">${ICONS.shieldCheck}</div><div class="pas-hdr-info"><h1 class="pas-hdr-title">Segurança da Conta</h1><span class="pas-hdr-subtitle">Gerencie suas credenciais e proteções</span></div></div><div class="pas-hdr-right"><span class="pas-hdr-meta">${ICONS.refresh} ${timeAgo(mountedAt)}</span><div class="pas-score"><div class="pas-score-bar"><div class="pas-score-fill ${scoreClass}" style="width:${score}%"></div></div><span class="pas-score-text ${scoreClass}">${score}%</span></div></div></header><div class="pas-scroll"><section class="pas-section pas-fade"><div class="pas-sec-hdr"><div class="pas-sec-left"><div class="pas-sec-icon purple">${ICONS.key}</div><h2 class="pas-sec-title">Credenciais</h2></div></div><div class="pas-card"><div class="pas-card-hdr"><div class="pas-card-icon password">${ICONS.lock}</div><div class="pas-card-info"><h3 class="pas-card-title">Senha</h3><p class="pas-card-desc">Última alteração: ${info.lastPasswordChange || 'Nunca alterada'}</p></div><button class="pas-btn ${showPasswordForm ? 'ghost' : 'secondary'}" data-action="toggle-password-form">${showPasswordForm ? `${ICONS.x} Cancelar` : `${ICONS.key} Alterar`}</button></div>${showPasswordForm ? renderPasswordForm(showPassword, changingPassword, passwordStrength, strengthInfo) : ''}</div><div class="pas-card" style="margin-top:12px;"><div class="pas-card-hdr"><div class="pas-card-icon twofa">${ICONS.fingerprint}</div><div class="pas-card-info"><h3 class="pas-card-title">Autenticação em Duas Etapas (2FA)</h3><p class="pas-card-desc">Camada extra de proteção para sua conta</p></div><div class="pas-toggle"><label class="pas-toggle-switch"><input type="checkbox" data-action="toggle-2fa" ${twoFactorEnabled ? 'checked' : ''}><span class="pas-toggle-track"></span></label><span class="pas-toggle-label">${twoFactorEnabled ? 'Ativo' : 'Inativo'}</span></div></div>${twoFactorEnabled ? `<div class="pas-card-body"><span class="pas-badge success">${ICONS.checkCircle} Proteção ativa</span><p style="font-size:10px;color:var(--pas-text-mut);margin:8px 0 0;">Sua conta está protegida com autenticação em duas etapas.</p></div>` : ''}</div></section><section class="pas-section pas-fade"><div class="pas-sec-hdr"><div class="pas-sec-left"><div class="pas-sec-icon green">${ICONS.activity}</div><h2 class="pas-sec-title">Atividade Recente</h2></div><button class="pas-sec-action" data-action="export-activity">${ICONS.download} Exportar</button></div><div class="pas-stats"><div class="pas-stat"><div class="pas-stat-label">Último Login</div><div class="pas-stat-value">${info.lastLogin || timeAgo(mountedAt)}</div></div><div class="pas-stat"><div class="pas-stat-label">Último IP</div><div class="pas-stat-value">${info.lastIp || '177.9.151.24'}</div></div><div class="pas-stat"><div class="pas-stat-label">Tentativas Falhas</div><div class="pas-stat-value ${failedAttempts > 0 ? 'error' : ''}">${failedAttempts}</div></div><div class="pas-stat"><div class="pas-stat-label">Status da Conta</div><div class="pas-stat-value success">${info.accountStatus === 'active' ? 'Ativa' : 'Ativa'}</div></div></div><div class="pas-card" style="margin-top:12px;"><div class="pas-timeline">${renderTimeline(activityLog)}</div></div></section><section class="pas-section pas-fade"><div class="pas-sec-hdr"><div class="pas-sec-left"><div class="pas-sec-icon blue">${ICONS.monitor}</div><h2 class="pas-sec-title">Sessões Ativas</h2></div><button class="pas-sec-action" data-action="revoke-all-sessions">${ICONS.logout} Encerrar Todas</button></div><div class="pas-card"><div class="pas-sessions">${renderSessions(sessions)}</div></div></section><section class="pas-section pas-fade"><div class="pas-sec-hdr"><div class="pas-sec-left"><div class="pas-sec-icon orange">${ICONS.bell}</div><h2 class="pas-sec-title">Alertas de Segurança</h2></div></div><div class="pas-card">${renderAlertSettings()}</div></section></div></div><div class="pas-modal-overlay" id="pas-confirm-modal"><div class="pas-modal"><div class="pas-modal-header"><span class="pas-modal-title">${ICONS.alert} Confirmar Ação</span><button class="pas-modal-close" data-action="close-modal">${ICONS.x}</button></div><div class="pas-modal-body"><p style="font-size:12px;color:var(--pas-text-sec);margin:0;" id="pas-confirm-message">Tem certeza?</p></div><div class="pas-modal-footer"><button class="pas-btn ghost" data-action="close-modal">Cancelar</button><button class="pas-btn danger" data-action="confirm-action">${ICONS.check} Confirmar</button></div></div></div>`;
}

function renderPasswordForm(showPassword: Record<string, boolean>, changingPassword: boolean, passwordStrength: number, strengthInfo: Record<string, string>) {
  let segs = '';
  for (let i = 1; i <= 5; i++) {
    segs += `<div class="pas-pwd-strength-seg ${passwordStrength >= i ? `active ${strengthInfo.class}` : ''}"></div>`;
  }
  return `<div class="pas-card-body"><div class="pas-form"><div class="pas-form-group"><label class="pas-form-label">Senha Atual</label><div class="pas-form-input-wrap"><input type="${showPassword.current ? 'text' : 'password'}" id="current-password" class="pas-form-input" placeholder="••••••••"><button type="button" class="pas-form-toggle" data-toggle="current">${showPassword.current ? ICONS.eyeOff : ICONS.eye}</button></div></div><div class="pas-form-group"><label class="pas-form-label">Nova Senha</label><div class="pas-form-input-wrap"><input type="${showPassword.new ? 'text' : 'password'}" id="new-password" class="pas-form-input" placeholder="Mínimo 8 caracteres" data-input="new-password"><button type="button" class="pas-form-toggle" data-toggle="new">${showPassword.new ? ICONS.eyeOff : ICONS.eye}</button></div><div class="pas-pwd-strength"><div class="pas-pwd-strength-bar">${segs}</div><div class="pas-pwd-strength-text"><span class="pas-pwd-strength-label">Força da senha</span><span class="pas-pwd-strength-value ${strengthInfo.class}">${strengthInfo.label}</span></div></div></div><div class="pas-form-group"><label class="pas-form-label">Confirmar Nova Senha</label><div class="pas-form-input-wrap"><input type="${showPassword.confirm ? 'text' : 'password'}" id="confirm-password" class="pas-form-input" placeholder="Repita a nova senha"><button type="button" class="pas-form-toggle" data-toggle="confirm">${showPassword.confirm ? ICONS.eyeOff : ICONS.eye}</button></div></div><button class="pas-btn primary" data-action="save-password" ${changingPassword ? 'disabled' : ''} style="margin-top:6px;">${changingPassword ? `${ICONS.loader} Salvando...` : `${ICONS.check} Salvar Nova Senha`}</button></div></div>`;
}

function renderTimeline(activityLog: Record<string, unknown>[]) {
  let html = '';
  const items = activityLog.slice(0, 5);
  for (let i = 0; i < items.length; i++) {
    const log = items[i];
    const icon = log.type === 'success' ? ICONS.checkCircle : log.type === 'warning' ? ICONS.alert : ICONS.info;
    html += `<div class="pas-timeline-item"><div class="pas-timeline-icon ${log.type}">${icon}</div><div class="pas-timeline-content"><div class="pas-timeline-text"><strong>${log.action}</strong> • IP: ${log.ip}</div><div class="pas-timeline-time">${timeAgo(log.timestamp)}</div></div></div>`;
  }
  return html;
}

function renderSessions(sessions: Record<string, unknown>[]) {
  let html = '';
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const device = session.device as string;
    const deviceIcon = (device.indexOf('iPhone') !== -1 || device.indexOf('Android') !== -1) ? ICONS.smartphone : ICONS.monitor;
    html += `<div class="pas-session ${session.current ? 'current' : ''}" data-session-id="${session.id}"><div class="pas-session-icon">${deviceIcon}</div><div class="pas-session-info"><div class="pas-session-device">${session.device}${session.current ? '<span class="pas-session-badge">Esta sessão</span>' : ''}</div><div class="pas-session-meta"><span>${ICONS.globe} ${session.ip}</span><span>${ICONS.mapPin} ${session.location}</span><span>${ICONS.clock} ${timeAgo(session.lastActive)}</span></div></div>${!session.current ? `<div class="pas-session-actions"><button class="pas-session-btn danger" data-action="revoke-session" data-session-id="${session.id}" title="Encerrar sessão">${ICONS.logout}</button></div>` : ''}</div>`;
  }
  return html;
}

function renderAlertSettings() {
  return '<div style="display:flex;flex-direction:column;gap:12px;">' +
'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03);">' +
'<div><div style="font-size:12px;font-weight:500;color:rgba(255,255,255,0.85);">Login em novo dispositivo</div>' +
'<div style="font-size:10px;color:var(--pas-text-mut);">Receba alerta quando detectarmos um novo dispositivo</div></div>' +
'<label class="pas-toggle-switch"><input type="checkbox" checked data-pref="alert_new_device"><span class="pas-toggle-track"></span></label>' +
'</div>' +
'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03);">' +
'<div><div style="font-size:12px;font-weight:500;color:rgba(255,255,255,0.85);">Tentativas de login suspeitas</div>' +
'<div style="font-size:10px;color:var(--pas-text-mut);">Alerta sobre tentativas de acesso não autorizadas</div></div>' +
'<label class="pas-toggle-switch"><input type="checkbox" checked data-pref="alert_suspicious"><span class="pas-toggle-track"></span></label>' +
'</div>' +
'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;">' +
'<div><div style="font-size:12px;font-weight:500;color:rgba(255,255,255,0.85);">Alteração de senha</div>' +
'<div style="font-size:10px;color:var(--pas-text-mut);">Confirme por email quando sua senha for alterada</div></div>' +
'<label class="pas-toggle-switch"><input type="checkbox" checked data-pref="alert_password_change"><span class="pas-toggle-track"></span></label>' +
'</div></div>';
}

export default { renderAuthBlocked, renderSkeleton, renderPanel };

export const MODULE_ID = 'panels-panels-panel-account-security-template';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } }; }
