// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: diagnostic
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   runDiagnostics() — exported function
//   logDiagnostics() — exported function
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

export const MODULE_ID = 'panel-nav-admin.handlers.diagnostic';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Nav Admin - Diagnostic Handlers
 * @module panel-nav-admin/handlers/diagnostic
 * @version 1.1.0-AAA
 */

interface DiagnosticState {
    getItems: () => Array<{ id?: string; label?: string; route?: string; action?: string }>;
}

interface DiagnosticResults {
    itemCount: number;
    hasErrors: boolean;
    errors: string[];
    warnings: string[];
}

export function runDiagnostics(state: DiagnosticState): DiagnosticResults {
    const results: DiagnosticResults = {
        itemCount: state.getItems().length,
        hasErrors: false,
        errors: [],
        warnings: []
    };

    const items = state.getItems();
    items.forEach((item: { id?: string; label?: string; route?: string; action?: string }) => {
        if (!item.id) results.errors.push(`Item sem ID: ${JSON.stringify(item)}`);
        if (!item.label) results.warnings.push(`Item ${item.id} sem label`);
        if (!item.route && !item.action) results.warnings.push(`Item ${item.id} sem route ou action`);
    });
    
    results.hasErrors = results.errors.length > 0;
    return results;
}

export function logDiagnostics(results: DiagnosticResults) {
    // v15.0.0: Only log errors via console.error (removed debug console.log)
    if (results.errors.length) console.error('[panel-nav-admin] Diagnóstico — Erros:', results.errors);
}

export default { runDiagnostics, logDiagnostics };
