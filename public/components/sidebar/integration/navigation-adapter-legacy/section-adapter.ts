// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: section-adapter-legacy
// PURPOSE: Navigation Adapter Legacy - Section Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_REGION, SECTION_MAPPING from ./constants.js
//   normalizeTrigger from ./trigger-normalizer.js
//   adaptItem, assignRegion from ./item-adapter.js
//   logAudit from ./audit.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   STATUS — exported value
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   adaptSection() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { DEFAULT_REGION, SECTION_MAPPING } from './constants.js';
import { normalizeTrigger } from './trigger-normalizer.js';
import { adaptItem, assignRegion } from './item-adapter.js';
import { logAudit } from './audit.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'section-adapter-legacy';
export const VERSION = '1.2.0-ES6';
export const STATUS = 'LEGACY_ONLY';

let _metrics = { errors: 0, adaptations: 0 };

export function getMetrics() {
    return { 
        errors: _metrics.errors,
        adaptations: _metrics.adaptations
    };
}

export function resetMetrics() {
    _metrics.errors = 0;
    _metrics.adaptations = 0;
}

/**
 * @deprecated Este método é LEGACY ONLY
 * Adapta uma seção legada para o formato NavigationModel V1
 */
export function adaptSection(legacySection: DynObj, options: { region?: string } = {}) {
    const region = options.region || DEFAULT_REGION;

    const sectionId = legacySection.id || legacySection.sectionId;
    if (!sectionId) {
        _metrics.errors++;
        logAudit('section:error:legacy', { reason: 'No ID found', section: legacySection });
        return null;
    }

    const normalizedSectionId = sectionId.replace(/^sec-/, '');
    const canonicalId = (SECTION_MAPPING as DynObj)[normalizedSectionId] || normalizedSectionId;

    const triggerId = normalizeTrigger(
        legacySection.trigger || legacySection.uarps?.trigger_id || canonicalId,
        'section'
    );

    const adaptedItems = [];
    const items: DynObj = legacySection.items || [];

    for (let i = 0; i < items.length; i++) {
        const adaptedItem = adaptItem(items[i], canonicalId, { region });
        if (adaptedItem) {
            adaptedItems.push(adaptedItem);
        }
    }

    const adaptedSection = {
        id: canonicalId,
        label: legacySection.label || legacySection.title || legacySection.name || canonicalId,
        description: legacySection.description || null,
        icon: legacySection.icon || 'folder',
        order: legacySection.order || legacySection.priority || 0,
        uarps: {
            trigger_id: triggerId,
            region_id: assignRegion(legacySection, region)
        },
        accordion: {
            collapsible: legacySection.collapsible !== false,
            default_open: legacySection.expanded !== false && legacySection.defaultOpen !== false,
            allow_multiple: legacySection.allowMultiple !== false
        },
        visible: legacySection.visible !== false,
        items: adaptedItems,
        source: 'legacy-adapter',
        version: 'v1'
    };

    _metrics.adaptations++;
    logAudit('section:adapted:legacy', { id: canonicalId, trigger: triggerId, itemsCount: adaptedItems.length });

    return adaptedSection;
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        status: STATUS,
        warning: 'LEGACY ONLY - Do not use for new code',
        metrics: getMetrics()
    };
}

export function healthCheck() {
    return {
        status: 'HEALTHY',
        moduleId: MODULE_ID,
        version: VERSION,
        legacyStatus: STATUS,
        checks: {
            adapterAvailable: true,
            outputFormat: 'NavigationModel V1',
            isLegacyOnly: true
        },
        metrics: getMetrics()
    };
}

export default {
    MODULE_ID,
    VERSION,
    STATUS,
    adaptSection,
    getMetrics,
    resetMetrics,
    info,
    healthCheck
};
