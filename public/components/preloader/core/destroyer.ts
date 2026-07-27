// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-destroyer
// PURPOSE: Preloader Destroyer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   registerTimer() — exported function
//   registerInterval() — exported function
//   registerObserver() — exported function
//   registerListener() — exported function
//   registerAnimation() — exported function
//   registerPromise() — exported function
//   destroy() — exported function
//   quickDestroy() — exported function
//   verifyDestruction() — exported function
//   resetRegistry() — exported function
//   getMetrics() — exported function
//   getRegistryStatus() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__PRELOADER_INSTANCE__
//   window.__PRELOADER__
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader-destroyer';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug', msg: string, ctx?: Record<string, unknown>) {
  const logger = _getPort('logger');
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (level === 'error') { if (logger.error) logger.error(msg, ctx); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(msg, ctx); return; }
  if (level === 'info') { if (logger.info) logger.info(msg, ctx); return; }
  if (logger.debug) logger.debug(msg, ctx);
}

const _resourceRegistry: { timers: Set<number | ReturnType<typeof setTimeout>>; intervals: Set<number>; observers: Set<MutationObserver | ResizeObserver | IntersectionObserver>; listeners: Record<string, any>[]; animations: Set<number>; promises: Set<Record<string, any>>; } = { timers: new Set(), intervals: new Set(), observers: new Set(), listeners: [], animations: new Set(), promises: new Set() };
const _metrics = { destroyCalls: 0, resourcesCleaned: 0, errors: 0, lastDestroyAt: null as number | null };

export function registerTimer(timerId: number | ReturnType<typeof setTimeout>) { _resourceRegistry.timers.add(timerId); return timerId; }
export function registerInterval(intervalId: number) { _resourceRegistry.intervals.add(intervalId); return intervalId; }
export function registerObserver(observer: MutationObserver | ResizeObserver | IntersectionObserver) { _resourceRegistry.observers.add(observer); return observer; }
export function registerListener(element: EventTarget, event: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) { _resourceRegistry.listeners.push({ element, event, handler, options }); return { element, event, handler, options }; }
export function registerAnimation(animationId: number) { _resourceRegistry.animations.add(animationId); return animationId; }
export function registerPromise(promise: Promise<unknown>, abortController?: AbortController) { const entry = { promise, abortController }; _resourceRegistry.promises.add(entry); return entry; }

function _cleanTimers() { let cleaned = 0; _resourceRegistry.timers.forEach((timer: number | ReturnType<typeof setTimeout>) => { try { clearTimeout(timer as ReturnType<typeof setTimeout>); cleaned++; } catch (e: any) {} }); _resourceRegistry.timers.clear(); return cleaned; }
function _cleanIntervals() { let cleaned = 0; _resourceRegistry.intervals.forEach((interval: number) => { try { clearInterval(interval); cleaned++; } catch (e: any) {} }); _resourceRegistry.intervals.clear(); return cleaned; }
function _cleanObservers() { let cleaned = 0; _resourceRegistry.observers.forEach((observer: MutationObserver | ResizeObserver | IntersectionObserver) => { try { observer.disconnect(); cleaned++; } catch (e: any) {} }); _resourceRegistry.observers.clear(); return cleaned; }
function _cleanListeners() { let cleaned = 0; _resourceRegistry.listeners.forEach((l: Record<string, any>) => { try { if (l.element) l.element.removeEventListener(l.event, l.handler, l.options); cleaned++; } catch (e: any) {} }); _resourceRegistry.listeners = []; return cleaned; }
function _cleanAnimations() { let cleaned = 0; _resourceRegistry.animations.forEach((animId: number) => { try { cancelAnimationFrame(animId); cleaned++; } catch (e: any) {} }); _resourceRegistry.animations.clear(); return cleaned; }
function _cleanPromises() { let cleaned = 0; _resourceRegistry.promises.forEach((entry: Record<string, any>) => { try { if (entry.abortController) entry.abortController.abort(); cleaned++; } catch (e: any) {} }); _resourceRegistry.promises.clear(); return cleaned; }

function _cleanDOM(rootElement: Element) {
  if (!rootElement) return 0;
  try {
    const videos = rootElement.querySelectorAll('video');
    videos.forEach((video: HTMLVideoElement) => { video.pause(); video.src = ''; video.load(); });
    const images = rootElement.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => { img.src = ''; });
    if (rootElement.parentNode) { rootElement.parentNode.removeChild(rootElement); }
    return 1;
  } catch (e: any) { _log('warn', 'DOM cleanup error', { error: e.message }); return 0; }
}

function _cleanGlobalReferences(instanceId: string) {
  const globalKeys = ['__PRELOADER__', '__PRELOADER_INSTANCE__', '__BOOT_ID__', `__preloader_${instanceId}__`];
  let cleaned = 0;
  globalKeys.forEach(key => {
    if (hasWindow && (window as Record<string, any>)[key]) { try { delete (window as Record<string, any>)[key]; cleaned++; } catch (e: any) { (window as Record<string, any>)[key] = undefined; } }
  });
  return cleaned;
}

