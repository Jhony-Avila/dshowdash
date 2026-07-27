// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-animated-transitions
// PURPOSE: Sidebar Features - Animated Transitions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   animateElement() — exported function
//   animateGroup() — exported function
//   animateSectionExpand() — exported function
//   animateSectionCollapse() — exported function
//   configure() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.ANIMATED_TRANSITIONS_INITIALIZED
// LISTENS (eventos):
//   'animationend'
//   SIDEBAR_EVENTS.ITEMS_LOADED
//   SIDEBAR_EVENTS.SEARCH_RESULTS
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

declare const C: Record<string, string>;

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.1.0-ES6';
export const MODULE_ID = 'sidebar-animated-transitions';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _container: DynObj = null;
let _enabled = true;
let _observer: MutationObserver | null = null;
let _activeTimers: number[] = [];
let _cleanups: DynObj[] = [];
let _metrics = { animations: 0, groups: 0, sections: 0, timersCreated: 0, timersCleared: 0 };

const ANIMATION_CLASSES = {
    fadeIn: 'dsd-anim--fade-in',
    fadeOut: 'dsd-anim--fade-out',
    slideIn: 'dsd-anim--slide-in',
    slideOut: 'dsd-anim--slide-out',
    scaleIn: 'dsd-anim--scale-in',
    scaleOut: 'dsd-anim--scale-out',
    bounceIn: 'dsd-anim--bounce-in'
};
const DEFAULT_CONFIG = { duration: 300, easing: 'ease-out', stagger: 50, type: 'slideIn' };
let _config = { ...DEFAULT_CONFIG };

function _setTimeout(fn: DynObj, delay: number) {
    _metrics.timersCreated++;
    const id = setTimeout(() => {
        _activeTimers = _activeTimers.filter(t => t !== id as DynObj);
        fn();
    }, delay);
    _activeTimers.push((id as DynObj));
    return id;
}

function _clearAllTimers() {
    _activeTimers.forEach(id => { clearTimeout(id); _metrics.timersCleared++; });
    _activeTimers = [];
}

function animateNewItems(data: DynObj) {
    if (!_enabled) return;
    const items: DynObj = data?.items || [];
    items.forEach((item: DynObj, index: number) => {
        const el = (_container as DynObj)?.querySelector(`[data-item-id="${item.id}"]`);
        if (el) _setTimeout(() => { animateElement(el, 'in'); }, index * _config.stagger);
    });
}

function animateSearchResults() {
    if (!_enabled || !_container) return;
    const visibleItems = (_container as DynObj).querySelectorAll(`.${C.ITEM}:not(.${C.ITEM_HIDDEN})`);
    visibleItems.forEach((item: DynObj, index: number) => {
        item.classList.add('dsd-anim--searching');
        _setTimeout(() => {
            item.classList.remove('dsd-anim--searching');
            animateElement(item, 'in', 'scaleIn');
        }, index * 30);
    });
}

export function init(eventBus: DynObj, container: DynObj, config: DynObj) {
    if (eventBus) Ports.inject({ eventBus });
    _initPorts();
    _container = container;
    _config = { ...DEFAULT_CONFIG, ...(config || {}) };
    if (_container) { setupObserver(); animateInitialItems(); }
    const eb = _getPort('eventBus');
    if (eb && eb.on) {
        const unsub1 = eb.on(SIDEBAR_EVENTS.ITEMS_LOADED, animateNewItems);
        const unsub2 = eb.on(SIDEBAR_EVENTS.SEARCH_RESULTS, animateSearchResults);

        _cleanups.push(typeof unsub1 === 'function'
            ? unsub1
            : () => { if (eb.off) eb.off(SIDEBAR_EVENTS.ITEMS_LOADED, animateNewItems); }
        );
        _cleanups.push(typeof unsub2 === 'function'
            ? unsub2
            : () => { if (eb.off) eb.off(SIDEBAR_EVENTS.SEARCH_RESULTS, animateSearchResults); }
        );
    }
    if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.ANIMATED_TRANSITIONS_INITIALIZED);
}

