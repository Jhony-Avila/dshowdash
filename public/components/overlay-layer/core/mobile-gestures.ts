// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.mobile-gestures
// PURPOSE: Overlay Layer Mobile Gestures - Swipe to close for mobile
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract IS_TOUCH_DEVICE - isTouchDevice() checks touch support
// @contract ATTACH - attach() attaches swipe gesture to overlay
// @contract DETACH - detach() removes swipe gesture
// @contract DETACH_ALL - detachAll() removes all gestures
// @contract ATTACH_EDGE_SWIPE - attachEdgeSwipe() enables edge swipe
// @contract GET_CONFIG - getConfig() returns gesture config
// @contract SET_CONFIG - setConfig() updates gesture config
// @contract GET_METRICS - getMetrics() returns gesture metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isTouchDevice() — exported function
//   attach() — exported function
//   detach() — exported function
//   detachAll() — exported function
//   attachEdgeSwipe() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: window.ontouchstart, navigator.maxTouchPoints
// ───────────────────────────────────────────────────────────────
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-mobile-gestures';

const _config = { enabled: true, swipeThreshold: 80, velocityThreshold: 0.5, edgeSwipeWidth: 30, directions: ['down', 'left', 'right'] };
let _activeGestures = {};
const _metrics = { swipesDetected: 0, swipesCompleted: 0, swipesCancelled: 0 };

export function isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

export function attach(element: HTMLElement, overlayId: string, options: DynObj) {
  options = options || {};
  if (!element || !_config.enabled) return { ok: false, reason: element ? 'disabled' : 'no-element' };
  const direction = options.direction || 'down';
  const onSwipeClose = options.onSwipeClose || (() => {});
  const onSwipeProgress = options.onSwipeProgress || (() => {});
  let startX = 0, startY = 0, startTime = 0, currentX = 0, currentY = 0, isDragging = false;

  const handleTouchStart = (e: TouchEvent) => { const touch = e.touches[0]; startX = touch.clientX; startY = touch.clientY; startTime = Date.now(); isDragging = true; element.style.transition = 'none'; };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];currentX = touch.clientX;currentY = touch.clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    let progress = 0;
    let transform = '';
    if (direction === 'down' && deltaY > 0) { progress = Math.min(deltaY / _config.swipeThreshold, 1); transform = `translateY(${deltaY}px)`; e.preventDefault(); }
    else if (direction === 'up' && deltaY < 0) { progress = Math.min(Math.abs(deltaY) / _config.swipeThreshold, 1); transform = `translateY(${deltaY}px)`; e.preventDefault(); }
    else if (direction === 'left' && deltaX < 0) { progress = Math.min(Math.abs(deltaX) / _config.swipeThreshold, 1); transform = `translateX(${deltaX}px)`; e.preventDefault(); }
    else if (direction === 'right' && deltaX > 0) { progress = Math.min(deltaX / _config.swipeThreshold, 1); transform = `translateX(${deltaX}px)`; e.preventDefault(); }
    if (transform) { element.style.transform = transform; element.style.opacity = String(1 - progress * 0.3); onSwipeProgress(progress, { deltaX, deltaY }); }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const elapsed = Date.now() - startTime;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / elapsed;
    let shouldClose = false;
    if (direction === 'down') shouldClose = deltaY > _config.swipeThreshold || (deltaY > 30 && velocity > _config.velocityThreshold);
    else if (direction === 'up') shouldClose = Math.abs(deltaY) > _config.swipeThreshold || (Math.abs(deltaY) > 30 && velocity > _config.velocityThreshold);
    else if (direction === 'left') shouldClose = Math.abs(deltaX) > _config.swipeThreshold || (Math.abs(deltaX) > 30 && velocity > _config.velocityThreshold);
    else if (direction === 'right') shouldClose = deltaX > _config.swipeThreshold || (deltaX > 30 && velocity > _config.velocityThreshold);
    _metrics.swipesDetected++;
    if (shouldClose) {
      _metrics.swipesCompleted++;
      element.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
      if (direction === 'down') element.style.transform = 'translateY(100%)';
      else if (direction === 'up') element.style.transform = 'translateY(-100%)';
      else if (direction === 'left') element.style.transform = 'translateX(-100%)';
      else if (direction === 'right') element.style.transform = 'translateX(100%)';
      element.style.opacity = '0';
      setTimeout(() => { onSwipeClose('swipe'); }, 200);
    } else {
      _metrics.swipesCancelled++;
      element.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
      element.style.transform = ''; element.style.opacity = '1';
    }
    startX = 0;startY = 0;currentX = 0;currentY = 0;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  const cleanup = () => { element.removeEventListener('touchstart', handleTouchStart); element.removeEventListener('touchmove', handleTouchMove); element.removeEventListener('touchend', handleTouchEnd); element.removeEventListener('touchcancel', handleTouchEnd); delete (_activeGestures as DynObj)[overlayId]; };
  (_activeGestures as DynObj)[overlayId] = { element, cleanup, direction };
  return { ok: true, overlayId, direction };
}

