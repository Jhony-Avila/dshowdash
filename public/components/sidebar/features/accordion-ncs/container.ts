// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container
// PURPOSE: Accordion NCS - Container Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_ID, UARPS_REGION, state from ./constants.js
//   CSS_CLASSES as C from ../../ui/constants.js
//
// PROVIDES:
//   createContainer() — exported function
//   removeContainer() — exported function
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

import { CONTAINER_ID, UARPS_REGION, state } from './constants.js';
import { CSS_CLASSES as C } from '../../ui/constants.js';

export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.features.accordion-ncs.container';

export function createContainer() {
    if (document.getElementById(CONTAINER_ID)) {
        return document.getElementById(CONTAINER_ID);
    }

    const navContent = document.querySelector(`.${C.NAV_CONTENT}`);
    if (!navContent) {
        return null;
    }

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = C.ACCORDION_CONTAINER;
    container.setAttribute('data-accordion-ncs-active', 'true');
    container.setAttribute('data-uarps-region', UARPS_REGION);

    navContent.insertBefore(container, navContent.firstChild);
    state.container = container;

    return container;
}

export function removeContainer() {
    const container = document.getElementById(CONTAINER_ID);
    if (container) {
        container.remove();
    }
    state.container = null;
}

export async function waitForNavContent(maxAttempts = 10, interval = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        const navContent = document.querySelector(`.${C.NAV_CONTENT}`);
        if (navContent) return true;
        await new Promise(r => { setTimeout(r, interval); });
    }
    return false;
}

export default {
    createContainer,
    removeContainer,
    waitForNavContent
};