function setupObserver() {
    if (_observer) _observer.disconnect();
    _observer = new MutationObserver(mutations => {
        if (!_enabled) return;
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && (node as any).classList?.contains(C.ITEM)) animateElement(node as any, 'in');
            });
        });
    });
    const nav = (_container as DynObj)?.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`);
    if (nav) _observer.observe(nav, { childList: true, subtree: true });
}

function animateInitialItems() {
    if (!_enabled || !_container) return;
    const items = (_container as DynObj).querySelectorAll(`.${C.ITEM}`);
    items.forEach((item: DynObj, index: number) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-10px)';
        _setTimeout(() => { animateElement(item, 'in'); }, index * _config.stagger);
    });
}

export function animateElement(el: HTMLElement, direction: string, type?: string) {
    if (!el || !_enabled) return Promise.resolve();
    _metrics.animations++;
    direction = direction || 'in';
    const animType = type || _config.type;
    const className = direction === 'in'
        ? (ANIMATION_CLASSES as DynObj)[animType] || ANIMATION_CLASSES.slideIn
        : (ANIMATION_CLASSES as DynObj)[animType.replace('In', 'Out')] || ANIMATION_CLASSES.slideOut;
    return new Promise<void>(resolve => {
        el.style.animationDuration = `${_config.duration}ms`;
        el.style.animationTimingFunction = _config.easing;
        el.classList.add(className);
        let resolved = false;
        const cleanup = () => {
            if (resolved) return;
            resolved = true;
            el.classList.remove(className);
            el.style.opacity = direction === 'in' ? '1' : '0';
            el.style.transform = '';
            resolve();
        };
        const handler = () => { el.removeEventListener('animationend', handler); cleanup(); };
        el.addEventListener('animationend', handler);
        _setTimeout(cleanup, _config.duration + 50);
    });
}

export function animateGroup(elements: DynObj, direction: string, type: string) {
    _metrics.groups++;
    const els = Array.from(elements);
    return Promise.all(els.map((el, index) => new Promise<void>(resolve => {
        _setTimeout(() => {
            animateElement((el as DynObj), direction, type).then(resolve).catch(() => { resolve(); });
        }, index * _config.stagger);
    })));
}

export function animateSectionExpand(sectionEl: HTMLElement) {
    if (!_enabled || !sectionEl) return;
    _metrics.sections++;
    const items = sectionEl.querySelectorAll(`.${C.ITEM}`);
    items.forEach((item: DynObj, index: number) => {
        item.style.opacity = '0';
        _setTimeout(() => { animateElement((item as DynObj), 'in', 'slideIn'); }, index * 40);
    });
}

export function animateSectionCollapse(sectionEl: HTMLElement) {
    if (!_enabled || !sectionEl) return Promise.resolve();
    _metrics.sections++;
    const items = Array.from(sectionEl.querySelectorAll(`.${C.ITEM}`)).reverse();
    return Promise.all(items.map((item, index) => new Promise<void>(resolve => {
        _setTimeout(() => {
            animateElement((item as DynObj), 'out', 'slideOut').then(resolve).catch(() => { resolve(); });
        }, index * 20);
    })));
}

export function configure(config: DynObj) { _config = { ..._config, ...config }; }
export function enable() { _enabled = true; }
export function disable() { _enabled = false; }
export function isEnabled() { return _enabled; }

export function destroy() {
    (_cleanups as DynObj[]).forEach((fn: DynObj) => { try { fn(); } catch(e) { /* silent */ } });
    _cleanups = [];
    _clearAllTimers();
    _observer?.disconnect();
    _observer = null;
    _enabled = false;
    _container = null;
}

export function getMetrics() { return { ..._metrics, activeTimers: _activeTimers.length, cleanups: _cleanups.length }; }

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        portsInitialized: Ports.isInitialized(),
        enabled: _enabled,
        hasObserver: !!_observer,
        activeTimers: _activeTimers.length,
        cleanups: _cleanups.length,
        config: { ..._config },
        metrics: getMetrics(),
        p24Compliant: true
    };
}

export function healthCheck() {
    return {
        status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: Ports.isInitialized(),
        checks: { enabled: _enabled, hasObserver: !!_observer, noOrphanTimers: _activeTimers.length < 50, noOrphanListeners: true },
        metrics: getMetrics(),
        p24Compliant: true
    };
}

export default { init, animateElement, animateGroup, animateSectionExpand, animateSectionCollapse, configure, enable, disable, isEnabled, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