export function detach(overlayId: string) { const gesture = (_activeGestures as DynObj)[overlayId]; if (!gesture) return { ok: false, reason: 'not-found' }; gesture.cleanup(); return { ok: true, overlayId }; }

export function detachAll() { const keys = Object.keys(_activeGestures); const count = keys.length; for (let i = 0; i < keys.length; i++) (_activeGestures as DynObj)[keys[i]].cleanup(); _activeGestures = {}; return { ok: true, detached: count }; }

export function attachEdgeSwipe(edge: DynObj, onEdgeSwipe: DynObj) {
  edge = edge || 'left';
  if (typeof window === 'undefined') return { ok: false };
  let startX = 0, isEdgeSwipe = false;
  const handleTouchStart = (e: TouchEvent) => { const touch = e.touches[0]; startX = touch.clientX; const windowWidth = window.innerWidth; isEdgeSwipe = (edge === 'left' && startX < _config.edgeSwipeWidth) || (edge === 'right' && startX > windowWidth - _config.edgeSwipeWidth); };
  const handleTouchEnd = (e: TouchEvent) => { if (!isEdgeSwipe) return; const touch = e.changedTouches[0]; const deltaX = touch.clientX - startX; if (edge === 'left' && deltaX > _config.swipeThreshold) { if (onEdgeSwipe) onEdgeSwipe('open', 'left'); } else if (edge === 'right' && deltaX < -_config.swipeThreshold) { if (onEdgeSwipe) onEdgeSwipe('open', 'right'); } isEdgeSwipe = false; };
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  return { ok: true, edge, cleanup() { document.removeEventListener('touchstart', handleTouchStart); document.removeEventListener('touchend', handleTouchEnd); } };
}

export function getConfig() { return Object.assign({}, _config); }
export function setConfig(newConfig: DynObj) { if (newConfig.enabled !== undefined) _config.enabled = newConfig.enabled; if (newConfig.swipeThreshold) _config.swipeThreshold = newConfig.swipeThreshold; if (newConfig.velocityThreshold) _config.velocityThreshold = newConfig.velocityThreshold; if (newConfig.edgeSwipeWidth) _config.edgeSwipeWidth = newConfig.edgeSwipeWidth; return { ok: true, config: Object.assign({}, _config) }; }
export function getMetrics() { return Object.assign({}, _metrics, { activeGestures: Object.keys(_activeGestures).length }); }

export function healthCheck() {
  const checks = { touchSupported: isTouchDevice(), enabled: _config.enabled, noLeakedGestures: Object.keys(_activeGestures).length < 10 };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  return { status: passed >= 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, touchDevice: isTouchDevice(), config: getConfig(), activeGestures: Object.keys(_activeGestures).length, metrics: getMetrics(), timestamp: Date.now() }; }

export default { isTouchDevice, attach, detach, detachAll, attachEdgeSwipe, getConfig, setConfig, getMetrics, healthCheck, info, VERSION, MODULE_ID };
