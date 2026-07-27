import { ICONS } from "../core/constants.js";
import * as AvatarSystem from "../avatar/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences:template-identity";
function _s(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function _getInitials(user) {
  if (!user?.name && !user?.email) return "?";
  const name = user.name || user.email || "";
  const parts = name.split(/[\s@]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
function renderIdentitySection(user, options = {}) {
  const { showEditor = true, avatarSize = "LG" } = options;
  if (!user) {
    return `<div class="pup-identity"><div class="pup-avatar-wrap"><div class="pup-avatar"><span class="pup-avatar-initials">?</span></div></div><div class="pup-user-info"><div class="pup-user-top"><h2 class="pup-user-name">Carregando...</h2></div><p class="pup-user-email">${ICONS.mail} --</p></div></div>`;
  }
  const name = user.name || user.username || "Usu\xE1rio";
  const email = user.email || "";
  const role = user.role || user.nivel || "user";
  const userId = user.id || user.user_id || "--";
  const roleLabels = { admin: "Admin", superadmin: "Super Admin", manager: "Gerente", user: "Usu\xE1rio", viewer: "Visualizador" };
  const roleLabel = roleLabels[role?.toLowerCase()] || role;
  const avatarHtml = renderAvatar(user, { size: avatarSize, interactive: showEditor });
  return `<div class="pup-identity"><div class="pup-avatar-container" ${showEditor ? 'data-action="open-avatar-editor" tabindex="0" role="button" aria-label="Personalizar avatar"' : ""}>${avatarHtml}${showEditor ? `<div class="pup-avatar-overlay">${ICONS.palette}<span class="pup-avatar-overlay-text">Personalizar</span></div>` : ""}<div class="pup-status-online" title="Online"></div></div><div class="pup-user-info"><div class="pup-user-top"><h2 class="pup-user-name">${_s(name)}</h2><span class="pup-user-id">${ICONS.hash}${userId}</span></div><p class="pup-user-email">${ICONS.mail} ${_s(email)}</p><div class="pup-badges"><span class="pup-badge status"><span class="pup-badge-dot">${ICONS.dot}</span>Online</span><span class="pup-badge role">${ICONS.shield}${_s(roleLabel)}</span><span class="pup-badge system">${ICONS.hexagon}v5.0</span></div></div></div>`;
}
function renderAvatar(user, options = {}) {
  const { size = "LG", showBadges = true, interactive = false, className = "" } = options;
  const currentAvatar = AvatarSystem.getCurrent();
  if (currentAvatar && currentAvatar.type !== "fallback") {
    return AvatarSystem.render(currentAvatar, { size, showBadges, interactive, className });
  }
  const fallbackData = { type: "fallback", initials: _getInitials(user), backgroundColor: _generateColor(Number(user?.id) || 0) };
  return AvatarSystem.render(fallbackData, { size, showBadges, interactive, className });
}
function _generateColor(id) {
  const colors = ["#7c3aed", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#8b5cf6"];
  return colors[id % colors.length];
}
function renderAvatarEditor() {
  const editing = AvatarSystem.getEditing() || AvatarSystem.constants.DEFAULT_AVATAR_CONFIG;
  const { AVATAR_BASES, AVATAR_BACKGROUNDS, AVATAR_ICONS, AVATAR_FRAMES } = AvatarSystem.constants;
  return `<div class="pup-avatar-editor" role="dialog" aria-label="Editor de Avatar"><div class="pup-avatar-editor__header"><h3 class="pup-avatar-editor__title">${ICONS.palette} Personalizar Avatar</h3><button type="button" class="pup-avatar-editor__close" data-action="close-avatar-editor" aria-label="Fechar">${ICONS.x}</button></div><div class="pup-avatar-editor__content"><div class="pup-avatar-editor__preview"><div class="pup-avatar-editor__preview-main" id="avatar-preview-main">${AvatarSystem.renderer.renderGenerated(editing, { size: "XXL" })}</div><div class="pup-avatar-editor__preview-sizes"><div id="avatar-preview-lg">${AvatarSystem.renderer.renderGenerated(editing, { size: "LG" })}</div><div id="avatar-preview-md">${AvatarSystem.renderer.renderGenerated(editing, { size: "MD" })}</div><div id="avatar-preview-sm">${AvatarSystem.renderer.renderGenerated(editing, { size: "SM" })}</div></div></div><div class="pup-avatar-editor__options"><div class="pup-avatar-editor__section"><label class="pup-avatar-editor__label">Forma</label><div class="pup-avatar-editor__grid pup-avatar-editor__grid--bases">${Object.entries(AVATAR_BASES).map(([key, value]) => `<button type="button" class="pup-avatar-option ${editing.base === value ? "pup-avatar-option--active" : ""}" data-avatar-option="base" data-value="${value}" title="${key}"><span class="pup-avatar-option__icon pup-avatar-option__icon--${value}"></span></button>`).join("")}</div></div><div class="pup-avatar-editor__section"><label class="pup-avatar-editor__label">Fundo</label><div class="pup-avatar-editor__grid pup-avatar-editor__grid--backgrounds">${Object.entries(AVATAR_BACKGROUNDS).slice(0, 12).map(([key, bg]) => `<button type="button" class="pup-avatar-option pup-avatar-option--color ${editing.background === bg.id ? "pup-avatar-option--active" : ""}" data-avatar-option="background" data-value="${bg.id}" style="background: ${bg.value};" title="${bg.name}"></button>`).join("")}</div></div><div class="pup-avatar-editor__section"><label class="pup-avatar-editor__label">\xCDcone</label><div class="pup-avatar-editor__grid pup-avatar-editor__grid--icons">${Object.entries(AVATAR_ICONS).slice(0, 12).map(([key, icon]) => `<button type="button" class="pup-avatar-option ${editing.icon === icon.id ? "pup-avatar-option--active" : ""}" data-avatar-option="icon" data-value="${icon.id}" title="${icon.name}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${icon.svg || ""}</svg></button>`).join("")}</div></div><div class="pup-avatar-editor__section"><label class="pup-avatar-editor__label">Moldura</label><div class="pup-avatar-editor__grid pup-avatar-editor__grid--frames">${Object.entries(AVATAR_FRAMES).slice(0, 8).map(([key, frame]) => `<button type="button" class="pup-avatar-option ${editing.frame === frame.id ? "pup-avatar-option--active" : ""}" data-avatar-option="frame" data-value="${frame.id}" style="border-color: ${frame.color};" title="${frame.name} (${frame.rarity})"><span class="pup-avatar-option__rarity pup-avatar-option__rarity--${frame.rarity}"></span></button>`).join("")}</div></div></div></div><div class="pup-avatar-editor__footer"><button type="button" class="pup-btn pup-btn--secondary" data-action="cancel-avatar-editor">${ICONS.x} Cancelar</button><button type="button" class="pup-btn pup-btn--primary" data-action="save-avatar">${ICONS.save} Salvar Avatar</button></div></div>`;
}
function renderAvatarUpload() {
  return `<div class="pup-avatar-upload"><div class="pup-avatar-upload__dropzone" data-action="avatar-dropzone"><input type="file" id="avatar-file-input" accept="image/jpeg,image/png,image/webp,image/gif" class="pup-avatar-upload__input" aria-label="Selecionar imagem"><div class="pup-avatar-upload__content">${ICONS.upload}<p>Arraste uma imagem ou clique para selecionar</p><span class="pup-avatar-upload__hint">JPG, PNG, WebP ou GIF. M\xE1x 5MB</span></div></div><div class="pup-avatar-upload__or">ou</div><button type="button" class="pup-btn pup-btn--outline" data-action="open-avatar-generator">${ICONS.palette} Criar Avatar Personalizado</button></div>`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, avatarSystemIntegrated: true };
}
function healthCheck() {
  const checks = { templateReady: true, avatarSystemAvailable: !!AvatarSystem, rendererAvailable: !!AvatarSystem?.renderer };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks };
}
var template_identity_default = { renderIdentitySection, renderAvatar, renderAvatarEditor, renderAvatarUpload, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  template_identity_default as default,
  healthCheck,
  info,
  renderAvatar,
  renderAvatarEditor,
  renderAvatarUpload,
  renderIdentitySection
};
