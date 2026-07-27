// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-i18n
// PURPOSE: Login Modal - Language Selector (i18n)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   LanguageSelector() — exported function
//   TRANSLATIONS — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   document.addEventListener
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.3.0-P17WI';
const MODULE_ID = 'login-modal-i18n';
const STORAGE_KEY = 'dshow_language';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[i18n]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[i18n]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[i18n]'].concat(args)); };

const TRANSLATIONS: Record<string, any> = {
  'pt-BR': { code: 'pt-BR', name: 'Português', flag: '🇧🇷', strings: { title: 'Login DSHOW DASH', username: 'Usuário ou E-mail', password: 'Senha', submit: 'Entrar', submitting: 'Entrando...', rememberMe: 'Lembrar-me', forgotPassword: 'Esqueci minha senha', showPassword: 'Mostrar senha', hidePassword: 'Ocultar senha', capsLock: 'Caps Lock está ativado', errorRequired: 'Campo obrigatório', errorInvalid: 'Credenciais inválidas', errorNetwork: 'Erro de conexão', errorTimeout: 'Tempo esgotado', errorRateLimit: 'Muitas tentativas. Aguarde', errorBreach: 'Senha encontrada em vazamentos', loading: 'Carregando...' } },
  'en-US': { code: 'en-US', name: 'English', flag: '🇺🇸', strings: { title: 'Login DSHOW DASH', username: 'Username or Email', password: 'Password', submit: 'Sign In', submitting: 'Signing in...', rememberMe: 'Remember me', forgotPassword: 'Forgot password', showPassword: 'Show password', hidePassword: 'Hide password', capsLock: 'Caps Lock is on', errorRequired: 'Required field', errorInvalid: 'Invalid credentials', errorNetwork: 'Connection error', errorTimeout: 'Request timeout', errorRateLimit: 'Too many attempts. Please wait', errorBreach: 'Password found in data breaches', loading: 'Loading...' } },
  'es-ES': { code: 'es-ES', name: 'Español', flag: '🇪🇸', strings: { title: 'Iniciar sesión DSHOW DASH', username: 'Usuario o Correo', password: 'Contraseña', submit: 'Entrar', submitting: 'Entrando...', rememberMe: 'Recordarme', forgotPassword: 'Olvidé mi contraseña', showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña', capsLock: 'Bloq Mayús activado', errorRequired: 'Campo obligatorio', errorInvalid: 'Credenciales inválidas', errorNetwork: 'Error de conexión', errorTimeout: 'Tiempo agotado', errorRateLimit: 'Demasiados intentos. Espere', errorBreach: 'Contraseña en filtraciones', loading: 'Cargando...' } }
};

export function LanguageSelector(this: any, config: Record<string, any>) { if (!config) config = {}; const i18n = config.i18n || {}; this.config = config; this.enabled = i18n.enabled !== false; this.defaultLang = i18n.defaultLanguage || 'pt-BR'; this.availableLanguages = i18n.languages || Object.keys(TRANSLATIONS); this._currentLang = this._loadLanguage(); this._container = null; this._dropdown = null; this._isOpen = false; this._mounted = false; this._listeners = []; this._metrics = { changes: 0, opens: 0 }; _initPorts(); }

LanguageSelector.prototype.getHTML = function() { const self = this; const current = TRANSLATIONS[self._currentLang] || TRANSLATIONS[self.defaultLang]; const options = self.availableLanguages.filter((code: string) => TRANSLATIONS[code]).map((code: string) => { const lang = TRANSLATIONS[code]; const isActive = code === self._currentLang ? 'lm-lang-active' : ''; return `<button type="button" class="lm-lang-option ${isActive}" data-lang="${code}" aria-label="${lang.name}">${lang.flag} ${lang.name}</button>`; }).join(''); return `<div class="lm-language-selector" data-i18n-container><button type="button" class="lm-lang-trigger" data-i18n-trigger aria-expanded="false" aria-haspopup="listbox" aria-label="Selecionar idioma"><span class="lm-lang-flag">${current.flag}</span><span class="lm-lang-code">${current.code.split('-')[0].toUpperCase()}</span><svg class="lm-lang-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button><div class="lm-lang-dropdown" data-i18n-dropdown role="listbox" hidden>${options}</div></div>`; };

LanguageSelector.prototype.getCSS = () => '.lm-language-selector{position:absolute;top:1rem;right:1rem;z-index:20}.lm-lang-trigger{display:flex;align-items:center;gap:0.375rem;padding:0.5rem 0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:0.75rem;cursor:pointer;transition:all 0.2s ease}.lm-lang-trigger:hover{background:rgba(255,255,255,0.15);border-color:rgba(139,92,246,0.5)}.lm-lang-trigger:focus{outline:2px solid rgba(139,92,246,0.5);outline-offset:2px}.lm-lang-flag{font-size:1rem}.lm-lang-arrow{transition:transform 0.2s ease}.lm-lang-trigger[aria-expanded="true"] .lm-lang-arrow{transform:rotate(180deg)}.lm-lang-dropdown{position:absolute;top:calc(100% + 0.5rem);right:0;min-width:140px;background:rgba(30,41,59,0.98);border:1px solid rgba(255,255,255,0.1);border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.3);overflow:hidden}.lm-lang-option{display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.625rem 0.875rem;background:transparent;border:none;color:rgba(255,255,255,0.8);font-size:0.8125rem;cursor:pointer;transition:all 0.15s ease;text-align:left}.lm-lang-option:hover{background:rgba(139,92,246,0.2);color:#fff}.lm-lang-option.lm-lang-active{background:rgba(139,92,246,0.3);color:#a78bfa}.lm-lang-dropdown[hidden]{display:none}';


// @ts-expect-error TS migration - TS2554
LanguageSelector.prototype.mount = function(container: HTMLElement | null) { const self = this; if (!self.enabled) return false; if (!document.querySelector('style[data-i18n-css]')) { const style = document.createElement('style'); style.setAttribute('data-i18n-css', 'true'); style.textContent = self.getCSS(); document.head.appendChild(style); } if (container) { container.insertAdjacentHTML('afterbegin', self.getHTML()); self._container = container.querySelector('[data-i18n-container]'); self._dropdown = container.querySelector('[data-i18n-dropdown]'); } self._setupListeners(); self._mounted = true; _log('info', 'Language selector montado', { language: self._currentLang }); return true; };

LanguageSelector.prototype._setupListeners = function() { const self = this; const trigger = self._container ? self._container.querySelector('[data-i18n-trigger]') : null; if (trigger) { const toggleHandler = (e: Event) => { e.preventDefault(); e.stopPropagation(); self.toggle(); }; trigger.addEventListener('click', toggleHandler); self._listeners.push(() => { trigger.removeEventListener('click', toggleHandler); }); } if (self._dropdown) { const optionHandler = (e: Event) => { const option = (e.target as HTMLElement).closest('[data-lang]') as HTMLElement | null; if (option) { self.setLanguage(option.dataset.lang); self.close(); } }; self._dropdown.addEventListener('click', optionHandler); self._listeners.push(() => { self._dropdown.removeEventListener('click', optionHandler); }); } const outsideHandler = (e: Event) => { if (self._isOpen && self._container && !self._container.contains(e.target)) self.close(); }; document.addEventListener('click', outsideHandler); self._listeners.push(() => { document.removeEventListener('click', outsideHandler); }); const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape' && self._isOpen) self.close(); }; document.addEventListener('keydown', escHandler); self._listeners.push(() => { document.removeEventListener('keydown', escHandler); }); };

LanguageSelector.prototype.toggle = function() { this._isOpen ? this.close() : this.open(); };
LanguageSelector.prototype.open = function() { this._metrics.opens++; this._isOpen = true; const trigger = this._container ? this._container.querySelector('[data-i18n-trigger]') : null; if (trigger) trigger.setAttribute('aria-expanded', 'true'); if (this._dropdown) this._dropdown.hidden = false; };
LanguageSelector.prototype.close = function() { this._isOpen = false; const trigger = this._container ? this._container.querySelector('[data-i18n-trigger]') : null; if (trigger) trigger.setAttribute('aria-expanded', 'false'); if (this._dropdown) this._dropdown.hidden = true; };


// @ts-expect-error TS migration - TS2554
LanguageSelector.prototype.setLanguage = function(langCode: string) { if (!TRANSLATIONS[langCode]) { _log('warn', 'Idioma não disponível', { langCode }); return false; } this._metrics.changes++; this._currentLang = langCode; this._saveLanguage(langCode); this._updateUI(); this._applyTranslations(); _log('info', 'Idioma alterado', { langCode }); return true; };

LanguageSelector.prototype._updateUI = function() { const current = TRANSLATIONS[this._currentLang]; if (!current || !this._container) return; const trigger = this._container.querySelector('[data-i18n-trigger]'); if (trigger) { const flag = trigger.querySelector('.lm-lang-flag'); const code = trigger.querySelector('.lm-lang-code'); if (flag) flag.textContent = current.flag; if (code) code.textContent = current.code.split('-')[0].toUpperCase(); } const options = this._dropdown ? this._dropdown.querySelectorAll('[data-lang]') : []; const self = this; options.forEach((opt: any) => { opt.classList.toggle('lm-lang-active', opt.dataset.lang === self._currentLang); }); };

LanguageSelector.prototype._applyTranslations = function() { const strings = this.getStrings(); const modal = this._container ? this._container.closest('.lm-modal') : null; if (!modal) return; const usernameLabel = modal.querySelector('label[for$="-email"]'); if (usernameLabel) usernameLabel.textContent = strings.username; const passwordLabel = modal.querySelector('label[for$="-password"]'); if (passwordLabel) passwordLabel.textContent = strings.password; const submitBtn = modal.querySelector('[data-testid="login-submit"]'); if (submitBtn && !submitBtn.disabled) submitBtn.textContent = strings.submit; const rememberLabel = modal.querySelector('.lm-checkbox-label'); if (rememberLabel) rememberLabel.textContent = strings.rememberMe; const forgotLink = modal.querySelector('[data-testid="forgot-password"]'); if (forgotLink) forgotLink.textContent = strings.forgotPassword; const capsLock = modal.querySelector('[data-testid="capslock-warning"] span'); if (capsLock) capsLock.textContent = strings.capsLock; const toggleBtn = modal.querySelector('[data-testid="toggle-password"]'); if (toggleBtn) { const isVisible = toggleBtn.getAttribute('aria-pressed') === 'true'; toggleBtn.setAttribute('aria-label', isVisible ? strings.hidePassword : strings.showPassword); } };

LanguageSelector.prototype.getStrings = function() { const lang = TRANSLATIONS[this._currentLang] || TRANSLATIONS[this.defaultLang]; return lang.strings; };
LanguageSelector.prototype.getString = function(key: string) { const strings = this.getStrings(); return strings[key] || key; };
LanguageSelector.prototype.getCurrentLanguage = function() { return this._currentLang; };
LanguageSelector.prototype.getAvailableLanguages = function() { return this.availableLanguages.map((code: string) => ({
  code,
  name: TRANSLATIONS[code] ? TRANSLATIONS[code].name : code,
  flag: TRANSLATIONS[code] ? TRANSLATIONS[code].flag : '🌐'
})); };


// @ts-expect-error TS migration - TS2551
LanguageSelector.prototype._loadLanguage = function() { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored && TRANSLATIONS[stored]) return stored; } catch (e) {} const browserLang = navigator.language || navigator.userLanguage; if (TRANSLATIONS[browserLang]) return browserLang; const baseLang = browserLang ? browserLang.split('-')[0] : null; const match = Object.keys(TRANSLATIONS).find(code => code.startsWith(baseLang)); if (match) return match; return this.defaultLang; };


// @ts-expect-error TS migration - TS2554
LanguageSelector.prototype._saveLanguage = (langCode: string) => { try { localStorage.setItem(STORAGE_KEY, langCode); } catch (e) { _log('warn', 'Erro ao salvar idioma', e); } };

LanguageSelector.prototype.unmount = function() { this._listeners.forEach((cleanup: () => void) => { cleanup(); }); this._listeners = []; if (this._container) this._container.remove(); this._mounted = false; };

LanguageSelector.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, mounted: this._mounted, currentLanguage: this._currentLang, availableLanguages: this.availableLanguages, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };

LanguageSelector.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { enabled: this.enabled, mounted: this._mounted, hasTranslations: Object.keys(TRANSLATIONS).length > 0, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export { TRANSLATIONS, VERSION, MODULE_ID };
export default LanguageSelector;
