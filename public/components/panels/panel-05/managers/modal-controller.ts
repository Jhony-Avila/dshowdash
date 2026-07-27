// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:managers:modal-controller
// PURPOSE: Panel-05 - Modal Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   modalsManager from ../ui/modals.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   close() — exported function
//   isOpen() — exported function
//   getActive() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { modalsManager } from '../ui/modals.js';
import * as Telemetry from '../telemetry/tracker.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:managers:modal-controller';

let _activeModal: HTMLElement | null = null;

export function show(type: string, options: Record<string, unknown> = {}) {
    options = options || {};
    close();
    let html = '';
    if (type === 'keyboard-help') { html = modalsManager.renderKeyboardHelp(); }
    else if (type === 'settings') { html = modalsManager.renderSettings(); }
    else if (type === 'date-picker') { html = modalsManager.renderDateRangePicker(options); }
    else { return null; }
    const modalContainer = document.createElement('div');
    modalContainer.className = 'p05-modal-wrapper';
    modalContainer.innerHTML = html;
    document.body.appendChild(modalContainer);
    _activeModal = modalContainer;
    const firstFocusable = modalContainer.querySelector('button, input, select');

    // @ts-expect-error TS migration - TS2339
    if (firstFocusable) firstFocusable.focus();
    Telemetry.trackAction('modal-open', { type });
    return modalContainer;
}

export function close() {
    if (_activeModal) {
        _activeModal.remove();
        _activeModal = null;
    }
}

export function isOpen() { return !!_activeModal; }
export function getActive() { return _activeModal; }

export function healthCheck() {
    const checks = { modalsManagerAvailable: !!modalsManager, telemetryAvailable: !!Telemetry };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, isOpen: !!_activeModal, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, isOpen: !!_activeModal, p25Compliant: true }; }

export default { show, close, isOpen, getActive, healthCheck, info, VERSION, MODULE_ID };
