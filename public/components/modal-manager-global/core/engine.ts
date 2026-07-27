// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.core.engine
// PURPOSE: Modal Manager Global Engine - Stack logic and business rules
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract OPEN - open() opens modal with descriptor
// @contract UPDATE - update() updates modal properties
// @contract CLOSE - close() closes modal by id
// @contract CONFIRM - confirm() confirms and closes modal
// @contract CANCEL - cancel() cancels and closes modal
// @contract CLOSE_ALL - closeAll() closes all modals
// @contract GET_TOP - getTop() returns topmost visible modal
// @contract IS_OPEN - isOpen() checks if modal is open
// @contract HAS_BLOCKING - hasBlocking() checks for blocking modals
// @contract GET_STACK - getStack() returns modal stack
// @contract GET_MODAL - getModal() returns modal by id
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Store from ../state/store.js
//   validateModalDescriptor from ../utils/contracts.js
//   deepClone, executeCallback from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   open() — exported function
//   update() — exported function
//   close() — exported function
//   confirm() — exported function
//   cancel() — exported function
//   closeAll() — exported function
//   getTop() — exported function
//   isOpen() — exported function
//   hasBlocking() — exported function
//   getStack() — exported function
//   getModal() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): descriptor object, filter options
// EMITS (eventos): (none - uses callbacks)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.1.0-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import Store from '../state/store.js';
const _Store = Store as any;
import { validateModalDescriptor } from '../utils/contracts.js';
import { deepClone, executeCallback } from '../utils/helpers.js';

export const MODULE_ID = 'modal-manager-global.core.engine';
export const VERSION = '1.2.0-P2-ENTERPRISE';

function open(descriptor: Record<string, unknown>) {
    const validation = validateModalDescriptor(descriptor);
    if (!validation.valid) {
        return { ok: false, errors: validation.errors, warnings: validation.warnings };
    }

    const normalized = validation.normalized;
    const existing = _Store.getModal(normalized!.id);

    if (existing) {
        _Store.updateModalRuntime(normalized!.id, {
            visible: true,
            openedAt: Date.now(),
            closing: false
        });

        return {
            ok: true,
            id: normalized!.id,
            wasExisting: true,
            warnings: validation.warnings,
            state: _Store.getModal(normalized!.id)
        };
    }

    (normalized!.runtime as Record<string, unknown>).visible = true;
    (normalized!.runtime as Record<string, unknown>).openedAt = Date.now();

    // @ts-expect-error strict migration — TS2345
    const result = Store.pushModal(normalized);

    executeCallback((normalized!.callbacks as Record<string, unknown>)?.onOpen as ((...args: unknown[]) => void) | undefined, { id: normalized!.id, modal: (result as any).modal });

    return {
        ok: true,
        id: normalized!.id,
        wasExisting: false,
        warnings: validation.warnings,
        state: (result as any).modal
    };
}

function update(id: string, patch: Record<string, unknown>) {
    const existing = _Store.getModal(id);
    if (!existing) {
        return { ok: false, error: 'Modal not found' };
    }

    const allowedFields = ['title', 'content', 'props', 'context', 'callbacks'];
    const filteredPatch: Record<string, unknown> = {};

    for (const field of allowedFields) {
        if (patch[field] !== undefined) {
            filteredPatch[field] = patch[field];
        }
    }

    if (Object.keys(filteredPatch).length === 0) {
        return { ok: true, changed: false };
    }

    const updated = { ...existing, ...filteredPatch };
    Store.pushModal(updated);

    return { ok: true, changed: true, state: _Store.getModal(id) };
}

function close(id: string, reason?: string, result?: unknown) {
    if (reason === undefined) reason = 'manual';
    if (result === undefined) result = null;
    const modal = _Store.getModal(id);
    if (!modal) {
        return { ok: true, wasOpen: false };
    }

    _Store.updateModalRuntime(id, {
        closing: true,
        visible: false,
        closedAt: Date.now()
    });

    executeCallback(modal.callbacks?.onClose, { id, reason, result, modal: deepClone(modal) });

    setTimeout(() => {
        Store.popModal(id);
    }, modal.animation?.duration || 300);

    return {
        ok: true,
        wasOpen: true,
        reason,
        result,
        modal: deepClone(modal)
    };
}

function confirm(id: string, result: unknown) {
    if (result === undefined) result = true;
    const modal = _Store.getModal(id);
    if (!modal) {
        return { ok: false, error: 'Modal not found' };
    }

    executeCallback(modal.callbacks?.onConfirm, { id, result, modal: deepClone(modal) });
    return close(id, 'confirmed', result);
}

function cancel(id: string) {
    const modal = _Store.getModal(id);
    if (!modal) {
        return { ok: false, error: 'Modal not found' };
    }

    executeCallback(modal.callbacks?.onCancel, { id, modal: deepClone(modal) });
    return close(id, 'cancelled', null);
}

function closeAll(options: Record<string, unknown>) {
    if (!options) options = {};
    const stack = _Store.getStack();
    const closed = [];

    for (let i = 0; i < stack.length; i++) {
        const modal = stack[i];
        if (options.keepBlocking && modal.blocking) continue;
        if (options.type && modal.type !== options.type) continue;
        if (options.owner && modal.owner !== options.owner) continue;

        const result = close(modal.id, (options.reason as string) || 'close-all');
        if (result.ok && result.wasOpen) {
            closed.push(modal.id);
        }
    }

    return { ok: true, closed };
}

function getTop() {
    const stack = _Store.getStack({ visible: true });
    return stack.length > 0 ? stack[stack.length - 1] : null;
}

function isOpen(id: string) {
    const modal = _Store.getModal(id);
    return modal ? modal.runtime.visible : false;
}

function hasBlocking() {
    return _Store.getStack({ blocking: true, visible: true }).length > 0;
}

function getStack(filter?: Record<string, unknown>) {
    return _Store.getStack(filter);
}

function getModal(id: string) {
    return _Store.getModal(id);
}

function getVersion() {
    return VERSION;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, stackSize: _Store.getStack().length, topModal: getTop()?.id || null, timestamp: Date.now() }; }
export function healthCheck() { const stack = _Store.getStack(); const checks: Record<string, boolean> = { storeAvailable: typeof _Store.getStack === 'function', stackValid: Array.isArray(stack), noOrphanModals: stack.every((m: Record<string, unknown>) => m.id && m.runtime) }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i]]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, checks, stackSize: stack.length, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export {
    open,
    update,
    close,
    confirm,
    cancel,
    closeAll,
    getTop,
    isOpen,
    hasBlocking,
    getStack,
    getModal,
    getVersion
};

export default {
    open,
    update,
    close,
    confirm,
    cancel,
    closeAll,
    getTop,
    isOpen,
    hasBlocking,
    getStack,
    getModal,
    getVersion,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
};
