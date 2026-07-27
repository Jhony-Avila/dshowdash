import { MODULE_ID as CORE_MODULE_ID, ICONS } from "../core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-profile/ui/template";
function formatDate(dateStr) {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "\u2014";
  }
}
function renderSkeleton() {
  return `    <div class="pup" data-module="${CORE_MODULE_ID}">      <div class="pup-skeleton">        <div class="pup-skeleton-header">          <div class="pup-skeleton-avatar"></div>          <div class="pup-skeleton-info">            <div class="pup-skeleton-name"></div>            <div class="pup-skeleton-email"></div>          </div>        </div>        <div class="pup-skeleton-cards">          <div class="pup-skeleton-card"></div>          <div class="pup-skeleton-card"></div>          <div class="pup-skeleton-card"></div>        </div>      </div>    </div>  `;
}
function renderAuthBlocked() {
  return `    <div class="pup" data-module="${CORE_MODULE_ID}">      <div class="pup-state">        <div class="pup-state-icon auth">          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="1.5">            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>          </svg>        </div>        <h3 class="pup-state-title">Acesso Restrito</h3>        <p class="pup-state-desc">Fa\xE7a login para acessar seu perfil</p>        <button class="pup-state-btn" data-action="login">Entrar</button>      </div>    </div>  `;
}
function renderError(message = "Erro ao carregar perfil") {
  return `    <div class="pup" data-module="${CORE_MODULE_ID}">      <div class="pup-state">        <div class="pup-state-icon error">          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="1.5">            <circle cx="12" cy="12" r="10"/>            <path d="M12 8v4M12 16h.01"/>          </svg>        </div>        <h3 class="pup-state-title">${message}</h3>        <p class="pup-state-desc">N\xE3o foi poss\xEDvel carregar os dados</p>        <button class="pup-state-btn secondary" data-action="retry">          ${ICONS.refresh} Tentar Novamente        </button>      </div>    </div>  `;
}
function renderAvatarPicker(avatars, currentUrl) {
  const items = avatars.slice(0, 50).map((a) => {
    const selectedClass = a.url === currentUrl ? "selected" : "";
    return `<div class="pup-picker-item ${selectedClass}" data-action="select-avatar" data-url="${a.url}"><img src="${a.url}" alt="${a.name || "Avatar"}"></div>`;
  }).join("");
  return `    <div class="pup-picker">      <div class="pup-picker-head">        <span class="pup-picker-title">Escolha um novo avatar</span>        <button class="pup-picker-close" data-action="close-picker">${ICONS.x}</button>      </div>      <div class="pup-picker-grid">${items}</div>    </div>  `;
}
function renderProfile(profile, avatars, showAvatarPicker, isDirty, saving) {
  const avatarUrl = profile.avatarUrl || "/assets/avatars/avatar.svg";
  const isActive = profile.status === "active";
  const statusClass = isActive ? "status-active" : "status-pending";
  const statusLabel = isActive ? "Ativo" : "Pendente";
  const footerClass = isDirty ? "visible" : "";
  const saveBtnDisabled = saving ? "disabled" : "";
  const saveBtnIcon = saving ? ICONS.refresh : ICONS.save;
  const saveBtnText = saving ? "Salvando..." : "Salvar";
  const pickerHtml = showAvatarPicker ? renderAvatarPicker(avatars, avatarUrl) : "";
  const employeeBadge = profile.employeeId ? `<span class="pup-badge mat">${ICONS.idCard} Mat: ${profile.employeeId}</span>` : "";
  const lastLoginIpRow = profile.lastLoginIp ? `<div class="pup-sys-row"><span class="pup-sys-key"><span style="color:#f472b6">${ICONS.wifi}</span> IP</span><span class="pup-sys-val">${profile.lastLoginIp}</span></div>` : "";
  return `    <div class="pup" data-module="${CORE_MODULE_ID}">      <div class="pup-scroll">        <header class="pup-header">          <div class="pup-header-row">            <div class="pup-avatar-wrap">              <div class="pup-avatar"><img src="${avatarUrl}" alt="Avatar"></div>              <button class="pup-avatar-btn" data-action="toggle-avatar-picker" title="Alterar Avatar">${ICONS.camera}</button>            </div>            <div class="pup-identity">              <div class="pup-name-row">                <h1 class="pup-name">${profile.fullName || profile.displayName || profile.username}</h1>                <span class="pup-id">${ICONS.hash} ID: ${profile.id}</span>              </div>              <p class="pup-email">${ICONS.mail} ${profile.email}</p>              <div class="pup-badges">                <span class="pup-badge ${statusClass}">${ICONS.dot} ${statusLabel}</span>                <span class="pup-badge role">${ICONS.star} ${profile.roleName || "Usu\xE1rio"}</span>                ${employeeBadge}                <span class="pup-badge ctx">${ICONS.hexagon} Sistema</span>              </div>            </div>          </div>          ${pickerHtml}        </header>        <div class="pup-cards">          <div class="pup-card">            <div class="pup-card-top"><div class="pup-card-icon purple">${ICONS.atSign}</div><span class="pup-card-label">Username</span></div>            <div class="pup-card-value">${profile.username || "\u2014"}</div>          </div>          <div class="pup-card">            <div class="pup-card-top"><div class="pup-card-icon blue">${ICONS.badge}</div><span class="pup-card-label">Perfil</span></div>            <div class="pup-card-value">${profile.roleName || "Usu\xE1rio"}</div>          </div>          <div class="pup-card">            <div class="pup-card-top"><div class="pup-card-icon green">${ICONS.clock}</div><span class="pup-card-label">\xDAltimo Login</span></div>            <div class="pup-card-value">${formatDate(profile.lastLoginAt)}</div>          </div>        </div>        <section class="pup-section">          <h2 class="pup-section-title">${ICONS.edit} Informa\xE7\xF5es Edit\xE1veis</h2>          <div class="pup-form-grid">            <div class="pup-field">              <label class="pup-field-label">${ICONS.user} Nome Completo</label>              <input type="text" data-field="fullName" value="${profile.fullName || ""}" placeholder="Seu nome completo">            </div>            <div class="pup-field">              <label class="pup-field-label">${ICONS.user} Nome de Exibi\xE7\xE3o</label>              <input type="text" data-field="displayName" value="${profile.displayName || ""}" placeholder="Como quer ser chamado">            </div>            <div class="pup-field">              <label class="pup-field-label">${ICONS.briefcase} Fun\xE7\xE3o</label>              <input type="text" data-field="jobTitle" value="${profile.jobTitle || ""}" placeholder="Seu cargo/fun\xE7\xE3o">            </div>            <div class="pup-field">              <label class="pup-field-label">${ICONS.building} Departamento</label>              <input type="text" data-field="department" value="${profile.department || ""}" placeholder="Seu departamento">            </div>            <div class="pup-field">              <label class="pup-field-label">${ICONS.mail} Email</label>              <input type="email" value="${profile.email || ""}" disabled title="Email n\xE3o pode ser alterado">            </div>          </div>        </section>        <section class="pup-system">          <h2 class="pup-system-title">${ICONS.server} Sistema & Auditoria</h2>          <div class="pup-system-rows">            <div class="pup-sys-row">              <span class="pup-sys-key"><span style="color:#60a5fa">${ICONS.calendar}</span> Criado</span>              <span class="pup-sys-val">${formatDate(profile.createdAt)}</span>            </div>            <div class="pup-sys-row">              <span class="pup-sys-key"><span style="color:#34d399">${ICONS.refresh}</span> Atualizado</span>              <span class="pup-sys-val">${formatDate(profile.updatedAt)}</span>            </div>            <div class="pup-sys-row">              <span class="pup-sys-key"><span style="color:#a78bfa">${ICONS.layers}</span> N\xEDvel</span>              <span class="pup-sys-val">Level ${profile.roleLevel || 1}</span>            </div>            <div class="pup-sys-row">              <span class="pup-sys-key"><span style="color:#fbbf24">${ICONS.globe}</span> Idioma</span>              <span class="pup-sys-val">${profile.locale || "pt-BR"}</span>            </div>            ${lastLoginIpRow}          </div>        </section>      </div>      <div class="pup-footer ${footerClass}">        <span class="pup-footer-hint">${ICONS.alert} Altera\xE7\xF5es n\xE3o salvas</span>        <div class="pup-footer-btns">          <button class="pup-btn sec" data-action="cancel">${ICONS.x} Cancelar</button>          <button class="pup-btn pri" data-action="save" ${saveBtnDisabled}>${saveBtnIcon} ${saveBtnText}</button>        </div>      </div>    </div>  `;
}
var template_default = { renderSkeleton, renderAuthBlocked, renderError, renderAvatarPicker, renderProfile };
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
  renderAvatarPicker,
  renderError,
  renderProfile,
  renderSkeleton
};
