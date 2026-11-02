// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-LOTTIE-TRANSITION)
// ═══════════════════════════════════════════════════════════════
// MODULE: bootstrap-v2.loader.stages.panel-loading-transition
// PURPOSE: Lottie loading animation during panel transitions
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none — self-contained)
//
// PROVIDES:
//   init(eventBus) — exported function
//   destroy() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// LISTENS (eventos):
//   router.route.changed — show Lottie loading
// OBSERVES:
//   MutationObserver on container-main contentEl — hide Lottie when panel mounts
// LOTTIE ASSET:
//   /assets/animacoes/Loading_Cube.json
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.0-LOTTIE-TRANSITION';
var MODULE_ID = 'bootstrap-v2.loader.stages.panel-loading-transition';

var LOTTIE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
var LOTTIE_ANIM_PATH = '/assets/animacoes/Loading_Cube.json';
var CONTAINER_CLASS = 'dsd-panel-lottie-loading';
var FADE_DURATION = 300;
var CONTENT_DETECT_DELAY = 80;

interface EventBusLike {
  on?: (event: string, handler: () => void) => (() => void) | undefined;
  off?: (event: string) => void;
  subscribe?: (event: string, handler: () => void) => (() => void) | undefined;
  [key: string]: unknown;
}

interface LottieAnimation {
  destroy(): void;
  [key: string]: unknown;
}

var _eventBus: EventBusLike | null = null;
var _observer: MutationObserver | null = null;
var _unsubRoute: (() => void) | null = null;
var _currentAnim: LottieAnimation | null = null;
var _isShowing = false;
var _stylesInjected = false;
var _hideTimer: ReturnType<typeof setTimeout> | null = null;

declare var lottie: { loadAnimation: (config: Record<string, unknown>) => { destroy: () => void }; [key: string]: unknown };

function _ensureLottieLib() {
  if (typeof lottie !== 'undefined') return Promise.resolve(true);
  return new Promise(function(resolve) {
    var existing = document.querySelector('script[src*="lottie-web"]');
    if (existing) {
      if (typeof lottie !== 'undefined') { resolve(true); return; }
      existing.addEventListener('load', function() { resolve(true); });
      setTimeout(function() { resolve(typeof lottie !== 'undefined'); }, 3000);
      return;
    }
    var script = document.createElement('script');
    script.src = LOTTIE_CDN;
    script.onload = function() { resolve(true); };
    script.onerror = function() { resolve(false); };
    document.head.appendChild(script);
  });
}

function _injectStyles() {
  if (_stylesInjected) return;
  var style = document.createElement('style');
  style.id = 'dsd-panel-lottie-transition-styles';
  style.textContent = [
    '.' + CONTAINER_CLASS + ' {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  width: 100%;',
    '  height: 100%;',
    '  min-height: 300px;',
    '  position: absolute;',
    '  top: 0; left: 0; right: 0; bottom: 0;',
    '  z-index: 50;',
    '  background: var(--dsd-bg-primary, #0a0c14);',
    '  opacity: 1;',
    '  transition: opacity ' + FADE_DURATION + 'ms ease;',
    '  pointer-events: none;',
    '}',
    '.' + CONTAINER_CLASS + '__anim {',
    '  width: 120px;',
    '  height: 120px;',
    '}',
    '.' + CONTAINER_CLASS + '--hiding {',
    '  opacity: 0;',
    '}'
  ].join('\n');
  document.head.appendChild(style);
  _stylesInjected = true;
}

function _getContentEl() {
  var cm = document.getElementById('container-main');
  if (cm) {
    var cel = cm.querySelector('.dsd-container__content');
    if (cel) return cel;
  }
  var shell = document.querySelector('#shell-main-region, [data-region="main"], #main');
  if (shell) {
    var cel2 = shell.querySelector('.dsd-container__content');
    if (cel2) return cel2;
  }
  return null;
}

function _show() {
  if (_isShowing) return;
  var contentEl = _getContentEl();
  if (!contentEl) return;

  _isShowing = true;
  if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }

  _injectStyles();

  var pos = getComputedStyle(contentEl).position;
  if (pos === 'static' || pos === '') {
    (contentEl as HTMLElement).style.position = 'relative';
  }

  var wrapper = document.createElement('div');
  wrapper.className = CONTAINER_CLASS;
  wrapper.setAttribute('data-lottie-transition', 'active');
  var animEl = document.createElement('div');
  animEl.className = CONTAINER_CLASS + '__anim';
  wrapper.appendChild(animEl);
  contentEl.appendChild(wrapper);

  _startObserving(contentEl);

  _ensureLottieLib().then(function(loaded) {
    if (!loaded || typeof lottie === 'undefined') return;
    if (!wrapper.parentNode || !_isShowing) return;
    try {
      _currentAnim = lottie.loadAnimation({
        container: animEl,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: LOTTIE_ANIM_PATH
      });
    } catch (e) {}
  });

  _hideTimer = setTimeout(function() { _hide(); }, 8000);
}

function _hide() {
  if (!_isShowing) return;
  _isShowing = false;

  if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
  _stopObserving();

  var contentEl = _getContentEl();
  if (!contentEl) return;

  var wrapper = contentEl.querySelector('.' + CONTAINER_CLASS);
  if (!wrapper) return;

  if (_currentAnim) {
    try { _currentAnim.destroy(); } catch (e) {}
    _currentAnim = null;
  }

  wrapper.classList.add(CONTAINER_CLASS + '--hiding');
  setTimeout(function() {
    // @ts-expect-error strict migration — TS2345
    if (wrapper!.parentNode) wrapper!.parentNode.removeChild(wrapper);
  }, FADE_DURATION + 50);
}

function _startObserving(contentEl: Element) {
  _stopObserving();
  _observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeType === 1 && !(node as Element).classList.contains(CONTAINER_CLASS)) {
          setTimeout(function() { _hide(); }, CONTENT_DETECT_DELAY);
          return;
        }
      }
    }
  });
  _observer.observe(contentEl, { childList: true });
}

function _stopObserving() {
  if (_observer) {
    _observer.disconnect();
    _observer = null;
  }
}

function _subscribe(eventBus: EventBusLike) {
  if (!eventBus) return;
  _eventBus = eventBus;
  if (eventBus.on) {
    // @ts-expect-error strict migration — TS2322
    _unsubRoute = eventBus.on('router.route.changed', function() { _show(); });
  } else if (eventBus.subscribe) {
    // @ts-expect-error strict migration — TS2322
    _unsubRoute = eventBus.subscribe('router.route.changed', function() { _show(); });
  }
}

export function init(eventBus: EventBusLike) {
  if (!eventBus) return { ok: false, reason: 'No EventBus' };
  _subscribe(eventBus);
  _ensureLottieLib();
  return { ok: true, version: VERSION, moduleId: MODULE_ID };
}

export function destroy() {
  _hide();
  if (_unsubRoute && typeof _unsubRoute === 'function') _unsubRoute();
  else if (_eventBus && _eventBus.off) _eventBus.off('router.route.changed');
  _stopObserving();
  _eventBus = null;
  _unsubRoute = null;
}

export { VERSION, MODULE_ID };
export default { init, destroy, VERSION, MODULE_ID };
