// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health
// PURPOSE: Navigation Adapter Legacy - Health & Info
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, TRIGGER_PATTERNS, SECTION_MAPPING, DEFAULT_REGION from ./constants.js
//   getAuditLogSize from ./audit.js
//   getMetrics as getTriggerMetrics from ./trigger-normalizer.js
//   getMetrics as getItemMetrics from ./item-adapter.js
//   getMetrics as getSectionMetrics from ./section-adapter.js
//
// PROVIDES:
//   incrementAdaptations() — exported function
//   incrementDeduplications() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
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

import { VERSION, MODULE_ID, TRIGGER_PATTERNS, SECTION_MAPPING, DEFAULT_REGION } from './constants.js';
import { getAuditLogSize } from './audit.js';
import { getMetrics as getTriggerMetrics } from './trigger-normalizer.js';
import { getMetrics as getItemMetrics } from './item-adapter.js';
import { getMetrics as getSectionMetrics } from './section-adapter.js';

let _adaptationCount = 0;
let _deduplicationCount = 0;

export function incrementAdaptations() {
    _adaptationCount++;
}

export function incrementDeduplications() {
    _deduplicationCount++;
}

export function getMetrics() {
    const triggerMetrics = getTriggerMetrics();
    const itemMetrics = getItemMetrics();
    const sectionMetrics = getSectionMetrics();

    return {
        adaptations: _adaptationCount,
        triggerNormalizations: triggerMetrics.triggerNormalizations,
        regionAssignments: itemMetrics.regionAssignments,
        deduplications: _deduplicationCount,
        errors: itemMetrics.errors + sectionMetrics.errors
    };
}

export function resetMetrics() {
    _adaptationCount = 0;
    _deduplicationCount = 0;
    return { success: true };
}

export function healthCheck() {
    const metrics = getMetrics();
    const checks = {
        moduleLoaded: true,
        patternsReady: Object.keys(TRIGGER_PATTERNS).length > 0,
        noErrors: metrics.errors === 0
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
        status: passed === total ? 'HEALTHY' : 'DEGRADED',
        score: `${passed}/${total}`,
        checks,
        metrics,
        moduleId: MODULE_ID,
        version: VERSION,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        triggerPatterns: Object.keys(TRIGGER_PATTERNS),
        sectionMappings: Object.keys(SECTION_MAPPING),
        defaultRegion: DEFAULT_REGION,
        metrics: getMetrics(),
        auditLogSize: getAuditLogSize(),
        phase: 'P0 - Compatibility'
    };
}

export default {
    getMetrics,
    resetMetrics,
    healthCheck,
    info,
    incrementAdaptations,
    incrementDeduplications
};
