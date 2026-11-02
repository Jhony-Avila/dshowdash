// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-mfe/ui
// PURPOSE: Login MFE UI Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   setConfig
//   renderSkeleton
//   renderUI
//   clearUI
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'login-mfe/ui';

// P3.5-AAA: Contexto injetado pelo entry.js
let _injectedConfig = { environment: 'production', version: '3.0.0' };

export function setConfig(config: { environment?: string; version?: string }) {
  if (config?.environment) _injectedConfig.environment = config.environment;
  if (config?.version) _injectedConfig.version = config.version;
}

function _sanitize(str: string) {
  if (!str) return '';
  // @ts-expect-error strict migration — TS2769
  return String(str).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _getEnvPill() {
  // P3.5-AAA: Usar config injetado, ZERO window.*
  const env = _injectedConfig.environment || 'production';
  const envMap: Record<string, { cls: string; label: string }> = { development: { cls: 'login-pill--dev', label: 'DEV' }, homolog: { cls: 'login-pill--homolog', label: 'HOMOLOG' }, staging: { cls: 'login-pill--homolog', label: 'STAGING' }, production: { cls: 'login-pill--prod', label: 'PROD' } };
  const cfg = envMap[env] || envMap.production;
  return `<span class="login-pill ${cfg.cls}">${cfg.label}</span>`;
}

function _getVersion() {
  // P3.5-AAA: Usar config injetado, ZERO window.*
  const ver = _injectedConfig.version || '3.0.0';
  return `<span class="login-version">v${ver}</span>`;
}

export function renderSkeleton() {
  return `<div class="login-page" role="main" aria-label="Carregando login"><div class="login-container"><div class="login-card login-skeleton"><div class="login-brand"><div class="login-skeleton-logo"></div><div class="login-skeleton-title"></div><div class="login-skeleton-subtitle"></div></div><div class="login-skeleton-btn"></div></div></div></div>`;
}

export function renderUI(options: { brand?: { icon: string; title: string; subtitle: string }; message?: { title: string; text: string }; showEnvPill?: boolean; showVersion?: boolean; error?: string | null } = {}) {
  const { brand = { icon: '📊', title: 'DshowDash', subtitle: 'Dashboard de Operações' }, message = { title: 'Bem-vindo de volta', text: 'Acesse seu painel de operações e acompanhe seus indicadores em tempo real.' }, showEnvPill = true, showVersion = true, error = null } = options;
  const envPill = showEnvPill ? _getEnvPill() : '';
  const version = showVersion ? _getVersion() : '';
  const errorHtml = error ? `<div class="login-error" role="alert" style="display:flex;"><span>⚠️</span><span>${_sanitize(error)}</span></div>` : `<div class="login-error" role="alert" style="display:none;"></div>`;
  return `
<div class="login-page" role="main" aria-label="Tela de login do sistema DshowDash">
  <div class="login-container">
    <div class="login-card">
      <div class="login-brand">
        <div class="login-logo" aria-hidden="true">${brand.icon}</div>
        <h1 class="login-title">${_sanitize(brand.title)}</h1>
        <p class="login-subtitle">${_sanitize(brand.subtitle)}</p>
      </div>
      <div class="login-message">
        <p class="login-message-title">${_sanitize(message.title)}</p>
        <p class="login-message-text">${_sanitize(message.text)}</p>
      </div>
      ${errorHtml}
      <div class="login-actions">
        <button class="login-btn" data-action="open-login" aria-label="Abrir formulário de login">
          <span>🔐</span><span>Entrar no Sistema</span>
        </button>
      </div>
      <div class="login-links">
        <a href="#" data-action="forgot-password" class="login-link">Esqueceu a senha?</a>
        <span class="login-link-separator">•</span>
        <a href="#" data-action="support" class="login-link">Suporte</a>
      </div>
      <div class="login-footer">
        ${envPill}${version}
      </div>
    </div>
  </div>
</div>`;
}

export function clearUI(container: HTMLElement) {
  if (container) container.innerHTML = '';
}

export default { renderUI, renderSkeleton, clearUI, setConfig, VERSION, MODULE_ID };
