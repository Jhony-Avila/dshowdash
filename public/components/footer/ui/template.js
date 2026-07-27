const VERSION = "17.1.0-UARPS-INTEGRATION";
const MODULE_ID = "footer.template";
function getFooterTemplate(config) {
  config = config || {};
  return '<footer class="app-footer dsd-footer" role="contentinfo" aria-label="Rodap\xE9 da aplica\xE7\xE3o" data-uarps-region="region:app:footer"><div class="dsd-footer__top"><div class="dsd-footer__top-inner"><div class="dsd-footer__brand" data-slot="brand"><div class="dsd-footer__brand-content"><img src="/assets/icons/logo-horizontal.png" alt="Logotipo Dshow" class="dsd-footer__brand-logo-img" loading="lazy" width="120" height="28" /></div></div><div class="dsd-footer__icons" data-slot="decorative-icons"></div><div class="dsd-footer__status" data-slot="quick-status"></div></div></div><div class="dsd-footer__bottom"><div class="dsd-footer__bottom-inner"><div class="dsd-footer__copyright" data-slot="copyright"><span class="dsd-footer__copyright-text">\xA9 2025 Display Solutions. Todos os direitos reservados.</span></div><div class="dsd-footer__meta" data-slot="meta"><span class="dsd-footer__meta-item" data-meta="build"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="dsd-footer__meta-icon"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg><span data-value="build">Build: --</span></span><span class="dsd-footer__meta-sep">\u2022</span><span class="dsd-footer__meta-item" data-meta="ip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="dsd-footer__meta-icon"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg><span data-value="ip">IP: --</span></span><span class="dsd-footer__meta-sep">\u2022</span><span class="dsd-footer__meta-item" data-meta="location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="dsd-footer__meta-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span data-value="location">Local: --</span></span></div><div class="dsd-footer__actions-bar"><div class="dsd-footer__legal" data-slot="links"><a href="/termos" class="dsd-footer__link" data-uarps-trigger="trigger:footer:termos">Termos de Uso</a><a href="/privacidade" class="dsd-footer__link" data-uarps-trigger="trigger:footer:privacidade">Privacidade</a><a href="/lgpd" class="dsd-footer__link" data-uarps-trigger="trigger:footer:lgpd">LGPD</a></div><div class="dsd-footer__controls"><div class="dsd-footer__session-slot" data-slot="session-timer"></div><button class="dsd-footer__control-btn" data-action="language" data-uarps-trigger="trigger:footer:language" title="Idioma"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span>PT</span></button><button class="dsd-footer__control-btn dsd-footer__control-btn--logout" data-action="logout" data-uarps-trigger="trigger:footer:logout" title="Sair"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Sair</span></button></div></div></div></div><div class="dsd-footer__announce" data-slot="announce" aria-live="polite" aria-atomic="true"></div></footer>';
}
const SLOTS = { ROOT: ".dsd-footer", TOP: ".dsd-footer__top", TOP_INNER: ".dsd-footer__top-inner", BRAND: '[data-slot="brand"]', DECORATIVE_ICONS: '[data-slot="decorative-icons"]', QUICK_STATUS: '[data-slot="quick-status"]', BOTTOM: ".dsd-footer__bottom", BOTTOM_INNER: ".dsd-footer__bottom-inner", COPYRIGHT: '[data-slot="copyright"]', META: '[data-slot="meta"]', LINKS: '[data-slot="links"]', SESSION_TIMER: '[data-slot="session-timer"]', ANNOUNCE: '[data-slot="announce"]' };
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
}
function getMetrics() {
  return { renderCount: 0 };
}
function resetMetrics() {
}
function getSlots() {
  return SLOTS;
}
function healthCheck() {
  return { status: "healthy", score: 100, checks: { templateAvailable: true }, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, architecture: "slot-based", slots: Object.keys(SLOTS), uarpsEnabled: true, timestamp: Date.now() };
}
var template_default = { getFooterTemplate, getVersion, setDebug, getMetrics, resetMetrics, getSlots, healthCheck, info, SLOTS, VERSION, MODULE_ID };
export {
  MODULE_ID,
  SLOTS,
  VERSION,
  template_default as default,
  getFooterTemplate,
  getMetrics,
  getSlots,
  getVersion,
  healthCheck,
  info,
  resetMetrics,
  setDebug
};
