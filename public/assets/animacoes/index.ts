

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animacoes
// PURPOSE: Animacoes - Lottie animation management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ASSET_EVENTS from /core/runtime/events/index.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   loadAnimation() — exported function
//   playAnimation() — exported function
//   pauseAnimation() — exported function
//   stopAnimation() — exported function
//   destroyAnimation() — exported function
//   destroyAll() — exported function
//   getAnimation() — exported function
//   getLoadedAnimations() — exported function
//   getAvailableAnimations() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   reset() — exported function
//   getLogs() — exported function
//   setDebug() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// WINDOW ACCESS:
//   window.__dev (DevTools exposure, always permitted)
// ═══════════════════════════════════════════════════════════════
// @version 1.5.0-STRICT-MODE
// @changelog v1.5.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.4.0-P0-ENTERPRISE - EventBus via Ports (elimina window.EventBus fallback)
'use strict';

declare const lottie: { loadAnimation: (config: Record<string, unknown>) => { play: () => void; pause: () => void; stop: () => void; destroy: () => void }; [key: string]: unknown };
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { ASSET_EVENTS } from '/core/runtime/events/catalog/asset.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

var MODULE_ID = 'animacoes';
var VERSION = '1.5.0-STRICT-MODE';

// P0 ENTERPRISE: Ports-based access (no window.* fallbacks)
var Ports = createUiPorts({ moduleId: MODULE_ID });
var _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { _initPorts(); return Ports.get(name); }
function injectPorts(ports: Record<string, unknown>) { return Ports.inject(ports); }
function getPorts() { return Ports.snapshot(); }

var _logBuffer: Array<{ level: string; msg: string; extra?: unknown; ts: number }> = [];
var _initialized = false;
var _debug = false;
var _lottieLoaded = false;
var _animations: Record<string, { play: () => void; pause: () => void; stop: () => void; destroy: () => void }> = {};
var _metrics: { animationsLoaded: number; animationsPlayed: number; errors: number; lastActivity: number | null } = { animationsLoaded: 0, animationsPlayed: 0, errors: 0, lastActivity: null };

function _getLottieCDN() { return 'https:' + '//cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'; }

