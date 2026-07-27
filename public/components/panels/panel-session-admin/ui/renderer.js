import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin.ui.renderer";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = function(level, ...rest) {
  const args = rest;
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "warn" && logger.warn) logger.warn("[panel-session-admin]", ...args);
};
const ICONS = {
  lock: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>',
  shield: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  monitor: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  alertCircle: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>'
};
function renderAuthRequired(container, config = {}) {
  _initPorts();
  if (!container) return;
  const i18n = config.i18n || {};
  container.innerHTML = `<div class="psa psa--auth-required" role="main" aria-labelledby="psa-auth-title"><div class="psa__empty-card"><div class="psa__empty-icon psa__empty-icon--warning" aria-hidden="true">${ICONS.lock}</div><h2 id="psa-auth-title" class="psa__empty-title">${i18n.authRequired || "Autentica\xE7\xE3o Necess\xE1ria"}</h2><p class="psa__empty-text">${i18n.authRequiredText || "Fa\xE7a login para gerenciar suas sess\xF5es."}</p><button type="button" class="psa__btn psa__btn--primary" data-action="open-login"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Fazer Login</button></div></div>`;
  const loginBtn = container.querySelector('[data-action="open-login"]');
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const eventBus = _getPort("eventBus");
      const loginModal = _getPort("loginModal");
      if (eventBus && eventBus.emit) {
        eventBus.emit(AUTH_INTENTS.LOGIN, { source: MODULE_ID, reason: "auth-required", timestamp: Date.now() });
      } else if (loginModal && loginModal.show) {
        loginModal.show();
      }
    });
  }
}
function renderSkeleton(container) {
  if (!container) return;
  container.innerHTML = '<div class="psa" role="main" aria-busy="true" aria-label="Carregando sess\xF5es"><header class="psa__header"><div class="psa__title-group"><h2 class="psa__title"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Gerenciamento de Sess\xF5es</h2></div></header><div class="psa__content"><div class="psa__loading"><div class="psa__spinner" role="progressbar" aria-label="Carregando"></div><span>Carregando sess\xF5es...</span></div></div></div>';
}
function renderError(container, errorMessage = "Erro ao carregar sess\xF5es", retryHandler) {
  if (!container) return;
  container.innerHTML = `<div class="psa" role="main" aria-labelledby="psa-error-title"><header class="psa__header"><div class="psa__title-group"><h2 class="psa__title"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Gerenciamento de Sess\xF5es</h2></div></header><div class="psa__content"><div class="psa__error" role="alert"><div class="psa__error-icon" aria-hidden="true">${ICONS.alertCircle}</div><h3 id="psa-error-title">${escapeHtml(errorMessage)}</h3><p>Verifique sua conex\xE3o e tente novamente.</p><button type="button" class="psa__btn psa__btn--primary" data-action="retry">${ICONS.refresh}Tentar Novamente</button></div></div></div>`;
  if (retryHandler) {
    const retryBtn = container.querySelector('[data-action="retry"]');
    if (retryBtn) retryBtn.addEventListener("click", retryHandler);
  }
}
function renderEmptySessions() {
  return `<div class="psa__empty"><div class="psa__empty-icon" aria-hidden="true">${ICONS.monitor}</div><h3>Nenhuma sess\xE3o encontrada</h3><p>N\xE3o h\xE1 sess\xF5es ativas para exibir.</p></div>`;
}
function renderNoPermission(container, config = {}) {
  if (!container) return;
  const i18n = config.i18n || {};
  container.innerHTML = `<div class="psa psa--no-permission" role="main" aria-labelledby="psa-perm-title"><div class="psa__empty-card"><div class="psa__empty-icon psa__empty-icon--info" aria-hidden="true">${ICONS.shield}</div><h2 id="psa-perm-title" class="psa__empty-title">${i18n.noPermission || "Acesso Limitado"}</h2><p class="psa__empty-text">${i18n.noPermissionText || "Voc\xEA pode visualizar apenas suas pr\xF3prias sess\xF5es."}</p><div class="psa__empty-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Suas sess\xF5es ser\xE3o exibidas abaixo</div></div></div>`;
}
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = { portsAvailable: Ports.isInitialized(), iconsLoaded: Object.keys(ICONS).length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, iconsCount: Object.keys(ICONS).length, p25Compliant: true };
}
var renderer_default = { VERSION, MODULE_ID, ICONS, renderAuthRequired, renderSkeleton, renderError, renderEmptySessions, renderNoPermission, getVersion, healthCheck, info, injectPorts, getPorts };
export {
  ICONS,
  MODULE_ID,
  VERSION,
  renderer_default as default,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  renderAuthRequired,
  renderEmptySessions,
  renderError,
  renderNoPermission,
  renderSkeleton
};
