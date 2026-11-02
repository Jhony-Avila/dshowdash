// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: boot-error-screen
// PURPOSE: Boot Error Screen
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID
//   VERSION
//   mount
//   unmount
//   info
//   healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'boot-error-screen';
var VERSION = '2.2.0-ENTERPRISE';

function _log(level: 'error' | 'warn' | 'info' | 'debug', ...extraArgs: any[]) {
  var logger = typeof window !== 'undefined' ? (window as { Logger?: Record<string, Function> }).Logger : null;
  var args = Array.prototype.slice.call(arguments, 1);
  if (logger && typeof logger[level] === 'function') {
    logger[level].apply(logger, ['[' + MODULE_ID + ']'].concat(args));
  }
}

var COPY = {
  title: 'O sistema encontrou um problema temporário',
  description: 'Detectamos uma falha ao carregar a aplicação. Isso pode ter ocorrido durante uma atualização ou instabilidade momentânea.',
  subdesc: 'Nossa equipe já está trabalhando para normalizar o serviço.',
  reload: 'Recarregar aplicação',
  login: 'Ir para login',
  errorCode: 'BOOT-CRITICAL'
};

var ICONS = {
  alert: '<svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
  login: '<svg viewBox="0 0 24 24"><path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>'
};

var ERROR_VIDEOS = {
  401: '/assets/videos/error-401.mp4',
  403: '/assets/videos/error-403.mp4',
  404: '/assets/videos/error-404.mp4',
  408: '/assets/videos/error-408.mp4',
  429: '/assets/videos/error-429.mp4',
  500: '/assets/videos/error-500.mp4',
  default: '/assets/videos/error-403.mp4'
};

function injectStyles() {
  if (document.getElementById('boot-error-styles')) return;
  var link = document.createElement('link');
  link.id = 'boot-error-styles';
  link.rel = 'stylesheet';
  link.href = '/boot/error/styles.css';
  document.head.appendChild(link);
}

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function getCorrelationId() {
  return 'ERR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function getVideoForError(error: { code?: string | number; status?: string | number } | null | undefined) {
  var code = (error && (error.code || error.status)) || 'default';
  return (ERROR_VIDEOS as Record<string, string>)[String(code)] || ERROR_VIDEOS.default;
}

function createErrorScreen(error: { code?: string | number; status?: string | number; message?: string; stack?: string } | null | undefined) {
  var correlationId = getCorrelationId();
  var timestamp = getTimestamp();
  var videoSrc = getVideoForError(error);

  var container = document.createElement('div');
  container.className = 'boot-error-screen';
  container.innerHTML = '<video class="boot-error__video" autoplay muted loop playsinline>' +
    '<source src="' + videoSrc + '" type="video/mp4">' +
    '</video>' +
    '<div class="boot-error__overlay"></div>' +
    '<div class="boot-error__content">' +
    '<div class="boot-error__icon">' + ICONS.alert + '</div>' +
    '<h1 class="boot-error__title">' + COPY.title + '</h1>' +
    '<p class="boot-error__description">' + COPY.description + '</p>' +
    '<p class="boot-error__subdesc">' + COPY.subdesc + '</p>' +
    '<div class="boot-error__actions">' +
    '<button class="boot-error__btn boot-error__btn--primary" data-action="reload">' +
    ICONS.refresh +
    '<span>' + COPY.reload + '</span>' +
    '</button>' +
    '<button class="boot-error__btn boot-error__btn--secondary" data-action="login">' +
    ICONS.login +
    '<span>' + COPY.login + '</span>' +
    '</button>' +
    '</div>' +
    '<footer class="boot-error__footer">' +
    '<span class="boot-error__meta">' + COPY.errorCode + '</span>' +
    '<span class="boot-error__meta">' + correlationId + '</span>' +
    '<span class="boot-error__meta">' + timestamp + '</span>' +
    '</footer>' +
    '</div>';

  return container;
}

function attachEvents(container: HTMLElement) {
  var reloadBtn = container.querySelector('[data-action="reload"]');
  var loginBtn = container.querySelector('[data-action="login"]');

  if (reloadBtn) {
    reloadBtn.addEventListener('click', function() {
      window.location.reload();
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      window.location.href = '/login.html';
    });
  }
}

function mount(error: unknown) {
  const bootError = error as { code?: string | number; status?: string | number; message?: string; stack?: string } | null;
  _log('error', 'Critical boot failure:', bootError);

  injectStyles();

  var root = document.getElementById('app') || document.body;
  root.innerHTML = '';

  var screen = createErrorScreen(bootError);
  root.appendChild(screen);

  attachEvents(screen);

  try {
    if (window.Telemetry && window.Telemetry.track) {
      window.Telemetry.track('boot:critical-error', {
        error: bootError && bootError.message,
        stack: bootError && bootError.stack ? bootError.stack.substring(0, 500) : null,
        url: window.location.href,
        timestamp: Date.now()
      });
    }
  } catch (e) { }

  return screen;
}

function unmount() {
  var screen = document.querySelector('.boot-error-screen');
  if (screen) screen.remove();
}

function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export { MODULE_ID, VERSION, mount, unmount, info, healthCheck };
export default { mount: mount, unmount: unmount, info: info, healthCheck: healthCheck, MODULE_ID: MODULE_ID, VERSION: VERSION };