function _log(level: 'info' | 'warn' | 'error', msg: string, extra?: Record<string, unknown>) {
  _logBuffer.push({ level: level, msg: msg, extra: extra, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
  if (_debug || level === 'error') {
    if (extra) {
      if (level === 'error') console.error('[' + MODULE_ID + '] ' + msg, extra);
      else if (level === 'warn') console.warn('[' + MODULE_ID + '] ' + msg, extra);
    } else {
      if (level === 'error') console.error('[' + MODULE_ID + '] ' + msg);
      else if (level === 'warn') console.warn('[' + MODULE_ID + '] ' + msg);
    }
  }
}

function getLogs() { return _logBuffer.slice(); }

var AVAILABLE_ANIMATIONS = {
  'cards': { file: 'Lottie_Cards.json', name: 'Cards Animation' },
  'graph-growth': { file: 'Lottie_Graph_Growth.json', name: 'Graph Growth Animation' },
  'loading': { file: 'TAVPl45E1F.json', name: 'Loading Animation' }
};

function loadLottieLibrary() {
  return new Promise(function(resolve) {
    if (_lottieLoaded || typeof lottie !== 'undefined') {
      _lottieLoaded = true;
      resolve(true);
      return;
    }
    var script = document.createElement('script');
    script.src = _getLottieCDN();
    script.onload = function() {
      _lottieLoaded = true;
      _log('info', 'Lottie library carregada');
      resolve(true);
    };
    script.onerror = function() {
      _log('error', 'Falha ao carregar Lottie library');
      _metrics.errors++;
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

function init(options?: Record<string, unknown>) {
  options = options || {};
  if (_initialized) {
    _log('warn', 'Já inicializado');
    return Promise.resolve();
  }
  _debug = !!(options.debug);
  _initialized = true;
  _metrics.lastActivity = Date.now();
  var promise = Promise.resolve();
  if (options.preloadLottie !== false) {
    promise = loadLottieLibrary() as any;
  }
  return promise.then(function() {
    _log('info', VERSION + ' inicializado');
    var eb = _getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(ASSET_EVENTS.ANIMATION_READY, { version: VERSION });
    }
  });
}

function loadAnimation(animationId: string, container: string | Element, options?: Record<string, unknown>) {
  options = options || {};
  if (!AVAILABLE_ANIMATIONS[animationId as keyof typeof AVAILABLE_ANIMATIONS]) {
    _log('error', 'Animação não encontrada: ' + animationId);
    _metrics.errors++;
    return Promise.resolve(null);
  }
  return loadLottieLibrary().then(function(loaded) {
    if (!loaded) return null;
    try {
      var animConfig = AVAILABLE_ANIMATIONS[animationId as keyof typeof AVAILABLE_ANIMATIONS];
      var basePath = '/assets/animacoes/'; // 2026-09-14: era '/components/animacoes/' (diretório inexistente → 404); os .json vivem em /assets/animacoes/
      var containerEl = typeof container === 'string' ? document.querySelector(container) : container;
      var anim = lottie.loadAnimation({
        container: containerEl,
        renderer: options.renderer || 'svg',
        loop: options.loop !== false,
        autoplay: options.autoplay !== false,
        path: basePath + animConfig.file
      });
      _animations[animationId] = anim;
      _metrics.animationsLoaded++;
      _metrics.lastActivity = Date.now();
      _log('info', 'Animação carregada: ' + animationId);
      return anim;
    } catch (err: any) {
      _log('error', 'Erro ao carregar ' + animationId + ':', err.message);
      _metrics.errors++;
      return null;
    }
  });
}

function playAnimation(animationId: string) {
  var anim = _animations[animationId];
  if (anim) {
    anim.play();
    _metrics.animationsPlayed++;
    _metrics.lastActivity = Date.now();
    return true;
  }
  return false;
}

function pauseAnimation(animationId: string) {
  var anim = _animations[animationId];
  if (anim) {
    anim.pause();
    return true;
  }
  return false;
}

function stopAnimation(animationId: string) {
  var anim = _animations[animationId];
  if (anim) {
    anim.stop();
    return true;
  }
  return false;
}

function destroyAnimation(animationId: string) {
  var anim = _animations[animationId];
  if (anim) {
    anim.destroy();
    delete _animations[animationId];
    _metrics.lastActivity = Date.now();
    _log('info', 'Animação destruída: ' + animationId);
    return true;
  }
  return false;
}

function destroyAll() {
  for (var id in _animations) {
    if (_animations.hasOwnProperty(id)) {
      _animations[id].destroy();
    }
  }
  _animations = {};
  _metrics.lastActivity = Date.now();
  _log('info', 'Todas as animações destruídas');
}

function getAnimation(animationId: string) { return _animations[animationId] || null; }
function getLoadedAnimations() { return Object.keys(_animations); }
function getAvailableAnimations() { return Object.keys(AVAILABLE_ANIMATIONS); }
function getVersion() { return VERSION; }
function setDebug(enabled: boolean) { _debug = !!enabled; }

function healthCheck() {
  var checks: Record<string, boolean> = {
    initialized: _initialized,
    lottieLoaded: _lottieLoaded,
    animationsAvailable: Object.keys(AVAILABLE_ANIMATIONS).length > 0,
    noErrors: _metrics.errors === 0
  };
  var score = 0;
  var total = 0;
  for (var key in checks) {
    if (checks.hasOwnProperty(key)) {
      total++;
      if (checks[key]) score++;
    }
  }
  var status = 'UNHEALTHY';
  if (score === total) status = 'HEALTHY';
  else if (score > 1) status = 'DEGRADED';
  return {
    status: status,
    score: score,
    maxScore: total,
    scoreDisplay: score + '/' + total,
    checks: checks,
    animationsLoaded: Object.keys(_animations).length,
    availableAnimations: Object.keys(AVAILABLE_ANIMATIONS),
    portsInitialized: _portsInitialized,
    p0Enterprise: true,
    strictMode: isStrict(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    lottieLoaded: _lottieLoaded,
    portsInitialized: _portsInitialized,
    p0Enterprise: true,
    strictMode: isStrict(),
    availableAnimations: AVAILABLE_ANIMATIONS,
    loadedAnimations: getLoadedAnimations(),
    metrics: Object.assign({}, _metrics),
    healthCheck: healthCheck()
  };
}

function reset() {
  destroyAll();
  _metrics.animationsLoaded = 0;
  _metrics.animationsPlayed = 0;
  _metrics.errors = 0;
  _metrics.lastActivity = Date.now();
  _log('info', 'Reset completo');
}

// DevTools exposure (sempre permitido)
if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  window.__dev.animacoes = {
    init: init,
    loadAnimation: loadAnimation,
    playAnimation: playAnimation,
    pauseAnimation: pauseAnimation,
    stopAnimation: stopAnimation,
    destroyAnimation: destroyAnimation,
    destroyAll: destroyAll,
    getAnimation: getAnimation,
    getLoadedAnimations: getLoadedAnimations,
    getAvailableAnimations: getAvailableAnimations,
    getVersion: getVersion,
    healthCheck: healthCheck,
    info: info,
    reset: reset,
    injectPorts: injectPorts,
    getPorts: getPorts,
    getLogs: getLogs,
    setDebug: setDebug
  };
}

export { init, loadAnimation, playAnimation, pauseAnimation, stopAnimation };
export { destroyAnimation, destroyAll, getAnimation, getLoadedAnimations, getAvailableAnimations };
export { getVersion, healthCheck, info, reset, getLogs, setDebug };
export { injectPorts, getPorts, VERSION, MODULE_ID };

export default {
  init: init,
  loadAnimation: loadAnimation,
  playAnimation: playAnimation,
  pauseAnimation: pauseAnimation,
  stopAnimation: stopAnimation,
  destroyAnimation: destroyAnimation,
  destroyAll: destroyAll,
  getAnimation: getAnimation,
  getLoadedAnimations: getLoadedAnimations,
  getAvailableAnimations: getAvailableAnimations,
  getVersion: getVersion,
  healthCheck: healthCheck,
  info: info,
  reset: reset,
  injectPorts: injectPorts,
  getPorts: getPorts,
  getLogs: getLogs,
  setDebug: setDebug,
  VERSION: VERSION,
  MODULE_ID: MODULE_ID
};
