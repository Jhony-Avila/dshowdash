// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: feature-flags
// PURPOSE: Accordion NCS - Feature Flags
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FEATURE_FLAG_KEY from ./constants.js
//
// PROVIDES:
//   getFeatureFlags() — exported function
//   setFeatureFlag() — exported function
//   isEnabled() — exported function
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

import { FEATURE_FLAG_KEY } from './constants.js';

export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.features.accordion-ncs.feature-flags';

export function getFeatureFlags() {
    try {
        const stored = localStorage.getItem('dshowdash:featureFlags');
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
}

export function setFeatureFlag(key: string, value: string) {
    try {
        const flags = getFeatureFlags();
        flags[key] = value;
        localStorage.setItem('dshowdash:featureFlags', JSON.stringify(flags));
        return true;
    } catch (e) {
        return false;
    }
}

export function isEnabled() {
    const flags = getFeatureFlags();
    return flags[FEATURE_FLAG_KEY] === true;
}

export default {
    getFeatureFlags,
    setFeatureFlag,
    isEnabled
};
