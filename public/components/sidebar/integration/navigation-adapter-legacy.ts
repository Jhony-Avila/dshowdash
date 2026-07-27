// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-adapter-legacy
// PURPOSE: Navigation Adapter Legacy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, DEFAULT_REGION from ./navigation-adapter-legacy/constants.js
//   getAuditLog, clearAuditLog, logAudit from ./navigation-adapter-legacy/audit.js
//   normalizeTrigger from ./navigation-adapter-legacy/trigger-normalizer.js
//   adaptItem from ./navigation-adapter-legacy/item-adapter.js
//   adaptSection from ./navigation-adapter-legacy/section-adapter.js
//   validateAdaptedModel from ./navigation-adapter-legacy/validation.js
//   getMetrics, resetMetrics, healthCheck, info, incrementAdaptations, incrementDeduplications from ./navigation-adapter-legacy/health.js
//
// PROVIDES:
//   adaptLegacyModel() — exported function
//   adaptSingleItem() — exported function
//   adaptSingleSection() — exported function
//   normalizeSingleTrigger() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   validateAdaptedModel — exported value
//   getAuditLog — exported value
//   clearAuditLog — exported value
//   getMetrics — exported value
//   resetMetrics — exported value
//   healthCheck — exported value
//   info — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).NavigationAdapterLegacy
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID, DEFAULT_REGION } from './navigation-adapter-legacy/constants.js';
import { getAuditLog, clearAuditLog, logAudit } from './navigation-adapter-legacy/audit.js';
import { normalizeTrigger } from './navigation-adapter-legacy/trigger-normalizer.js';
import { adaptItem } from './navigation-adapter-legacy/item-adapter.js';
import { adaptSection } from './navigation-adapter-legacy/section-adapter.js';
import { validateAdaptedModel } from './navigation-adapter-legacy/validation.js';
import { getMetrics, resetMetrics, healthCheck, info, incrementAdaptations, incrementDeduplications } from './navigation-adapter-legacy/health.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export { VERSION, MODULE_ID };


export function adaptLegacyModel(legacyData: DynObj, options: { region?: string; source?: string } = {}) {
    const region = options.region || DEFAULT_REGION;

    incrementAdaptations();
    logAudit('model:adaptation:start', { source: options.source || 'unknown' });

    const sections: DynObj[] = [];
    const seenIds = {};

    let inputSections = [];

    if (Array.isArray(legacyData)) {
        inputSections = legacyData;
    } else if (legacyData.sections) {
        inputSections = legacyData.sections;
    } else if (legacyData.items) {
        inputSections = [{
            id: 'default',
            label: 'Menu',
            items: legacyData.items
        }];
    } else {
        logAudit('model:error', { reason: 'Unknown input format' });
        return { success: false, error: 'Unknown input format', model: null as HTMLElement | null };
    }

    for (let i = 0; i < inputSections.length; i++) {
        const adaptedSection = adaptSection(inputSections[i], { region });

        if (adaptedSection) {
            if ((seenIds as DynObj)[adaptedSection.id]) {
                incrementDeduplications();
                logAudit('section:deduplicated', { id: adaptedSection.id });
                const existingSection = sections.find(s => s.id === adaptedSection.id);
                if (existingSection) {
                    existingSection.items = existingSection.items.concat(adaptedSection.items);
                }
            } else {
                (seenIds as DynObj)[adaptedSection.id] = true;
                sections.push(adaptedSection);
            }
        }
    }

    sections.sort((a, b) => (a.order || 0) - (b.order || 0));

    const model = {
        schema_id: 'dsd.contracts/navigation.model.v1.json',
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        source: options.source || 'legacy',
        etag: null as DynObj,
        sections,
        defaults: {
            mode: 'multi',
            persist: { enabled: true, scope: 'user' }
        },
        meta: {
            trigger_pattern: 'trigger:navigation:item-{id}',
            section_trigger_pattern: 'trigger:navigation:section-{id}',
            region,
            phase: 'P0',
            compatibility: {
                legacy_triggers: true,
                legacy_events: true
            },
            adapter: {
                version: VERSION,
                adaptedAt: new Date().toISOString()
            }
        }
    };

    logAudit('model:adaptation:complete', {
        sectionsCount: sections.length,
        itemsCount: sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)
    });

    return {
        success: true,
        model,
        audit: getAuditLog()
    };
}

export function adaptSingleItem(legacyItem: DynObj, sectionId: string, options: DynObj) {
    return adaptItem(legacyItem, sectionId, options);
}

export function adaptSingleSection(legacySection: DynObj, options: DynObj) {
    return adaptSection(legacySection, options);
}

export function normalizeSingleTrigger(trigger: DynObj, type: string) {
    return normalizeTrigger(trigger, type || 'item');
}

export { validateAdaptedModel, getAuditLog, clearAuditLog, getMetrics, resetMetrics, healthCheck, info };

const NavigationAdapterLegacy = {
    VERSION,
    MODULE_ID,
    adaptLegacyModel,
    adaptSingleItem,
    adaptSingleSection,
    normalizeSingleTrigger,
    validateAdaptedModel,
    getAuditLog,
    clearAuditLog,
    getMetrics,
    resetMetrics,
    healthCheck,
    info
};

if (typeof window !== 'undefined') {
    (window as any).NavigationAdapterLegacy = NavigationAdapterLegacy;
}

export default NavigationAdapterLegacy;
