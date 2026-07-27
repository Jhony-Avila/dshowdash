import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.status-lang";
const VERSION = "2.3.0-P18EC";
const LANG_EVENTS = { CHANGED: "footer:lang:changed" };
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const LANGUAGES = { "pt-BR": "Portugu\xEAs", "en-US": "English", "es-ES": "Espa\xF1ol" };
const _state = { initialized: false, currentLang: "pt-BR", availableLangs: Object.keys(LANGUAGES) };
const _metrics = { changes: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function _track(eventName, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function setLanguage(lang) {
  if (_state.availableLangs.indexOf(lang) < 0) return { ok: false, reason: "Language not available" };
  const prev = _state.currentLang;
  _state.currentLang = lang;
  _metrics.changes++;
  _emit(LANG_EVENTS.CHANGED, { from: prev, to: lang });
  _track("footer:lang:change", { from: prev, to: lang });
  if (typeof document !== "undefined") document.documentElement.lang = lang;
  return { ok: true, lang };
}
function getLanguage() {
  return _state.currentLang;
}
function getLanguageName() {
  return LANGUAGES[_state.currentLang] || _state.currentLang;
}
function getAvailableLanguages() {
  return _state.availableLangs.map((code) => ({
    code,
    name: LANGUAGES[code] || code
  }));
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.lang) _state.currentLang = ctx.lang;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, currentLang: _state.currentLang, availableLangs: _state.availableLangs, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function LanguageSelectorComponent(options) {
  options = options || {};
  this._container = options.container || null;
  this._mounted = false;
  this._element = null;
}
LanguageSelectorComponent.prototype.mount = function() {
  if (this._mounted) return Promise.resolve();
  if (!this._container) return Promise.resolve();
  init();
  const self = this;
  this._element = document.createElement("div");
  this._element.className = "dsd-footer__lang-selector";
  this._element.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span class="dsd-footer__lang-text">${getLanguageName()}</span>`;
  this._container.appendChild(this._element);
  this._mounted = true;
  this._element.addEventListener("click", () => {
    const langs = getAvailableLanguages();
    const currentIdx = langs.findIndex((l) => l.code === getLanguage());
    const nextIdx = (currentIdx + 1) % langs.length;
    setLanguage(langs[nextIdx].code);
    const textEl = self._element.querySelector(".dsd-footer__lang-text");
    if (textEl) textEl.textContent = getLanguageName();
  });
  return Promise.resolve();
};
LanguageSelectorComponent.prototype.destroy = function() {
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  this._mounted = false;
};
LanguageSelectorComponent.prototype.isLoaded = function() {
  return this._mounted;
};
LanguageSelectorComponent.prototype.getLanguage = () => getLanguage();
LanguageSelectorComponent.prototype.setLanguage = (lang) => setLanguage(lang);
LanguageSelectorComponent.prototype.healthCheck = () => healthCheck();
LanguageSelectorComponent.prototype.info = () => info();
var status_lang_default = { MODULE_ID, VERSION, LANG_EVENTS, LanguageSelectorComponent, init, setLanguage, getLanguage, getLanguageName, getAvailableLanguages, healthCheck, info, injectPorts, getPorts };
export {
  LANG_EVENTS,
  LanguageSelectorComponent,
  MODULE_ID,
  VERSION,
  status_lang_default as default,
  getAvailableLanguages,
  getLanguage,
  getLanguageName,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  setLanguage
};
