// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: form-handlers
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   handleFormSubmit() — exported function
//   validateForm() — exported function
//   resetForm() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'submit'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-orchestrator-manager.form-handlers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Orchestrator Manager - Form Handlers
 * @module panel-orchestrator-manager/form-handlers
 * @version 1.1.0-AAA
 */

export function handleFormSubmit(form: HTMLFormElement, onSubmit: (data: Record<string, FormDataEntryValue>) => void) {
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        onSubmit(data);
    });
}

export function validateForm(data: Record<string, unknown>, rules: Record<string, unknown> = {}) {
    const errors: Record<string, string> = {};

    Object.entries(rules).forEach(([field, rule]) => {
        const r = rule as Record<string, unknown>;
        const value = data[field];

        if (r['required'] && !value) {
            errors[field] = `${field} é obrigatório`;
        }

        if (r['minLength'] && typeof value === 'string' && value.length < (r['minLength'] as number)) {
            errors[field] = `${field} deve ter pelo menos ${r['minLength']} caracteres`;
        }

        if (r['pattern'] && typeof (r['pattern'] as RegExp).test === 'function' && !(r['pattern'] as RegExp).test(String(value))) {
            errors[field] = (r['message'] as string) || `${field} inválido`;
        }
    });

    return { valid: Object.keys(errors).length === 0, errors };
}

export function resetForm(form: HTMLFormElement | null | undefined) {
    form?.reset();
}

export default { handleFormSubmit, validateForm, resetForm };
