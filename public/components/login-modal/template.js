const VERSION = "5.7.1-ENTERPRISE";
const MODULE_ID = "login-modal-template";
const _metrics = { renders: 0 };
const ICONS = {
  user: '<svg class="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  lock: '<svg class="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
  eye: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" role="img" class="eye-icon lm-eye-icon"><title>Mostrar senha</title><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  eyeOff: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" role="img" class="eye-icon lm-eye-icon"><title>Ocultar senha</title><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>',
  warning: '<svg class="lm-caps-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
};
const PRECONNECT_URLS = [
  { url: "/api/auth", crossorigin: false },
  { url: "/api/csrf", crossorigin: false },
  { url: "https://api.pwnedpasswords.com", crossorigin: true }
];
function injectPreconnects() {
  if (typeof document === "undefined") return;
  const head = document.head;
  PRECONNECT_URLS.forEach(({ url, crossorigin }) => {
    if (head.querySelector(`link[rel="preconnect"][href="${url}"]`)) return;
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = url;
    if (crossorigin) link.crossOrigin = "anonymous";
    head.appendChild(link);
  });
}
function getLoginModalTemplate(config = {}) {
  _metrics.renders++;
  injectPreconnects();
  const videoSrc = config.video?.src || config.videoSrc || "/assets/videos/video_background_site_web.mp4";
  const idPrefix = config.idPrefix || "login";
  const showRememberMe = config.ui?.showRememberMe !== false;
  const showForgotPassword = config.ui?.showForgotPassword !== false;
  const forgotPasswordUrl = config.ui?.forgotPasswordUrl || "#forgot-password";
  const showHoneypot = config.security?.honeypot !== false;
  const showLanguageSelector = config.i18n?.enabled !== false;
  const showAvatarPreview = config.avatar?.enabled !== false;
  const lazyLoadVideo = config.video?.lazyLoad !== false;
  return `
    <div
      id="${idPrefix}-modal"
      class="login-modal lm-modal lm-root"
      hidden
      data-component="login-modal">

      <div class="login-backdrop lm-backdrop" data-backdrop></div>

      <video
        id="${idPrefix}-video"
        class="login-video lm-video"
        autoplay
        loop
        muted
        playsinline
        ${lazyLoadVideo ? 'preload="none"' : 'preload="metadata"'}
        ${lazyLoadVideo ? "" : `src="${videoSrc}"`}
        loading="lazy"
        aria-hidden="true"
        data-testid="login-video"
        data-video-src="${videoSrc}">
        ${lazyLoadVideo ? "" : `<source src="${videoSrc}" type="video/mp4">`}
      </video>

      <div class="login-container-wrapper lm-wrapper">
        ${showLanguageSelector ? '<div class="lm-language-container" data-language-container></div>' : ""}

        <div class="login-container lm-container">
          <div class="login-container-inner lm-inner">

            <div class="login-brand lm-brand" aria-hidden="true">
              <img src="/assets/icons/logo-horizontal.png" alt="DSHOW DASH" class="lm-logo" loading="lazy" decoding="async" width="120" height="40">
              <h2 id="${idPrefix}-title" class="visually-hidden lm-visually-hidden">Login DSHOW DASH</h2>
            </div>

            <form
              id="${idPrefix}-form"
              class="login-form lm-form"
              novalidate
              aria-describedby="${idPrefix}-error"
              data-testid="login-form">

              ${showHoneypot ? `
              <div class="lm-honeypot" aria-hidden="true" inert style="position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;height:0;width:0;overflow:hidden;">
                <label for="${idPrefix}-website">Website (deixe em branco)</label>
                <input type="text" id="${idPrefix}-website" name="website_url" tabindex="-1" autocomplete="off" data-honeypot="true">
              </div>
              ` : ""}

              <div class="lm-floating-group">
                <div class="lm-input-wrapper">
                  ${ICONS.user}
                  <input
                    type="text"
                    id="${idPrefix}-email"
                    class="login-input lm-input lm-floating-input"
                    name="username"
                    placeholder=" "
                    autocomplete="username email"
                    required
                    aria-required="true"
                    data-testid="login-username">
                  <label for="${idPrefix}-email" class="lm-floating-label">Usu\xE1rio ou E-mail</label>
                </div>
                ${showAvatarPreview ? '<div class="lm-avatar-container" data-avatar-container></div>' : ""}
              </div>

              <div class="password-wrapper lm-password-wrapper">
                <div class="lm-floating-group">
                  <div class="lm-input-wrapper">
                    ${ICONS.lock}
                    <input
                      type="password"
                      id="${idPrefix}-password"
                      class="login-input lm-input lm-floating-input"
                      name="password"
                      placeholder=" "
                      autocomplete="current-password"
                      required
                      aria-required="true"
                      data-testid="login-password">
                    <label for="${idPrefix}-password" class="lm-floating-label">Senha</label>
                  </div>
                </div>

                <button
                  type="button"
                  id="toggle-password"
                  class="toggle-password lm-toggle-password"
                  aria-label="Mostrar senha"
                  aria-pressed="false"
                  tabindex="0"
                  data-testid="toggle-password">
                  ${ICONS.eye}
                </button>
              </div>

              <div
                id="${idPrefix}-capslock"
                class="lm-capslock-warning"
                role="status"
                aria-live="polite"
                hidden
                data-testid="capslock-warning">
                ${ICONS.warning}
                <span>Caps Lock est\xE1 ativado</span>
              </div>

              <div
                id="${idPrefix}-breach-warning"
                class="lm-breach-warning"
                role="alert"
                aria-live="polite"
                hidden
                data-testid="breach-warning">
                <svg class="lm-breach-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <span data-breach-message>Esta senha foi encontrada em vazamentos de dados.</span>
              </div>

              <div class="lm-form-options">
                ${showRememberMe ? `
                <label class="lm-remember-me">
                  <input
                    type="checkbox"
                    id="${idPrefix}-remember"
                    name="remember"
                    class="lm-checkbox"
                    data-testid="remember-me">
                  <span class="lm-checkbox-custom"></span>
                  <span class="lm-checkbox-label">Lembrar-me</span>
                </label>
                ` : ""}
                ${showForgotPassword ? `<a href="${forgotPasswordUrl}" class="lm-forgot-password" id="${idPrefix}-forgot" data-testid="forgot-password">Esqueci minha senha</a>` : ""}
              </div>

              <div
                id="${idPrefix}-error"
                class="login-error lm-error"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                data-testid="login-error"></div>

              <div
                class="lm-sr-live"
                aria-live="polite"
                aria-atomic="true"
                data-sr-live></div>

              <button
                type="submit"
                id="${idPrefix}-button"
                class="login-button lm-button"
                data-testid="login-submit">
                Entrar
              </button>

            </form>

          </div>
        </div>
      </div>
    </div>
  `;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: { ..._metrics },
    iconsAvailable: Object.keys(ICONS),
    preconnectUrls: PRECONNECT_URLS.map((p) => p.url),
    features: [
      "floating-labels",
      "icons",
      "remember-me",
      "forgot-password",
      "capslock-warning",
      "preconnect",
      "honeypot",
      "breach-warning",
      "avatar-container",
      "language-container",
      "lazy-video"
    ],
    timestamp: Date.now()
  };
}
function healthCheck() {
  const checks = {
    templateFunctionExists: typeof getLoginModalTemplate === "function",
    canRender: !!getLoginModalTemplate({}),
    iconsLoaded: Object.keys(ICONS).length === 5,
    preconnectsConfigured: PRECONNECT_URLS.length > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "UNHEALTHY", score: `${passed}/${total}`, healthy: passed === total, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var template_default = getLoginModalTemplate;
export {
  ICONS,
  MODULE_ID,
  PRECONNECT_URLS,
  VERSION,
  template_default as default,
  getLoginModalTemplate,
  healthCheck,
  info
};
