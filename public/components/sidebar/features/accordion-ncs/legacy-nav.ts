// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: legacy-nav
// PURPOSE: Accordion NCS - Legacy Navigation Control
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_ID, log from ./constants.js
//   CSS_CLASSES as C from ../../ui/constants.js
//
// PROVIDES:
//   hideLegacyNav() — exported function
//   showLegacyNav() — exported function
//   getLegacyHiddenCount() — exported function
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

import { CONTAINER_ID, log } from './constants.js';
import { CSS_CLASSES as C } from '../../ui/constants.js';

export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.features.accordion-ncs.legacy-nav';

export function hideLegacyNav() {
    const navContent = document.querySelector(`.${C.NAV_CONTENT}`);
    if (!navContent) return;

    const children = navContent.children;
    let hiddenCount = 0;

    for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        if (child.id === CONTAINER_ID) continue;
        if (child.hasAttribute('data-accordion-ncs-active')) continue;

        if (child.classList.contains(C.SECTION) ||
            child.classList.contains(C.NAV_SECTION)) {
            child.style.display = 'none';
            child.setAttribute('data-ncs-hidden', 'true');
            hiddenCount++;
        }
    }

    log('info', `Legacy navigation hidden (${hiddenCount} elements)`);
}

export function showLegacyNav() {
    const legacyElements = document.querySelectorAll('[data-ncs-hidden="true"]');
    // @ts-expect-error strict migration — TS2345
    legacyElements.forEach((el: HTMLElement) => {
        el.style.display = '';
        el.removeAttribute('data-ncs-hidden');
    });
    log('info', 'Legacy navigation restored');
}

export function getLegacyHiddenCount() {
    return document.querySelectorAll('[data-ncs-hidden="true"]').length;
}

export default {
    hideLegacyNav,
    showLegacyNav,
    getLegacyHiddenCount
};