function _cleanEventBusSubscriptions(eventBus: Record<string, any>, subscriptions?: Record<string, any>[]) {
  if (!eventBus) return 0;
  subscriptions = subscriptions || [];
  let cleaned = 0;
  subscriptions.forEach((sub: Record<string, any>) => { try { eventBus.off(sub.event, sub.handler); cleaned++; } catch (e: any) {} });
  return cleaned;
}

export function destroy(options: Record<string, any> = {}) {
  const rootElement = options.rootElement || null;
  const instanceId = options.instanceId || null;
  const eventBus = options.eventBus || null;
  const eventBusSubscriptions = options.eventBusSubscriptions || [];
  const onComplete = options.onComplete || null;
  const force = options.force || false;

  _metrics.destroyCalls++;
  _metrics.lastDestroyAt = Date.now();
  _initPorts();
  _log('info', 'Starting preloader destruction', { instanceId, force });

  const report: Record<string, any> = { timers: 0, intervals: 0, observers: 0, listeners: 0, animations: 0, promises: 0, dom: 0, globals: 0, eventBus: 0, total: 0, errors: [] as string[] };

  try {
    report.timers = _cleanTimers();
    report.intervals = _cleanIntervals();
    report.observers = _cleanObservers();
    report.listeners = _cleanListeners();
    report.animations = _cleanAnimations();
    report.promises = _cleanPromises();
    if (rootElement) { report.dom = _cleanDOM(rootElement); }
    if (instanceId) { report.globals = _cleanGlobalReferences(instanceId); }
    if (eventBus && eventBusSubscriptions.length > 0) { report.eventBus = _cleanEventBusSubscriptions(eventBus, eventBusSubscriptions); }
    report.total = report.timers + report.intervals + report.observers + report.listeners + report.animations + report.promises + report.dom + report.globals + report.eventBus;
    _metrics.resourcesCleaned += report.total;
    _log('info', 'Preloader destroyed successfully', { instanceId, resourcesCleaned: report.total });
  } catch (error: any) { _metrics.errors++; report.errors.push(error.message); _log('error', 'Error during destruction', { error: error.message }); }

  if (onComplete) { try { onComplete(report); } catch (e: any) { _log('warn', 'onComplete callback error', { error: e.message }); } }
  return report;
}

export function quickDestroy() {
  _cleanTimers(); _cleanIntervals(); _cleanObservers(); _cleanListeners(); _cleanAnimations(); _cleanPromises();
  if (hasDocument) {
    const preloaders = document.querySelectorAll('[data-preloader-root], #loading-screen');
    preloaders.forEach((el: Element) => { try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e: any) {} });
  }
  _log('info', 'Quick destroy completed');
  return true;
}

export function verifyDestruction() {
  const issues = [];
  if (_resourceRegistry.timers.size > 0) { issues.push(`${_resourceRegistry.timers.size} timers still registered`); }
  if (_resourceRegistry.intervals.size > 0) { issues.push(`${_resourceRegistry.intervals.size} intervals still registered`); }
  if (_resourceRegistry.observers.size > 0) { issues.push(`${_resourceRegistry.observers.size} observers still registered`); }
  if (_resourceRegistry.listeners.length > 0) { issues.push(`${_resourceRegistry.listeners.length} listeners still registered`); }
  if (hasDocument) {
    const preloaderElements = document.querySelectorAll('[data-preloader-root], #loading-screen');
    if (preloaderElements.length > 0) { issues.push(`${preloaderElements.length} preloader elements still in DOM`); }
  }
  if (hasWindow) { if ((window as any).__PRELOADER__) issues.push('__PRELOADER__ still exists'); if ((window as any).__PRELOADER_INSTANCE__) issues.push('__PRELOADER_INSTANCE__ still exists'); }
  return { clean: issues.length === 0, issues };
}

export function resetRegistry() { _resourceRegistry.timers.clear(); _resourceRegistry.intervals.clear(); _resourceRegistry.observers.clear(); _resourceRegistry.listeners = []; _resourceRegistry.animations.clear(); _resourceRegistry.promises.clear(); }
export function getMetrics() { return Object.assign({}, _metrics); }
export function getRegistryStatus() { return { timers: _resourceRegistry.timers.size, intervals: _resourceRegistry.intervals.size, observers: _resourceRegistry.observers.size, listeners: _resourceRegistry.listeners.length, animations: _resourceRegistry.animations.size, promises: _resourceRegistry.promises.size }; }
export function getStatus() { return { version: VERSION, moduleId: MODULE_ID, registry: getRegistryStatus(), portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }

export function healthCheck() {
  const verification = verifyDestruction();
  return { status: verification.clean ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { registryClean: verification.clean, noLeakedResources: verification.issues.length === 0, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized(), issues: verification.issues, metrics: getMetrics(), timestamp: Date.now() };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), features: ['timer-cleanup', 'interval-cleanup', 'observer-cleanup', 'listener-cleanup', 'animation-cleanup', 'promise-abort', 'dom-cleanup', 'global-cleanup', 'eventbus-cleanup', 'verification'], status: getStatus(), healthCheck: healthCheck() }; }

export default { VERSION, MODULE_ID, registerTimer, registerInterval, registerObserver, registerListener, registerAnimation, registerPromise, destroy, quickDestroy, verifyDestruction, resetRegistry, getMetrics, getRegistryStatus, getStatus, healthCheck, info, injectPorts, getPorts };
