import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
const MODULE_ID = "panel-user-preferences.ui.renderer";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const renderAuthBlocked = (container) => {
  _initPorts();
  if (!container) return;
  container.innerHTML = '<div class="panel-user-preferences panel-user-preferences--auth-blocked" role="main" aria-labelledby="pup-auth-title"><div class="panel-user-preferences__auth-card"><div class="panel-user-preferences__auth-icon" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg></div><h2 id="pup-auth-title" class="panel-user-preferences__auth-title">Login Necess\xE1rio</h2><p class="panel-user-preferences__auth-text">Para acessar suas prefer\xEAncias e personalizar o dashboard, fa\xE7a login na sua conta.</p><button type="button" class="panel-user-preferences__auth-button" data-action="open-login"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Fazer Login</button></div></div>';
  const btn = container.querySelector('[data-action="open-login"]');
  if (btn) {
    btn.addEventListener("click", () => {
      const eb = _getPort("eventBus");
      eb?.emit?.(AUTH_INTENTS.LOGIN, { source: "panel-user-preferences", reason: "auth-required", timestamp: Date.now() });
    });
  }
};
const renderSkeleton = (container) => {
  if (!container) return;
  container.innerHTML = '<div class="panel-user-preferences pup" role="main" aria-busy="true" aria-label="Carregando prefer\xEAncias"><header class="pup-header"><h2 class="pup-header__title"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Prefer\xEAncias</h2></header><div class="pup-content"><div class="pup-loading"><div class="pup-spinner" role="progressbar" aria-label="Carregando"></div><span>Carregando prefer\xEAncias...</span></div></div></div>';
};
const renderError = (container, errorMessage, retryHandler) => {
  if (!container) return;
  errorMessage = errorMessage || "Erro ao carregar prefer\xEAncias";
  container.innerHTML = `<div class="panel-user-preferences pup" role="main" aria-labelledby="pup-error-title"><header class="pup-header"><h2 class="pup-header__title">Prefer\xEAncias</h2></header><div class="pup-content"><div class="pup-error" role="alert"><h3 id="pup-error-title">${errorMessage}</h3><p>N\xE3o foi poss\xEDvel carregar suas prefer\xEAncias.</p><button type="button" class="pup-btn pup-btn--primary" data-action="retry">Tentar Novamente</button></div></div></div>`;
  if (retryHandler) {
    const btn = container.querySelector('[data-action="retry"]');
    if (btn) btn.addEventListener("click", retryHandler);
  }
};
const renderEmptyState = (type = "generic") => {
  const states = { layouts: { title: "Nenhum Layout Salvo", text: "Salve o layout atual para acess\xE1-lo rapidamente." }, views: { title: "Nenhuma View Salva", text: "Views permitem salvar filtros e configura\xE7\xF5es." }, panels: { title: "Nenhum Painel Dispon\xEDvel", text: "Os pain\xE9is aparecer\xE3o aqui." }, generic: { title: "Nenhum Item", text: "N\xE3o h\xE1 itens para exibir." } };
  const s = states[type] || states.generic;
  return `<div class="panel-user-preferences__empty"><h3>${s.title}</h3><p>${s.text}</p></div>`;
};
const renderEmptyLayouts = () => renderEmptyState("layouts");
const renderEmptyViews = () => renderEmptyState("views");
const renderEmptyPanels = () => renderEmptyState("panels");
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), usingP18Intents: true });
const healthCheck = () => ({ status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { rendererReady: true, p18IntentsAvailable: true } });
var renderer_default = { renderAuthBlocked, renderSkeleton, renderError, renderEmptyState, renderEmptyLayouts, renderEmptyViews, renderEmptyPanels, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  renderAuthBlocked,
  renderEmptyLayouts,
  renderEmptyPanels,
  renderEmptyState,
  renderEmptyViews,
  renderError,
  renderSkeleton
};
