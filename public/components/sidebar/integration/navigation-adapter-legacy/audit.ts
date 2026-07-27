// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: audit
// PURPOSE: Navigation Adapter Legacy - Audit Log
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   logAudit() — exported function
//   getAuditLog() — exported function
//   clearAuditLog() — exported function
//   getAuditLogSize() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.integration.navigation-adapter-legacy.audit';

let _auditLog: DynObj[] = [];

export function logAudit(action: DynObj, data: DynObj) {
    _auditLog.push({
        timestamp: Date.now(),
        action,
        data
    });

    if (_auditLog.length > 1000) {
        _auditLog = _auditLog.slice(-500);
    }
}

export function getAuditLog() {
    return _auditLog.slice();
}

export function clearAuditLog() {
    _auditLog = [];
    return { success: true };
}

export function getAuditLogSize() {
    return _auditLog.length;
}

export default {
    logAudit,
    getAuditLog,
    clearAuditLog,
    getAuditLogSize
};
