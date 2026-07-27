// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-core-component-mounter-error-boundary
// PURPOSE: NavRail Component Mounter - Error Boundary
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//
// PROVIDES:
//   setDependencies() — exported function
//   renderErrorButton() — exported function
//   track() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   eventName — event emission
//
// LISTENS (eventos):
//   'click' — event listener
//
// WINDOW ACCESS:
//   window.NavRailTracker — runtime access
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID } from './constants.js';

export const VERSION = '3.1.0-ES6';

let _getPort: (name: string) => unknown = () => null;
let _retryFn: ((id: string) => void) | null = null;

export function setDependencies(getPortFn: (name: string) => unknown, retryFn: (id: string) => void) {
    _getPort = getPortFn;
    _retryFn = retryFn;
}

export function renderErrorButton(host: HTMLElement, id: string, errorMsg: string) {
    const safeId = id.replace(/['"]/g, '');
    const safeMsg = (errorMsg || 'Unknown error').replace(/['"<>]/g, '').substring(0, 100);

    host.innerHTML = `<button class="navrail-btn navrail-btn--error" data-component-id="${safeId}" data-error="true" title="Error loading ${safeId}: ${safeMsg}. Click to retry." aria-label="Retry loading ${safeId}"><span class="navrail-btn__icon navrail-btn__icon--error">⚠️</span></button>`;

    const btn = host.querySelector('.navrail-btn--error');
    if (btn && _retryFn) {
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            // @ts-expect-error strict migration — TS2721
            _retryFn(safeId);
        });
    }
}

export function track(eventName: string, data?: Record<string, unknown>) {
    const eb = _getPort('eventBus') as Record<string, unknown> & { emit?: (name: string, data: unknown) => void };
    if (eb && eb.emit) {
        eb.emit(eventName, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data));
    }

    if (typeof window !== 'undefined' && (window as any).NavRailTracker && (window as any).NavRailTracker.track) {
        (window as any).NavRailTracker.track(eventName, data);
    }
}

export default {
    renderErrorButton,
    track,
    setDependencies
};
