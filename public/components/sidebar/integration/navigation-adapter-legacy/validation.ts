// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: validation
// PURPOSE: Navigation Adapter Legacy - Validation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   validateAdaptedModel() — exported function
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
export const MODULE_ID = 'sidebar.integration.navigation-adapter-legacy.validation';

export function validateAdaptedModel(model: DynObj) {
    const errors = [];
    const warnings: DynObj[] = [];

    if (!model) {
        return { valid: false, errors: ['Model is null'], warnings: [] };
    }

    if (!model.schema_id) {
        errors.push('Missing schema_id');
    }

    if (!model.sections || !Array.isArray(model.sections)) {
        errors.push('Missing or invalid sections array');
    } else {
        model.sections.forEach((section: DynObj, idx: DynObj) => {
            if (!section.id) {
                errors.push(`Section ${idx} missing id`);
            }
            if (!section.label) {
                warnings.push(`Section ${section.id} missing label`);
            }
            if (!section.uarps?.trigger_id) {
                warnings.push(`Section ${section.id} missing uarps.trigger_id`);
            }

            (section.items || []).forEach((item: DynObj, itemIdx: DynObj) => {
                if (!item.id) {
                    errors.push(`Item ${itemIdx} in section ${section.id} missing id`);
                }
                if (!item.uarps?.trigger_id) {
                    warnings.push(`Item ${item.id} missing uarps.trigger_id`);
                }
            });
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

export default { validateAdaptedModel };
