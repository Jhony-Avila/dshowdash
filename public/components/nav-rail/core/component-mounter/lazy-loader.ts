// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-core-component-mounter-lazy-loader
// PURPOSE: NavRail Component Mounter - Lazy Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   componentState, metrics, MOUNTER_EVENTS from ./constants.js
//
// PROVIDES:
//   setDependencies() — exported function
//   LazyLoader — exported value
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   MOUNTER_EVENTS.LAZY_LOAD_COMPLETE — event emission
//   MOUNTER_EVENTS.LAZY_LOAD_START — event emission
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   window.innerHeight — runtime access
//   window.innerWidth — runtime access
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'nav-rail.core.component-mounter.lazy-loader';

import { componentState, metrics, MOUNTER_EVENTS } from './constants.js';

let _log: (level: string, msg: string, data?: unknown) => void = () => {};
let _getPort: (name: string) => unknown = () => null;
let _mountFn: ((id: string, hostEl: HTMLElement, props: Record<string, unknown>) => Promise<unknown>) | null = null;

export function setDependencies(logFn: (level: string, msg: string, data?: unknown) => void, getPortFn: (name: string) => unknown, mountFn: (id: string, hostEl: HTMLElement, props: Record<string, unknown>) => Promise<unknown>) {
    _log = logFn;
    _getPort = getPortFn;
    _mountFn = mountFn;
}

export const LazyLoader = {
    _observer: null as IntersectionObserver | null,
    _pendingHosts: new Map<HTMLElement, { id: string; props: Record<string, unknown> }>(),
    _initialized: false,
    _loadQueue: [] as Array<{ host: HTMLElement; id: string; props: Record<string, unknown> }>,
    _isProcessing: false,

    init() {
        if (this._initialized || typeof IntersectionObserver === 'undefined') return this;

        const self = this;
        this._observer = new IntersectionObserver(
            entries => { self._handleIntersection(entries); },
            { rootMargin: '50px', threshold: 0 }
        );
        this._initialized = true;
        _log('info', 'LazyLoader initialized');
        return this;
    },

    observe(hostElement: HTMLElement, componentId: string, props: Record<string, unknown>) {
        if (!hostElement) return;

        this._pendingHosts.set(hostElement, { id: componentId, props });
        this._showSkeleton(hostElement, componentId);

        if (!this._observer) {
            this._queueLoad(hostElement, componentId, props);
            return;
        }

        this._observer.observe(hostElement);

        const self = this;
        requestAnimationFrame(() => {
            if (self._isElementVisible(hostElement)) {
                self._triggerLoad(hostElement);
            }
        });
    },

    _isElementVisible(el: HTMLElement) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        const vertInView = (rect.top <= windowHeight + 50) && ((rect.top + rect.height) >= -50);
        const horInView = (rect.left <= windowWidth + 50) && ((rect.left + rect.width) >= -50);
        return vertInView && horInView;
    },

    _showSkeleton(host: HTMLElement, id: string) {
        host.innerHTML = `<div class="navrail-skeleton" data-skeleton-for="${id}" title="Loading ${id}..."><div class="navrail-skeleton__icon"></div></div>`;
    },

    _handleIntersection(entries: IntersectionObserverEntry[]) {
        const self = this;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // @ts-expect-error strict migration — TS2345
                self._triggerLoad(entry.target);
            }
        });
    },

    _triggerLoad(host: HTMLElement) {
        const data = this._pendingHosts.get(host);
        if (!data) return;
        if (componentState.mounted.has(data.id) || componentState.loading.has(data.id)) return;

        if (this._observer) this._observer.unobserve(host);
        this._pendingHosts.delete(host);

        this._queueLoad(host, data.id, data.props);
    },

    _queueLoad(host: HTMLElement, id: string, props: Record<string, unknown>) {
        this._loadQueue.push({ host, id, props });
        this._processQueue();
    },

    _processQueue() {
        if (this._isProcessing || this._loadQueue.length === 0) return;

        this._isProcessing = true;
        const self = this;
        const item = this._loadQueue.shift();

        if (componentState.mounted.has(item!.id) || componentState.loading.has(item!.id)) {
            this._isProcessing = false;
            this._processQueue();
            return;
        }

        componentState.loading.add(item!.id);
        metrics.lazyLoaded++;
        _log('debug', 'Lazy loading component', { id: item!.id });

        const eb = _getPort('eventBus') as { emit?: (event: string, data: unknown) => void } | null;
        if (eb && eb.emit) eb.emit(MOUNTER_EVENTS.LAZY_LOAD_START, { id: item!.id });

        if (_mountFn) {
            _mountFn(item!.id, item!.host, item!.props).then(instance => {
                componentState.loading.delete(item!.id);
                if (eb && eb.emit) eb.emit(MOUNTER_EVENTS.LAZY_LOAD_COMPLETE, { id: item!.id, success: !!instance });

                self._isProcessing = false;
                setTimeout(() => { self._processQueue(); }, 10);
            }).catch(() => {
                componentState.loading.delete(item!.id);
                self._isProcessing = false;
                setTimeout(() => { self._processQueue(); }, 10);
            });
        }
    },

    loadAllPending() {
        const self = this;
        const hosts = Array.from(this._pendingHosts.keys());
        hosts.forEach(host => {
            self._triggerLoad(host);
        });
    },

    disconnect() {
        if (this._observer) {
            this._observer.disconnect();
        }
        this._pendingHosts.clear();
        this._loadQueue = [];
        this._isProcessing = false;
    },

    destroy() {
        this.disconnect();
        this._observer = null;
        this._initialized = false;
    }
};

export default LazyLoader;
