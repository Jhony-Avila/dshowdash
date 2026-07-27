// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: trigger-normalizer-legacy
// PURPOSE: Navigation Adapter Legacy - Trigger Normalizer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TRIGGER_PATTERNS from ./constants.js
//   logAudit from ./audit.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   STATUS — exported value
//   DEPRECATION_PHASE — exported value
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   normalizeTrigger() — exported function
//   extractIdFromTrigger() — exported function
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

import { TRIGGER_PATTERNS } from './constants.js';
import { logAudit } from './audit.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'trigger-normalizer-legacy';
export const VERSION = '1.3.0-ES6';
export const STATUS = 'LEGACY_ONLY';
export const DEPRECATION_PHASE = 'P3';

let _metrics = { triggerNormalizations: 0, legacyWarnings: 0 };

export function getMetrics() {
    return { 
        triggerNormalizations: _metrics.triggerNormalizations,
        legacyWarnings: _metrics.legacyWarnings
    };
}

export function resetMetrics() {
    _metrics.triggerNormalizations = 0;
    _metrics.legacyWarnings = 0;
}

/**
 * @deprecated Use buildNavigationItemTrigger/buildNavigationSectionTrigger from inventory.js
 * Normaliza triggers legados para o formato canônico V1 (3 segmentos)
 */
export function normalizeTrigger(trigger: DynObj, type: string) {
    if (!trigger) {
        return null;
    }

    if (type === 'item' && TRIGGER_PATTERNS.V1_ITEM.test(trigger)) {
        return trigger;
    }
    if (type === 'section' && TRIGGER_PATTERNS.V1_SECTION.test(trigger)) {
        return trigger;
    }

    let normalized = null;
    const originalTrigger = trigger;

    if (type === 'item') {
        const legacy4SegMatch = trigger.match(TRIGGER_PATTERNS.LEGACY_4SEG_ITEM);
        if (legacy4SegMatch) {
            normalized = `trigger:navigation:item-${legacy4SegMatch[1]}`;
            _metrics.legacyWarnings++;
        }

        const sidebarMatch = trigger.match(TRIGGER_PATTERNS.LEGACY_SIDEBAR);
        if (sidebarMatch && !normalized) {
            normalized = `trigger:navigation:item-${sidebarMatch[1]}`;
            _metrics.legacyWarnings++;
        }

        const accordionMatch = trigger.match(TRIGGER_PATTERNS.LEGACY_ACCORDION);
        if (accordionMatch && !normalized) {
            normalized = `trigger:navigation:item-${accordionMatch[1]}`;
            _metrics.legacyWarnings++;
        }

        const plainMatch = trigger.match(TRIGGER_PATTERNS.LEGACY_PLAIN);
        if (plainMatch && !normalized) {
            normalized = `trigger:navigation:item-${plainMatch[1]}`;
            _metrics.legacyWarnings++;
        }
    }

    if (type === 'section') {
        const legacy4SegSectionMatch = trigger.match(TRIGGER_PATTERNS.LEGACY_4SEG_SECTION);
        if (legacy4SegSectionMatch) {
            normalized = `trigger:navigation:section-${legacy4SegSectionMatch[1]}`;
            _metrics.legacyWarnings++;
        }

        const sidebarSectionMatch = trigger.match(/^trigger:sidebar:section:(.+)$/);
        if (sidebarSectionMatch && !normalized) {
            normalized = `trigger:navigation:section-${sidebarSectionMatch[1]}`;
            _metrics.legacyWarnings++;
        }

        const accordionSectionMatch = trigger.match(TRIGGER_PATTERNS.LEGACY_ACCORDION_SECTION);
        if (accordionSectionMatch && !normalized) {
            normalized = `trigger:navigation:section-${accordionSectionMatch[1]}`;
            _metrics.legacyWarnings++;
        }

        const plainSectionMatch = trigger.match(/^(?:sec-)?([a-z0-9-]+)$/);
        if (plainSectionMatch && !normalized) {
            normalized = `trigger:navigation:section-${plainSectionMatch[1]}`;
            _metrics.legacyWarnings++;
        }
    }

    if (normalized && normalized !== originalTrigger) {
        _metrics.triggerNormalizations++;
        logAudit('trigger:normalized:legacy', { 
            from: originalTrigger, 
            to: normalized, 
            type,
            warning: 'LEGACY_FORMAT_DETECTED'
        });
    }

    return normalized || trigger;
}

/**
 * @deprecated Use parseId from contracts.js
 * Extrai o ID de um trigger
 */
export function extractIdFromTrigger(trigger: DynObj) {
    if (!trigger) return null;

    const itemMatch = trigger.match(TRIGGER_PATTERNS.V1_ITEM);
    if (itemMatch) return itemMatch[1];

    const sectionMatch = trigger.match(TRIGGER_PATTERNS.V1_SECTION);
    if (sectionMatch) return sectionMatch[1];

    const legacy4SegItem = trigger.match(TRIGGER_PATTERNS.LEGACY_4SEG_ITEM);
    if (legacy4SegItem) return legacy4SegItem[1];

    const legacy4SegSection = trigger.match(TRIGGER_PATTERNS.LEGACY_4SEG_SECTION);
    if (legacy4SegSection) return legacy4SegSection[1];

    const parts = trigger.split(':');
    return parts[parts.length - 1];
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        status: STATUS,
        deprecationPhase: DEPRECATION_PHASE,
        warning: 'LEGACY ONLY - Use inventory.js builders for new code',
        metrics: getMetrics()
    };
}

export function healthCheck() {
    return {
        status: 'HEALTHY',
        moduleId: MODULE_ID,
        version: VERSION,
        legacyStatus: STATUS,
        deprecationPhase: DEPRECATION_PHASE,
        checks: {
            normalizerAvailable: true,
            outputFormat: '3-segment compliant',
            isLegacyOnly: true
        },
        warning: 'This module is LEGACY ONLY and will be removed in Phase P3',
        metrics: getMetrics()
    };
}

export default {
    MODULE_ID,
    VERSION,
    STATUS,
    DEPRECATION_PHASE,
    normalizeTrigger,
    extractIdFromTrigger,
    getMetrics,
    resetMetrics,
    info,
    healthCheck
};
