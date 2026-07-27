function renderSkeleton() {
  return `
    <div class="panel-account-security skeleton" data-module="${MODULE_ID}">
      <div class="panel-header"><div class="skeleton-title"></div></div>
      <div class="panel-content">
        <div class="skeleton-section"></div>
        <div class="skeleton-section"></div>
      </div>
    </div>
  `;
}
function renderAuthBlocked() {
  return `
    <div class="panel-account-security auth-blocked" data-module="${MODULE_ID}">
      <div class="panel-header"><h2>Seguran\xE7a da Conta</h2></div>
      <div class="panel-content">
        <div class="auth-message">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <h3>Acesso Restrito</h3>
          <p>Fa\xE7a login para acessar as configura\xE7\xF5es de seguran\xE7a</p>
          <button class="btn-login" data-action="login">Entrar</button>
        </div>
      </div>
    </div>
  `;
}
function renderError(message) {
  return `
    <div class="panel-account-security error" data-module="${MODULE_ID}">
      <div class="panel-header"><h2>Seguran\xE7a da Conta</h2></div>
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
function renderSecurity(securityInfo, showPasswordForm, passwordForm, saving) {
  return `
    <div class="panel-account-security" data-module="${MODULE_ID}">
      <div class="panel-header">
        <h2>Seguran\xE7a da Conta</h2>
        <p class="panel-subtitle">Gerencie suas credenciais e configura\xE7\xF5es de seguran\xE7a</p>
      </div>
      
      <div class="panel-content">
        <!-- Se\xE7\xE3o Credenciais -->
        <section class="security-section">
          <h3>Credenciais</h3>
          <div class="security-card">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div class="card-content">
              <h4>Senha</h4>
              <p>\xDAltima altera\xE7\xE3o: ${securityInfo.lastPasswordChange || "Nunca alterada"}</p>
            </div>
            <button class="btn-action" data-action="toggle-password-form">Alterar Senha</button>
          </div>
          
          ${showPasswordForm ? renderPasswordForm(passwordForm, saving) : ""}
        </section>

        <!-- Se\xE7\xE3o Status da Conta -->
        <section class="security-section">
          <h3>Status da Conta</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value status-${securityInfo.accountStatus || "active"}">
                ${securityInfo.accountStatus === "active" ? "Ativa" : securityInfo.accountStatus || "Ativa"}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">MFA</span>
              <span class="info-value">${securityInfo.mfaEnabled ? "Ativado" : "N\xE3o configurado"}</span>
            </div>
          </div>
        </section>

        <!-- Se\xE7\xE3o Auditoria -->
        <section class="security-section">
          <h3>Atividade Recente</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">\xDAltimo Login</span>
              <span class="info-value">${securityInfo.lastLogin || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">\xDAltimo IP</span>
              <span class="info-value">${securityInfo.lastIp || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">\xDAltima Altera\xE7\xE3o de Senha</span>
              <span class="info-value">${securityInfo.lastPasswordChange || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tentativas de Login Falhas</span>
              <span class="info-value">${securityInfo.failedAttempts || "0"}</span>
            </div>
          </div>
        </section>

        <!-- A\xE7\xF5es R\xE1pidas -->
        <section class="security-section">
          <h3>A\xE7\xF5es R\xE1pidas</h3>
          <div class="actions-grid">
            <button class="btn-secondary" data-action="go-sessions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Ver Sess\xF5es Ativas
            </button>
            <button class="btn-secondary btn-danger" data-action="logout-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Encerrar Outras Sess\xF5es
            </button>
          </div>
        </section>
      </div>
    </div>
  `;
}
function renderPasswordForm(form, saving) {
  return `
    <div class="password-form">
      <div class="form-group">
        <label for="current-password">Senha Atual</label>
        <input type="password" id="current-password" data-field="current" value="${form.current}" autocomplete="current-password">
      </div>
      <div class="form-group">
        <label for="new-password">Nova Senha</label>
        <input type="password" id="new-password" data-field="new" value="${form.new}" autocomplete="new-password">
        <span class="field-hint">M\xEDnimo 8 caracteres</span>
      </div>
      <div class="form-group">
        <label for="confirm-password">Confirmar Nova Senha</label>
        <input type="password" id="confirm-password" data-field="confirm" value="${form.confirm}" autocomplete="new-password">
      </div>
      <div class="form-actions">
        <button class="btn-cancel" data-action="toggle-password-form">Cancelar</button>
        <button class="btn-save" data-action="change-password" ${saving ? "disabled" : ""}>
          ${saving ? "Salvando..." : "Alterar Senha"}
        </button>
      </div>
    </div>
  `;
}
var template_default = { renderSkeleton, renderAuthBlocked, renderError, renderSecurity };
const MODULE_ID = "panels-panel-account-security-ui-template";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  healthCheck,
  info,
  renderAuthBlocked,
  renderError,
  renderSecurity,
  renderSkeleton
};
