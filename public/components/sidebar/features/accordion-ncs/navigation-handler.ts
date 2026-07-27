// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.6.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: accordion-ncs-navigation-handler
// PURPOSE: Accordion NCS - Navigation Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   ACCORDION_INTENTS from /core/runtime/events/catalog/sidebar.events.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//   state, log from ./constants.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   setupNavigationHandler() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ROUTER_EVENTS.NAVIGATE
//   UI_EVENTS.HARD_NAV
// LISTENS (eventos):
//   eventName
// WINDOW ACCESS:
//   window.RouterGlobal
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { ACCORDION_INTENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { state, log } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'accordion-ncs-navigation-handler';
export const VERSION = '3.6.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _metrics = { navigations: 0, fallbacks: 0, errors: 0 };

export function setupNavigationHandler(accordionResult: DynObj) {
    _initPorts();
    
    const eventBus = accordionResult?.view?._eventBus || state.eventBus || _getPort('eventBus');
    if (!eventBus) {
        log('warn', 'No eventBus available for navigation handler');
        return;
    }

    const handleItemSelected = (payload: DynObj) => {
        const item = payload.item;
        if (!item || !item.target) {
            log('warn', 'Item selected without target:', payload);
            return;
        }

        const target = item.target;

        if (target.route || target.path) {
            const route = target.route || target.path;
            
            const router = _getPort('routerGlobal');
            if (router && router.navigate) {
                router.navigate(route, { source: MODULE_ID });
                _metrics.navigations++;
                log('info', `Navigating via Ports router: ${route}`);
                return;
            }
            
            const eb = _getPort('eventBus') || eventBus;
            if (eb && eb.emit) {
                eb.emit(ROUTER_EVENTS.NAVIGATE, {
                    path: route,
                    options: { source: MODULE_ID },
                    source: MODULE_ID,
                    timestamp: Date.now()
                });
                _metrics.navigations++;
                log('info', `Navigating via EventBus NAVIGATE: ${route}`);
                return;
            }
            
            if (eventBus && eventBus.emit) {
                eventBus.emit(UI_EVENTS.HARD_NAV, {
                    path: route,
                    reason: 'No router or EventBus via Ports',
                    source: MODULE_ID,
                    timestamp: Date.now()
                });
            }
            _metrics.fallbacks++;
            window.location.hash = route;
            log('info', `Fallback navigation to: ${route}`);
        }
    };

    const eventName = ACCORDION_INTENTS.SELECT_ITEM;
    eventBus.on(eventName, handleItemSelected);
    log('info', `Navigation handler listening to: ${eventName}`);

    state.cleanups.push(() => {
        eventBus.off(eventName, handleItemSelected);
    });
}

export function getMetrics() { return Object.assign({}, _metrics); }

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        p03Compliant: true,
        portsInitialized: Ports.isInitialized(),
        metrics: getMetrics()
    };
}

export function healthCheck() {
    const hasRouter = !!_getPort('routerGlobal');
    const hasEventBus = !!_getPort('eventBus');
    
    return {
        status: hasRouter || hasEventBus ? 'HEALTHY' : 'DEGRADED',
        score: (hasRouter ? 1 : 0) + (hasEventBus ? 1 : 0),
        maxScore: 2,
        checks: { hasRouter, hasEventBus },
        version: VERSION,
        moduleId: MODULE_ID,
        p03Compliant: true
    };
}

export default { setupNavigationHandler, info, healthCheck, getMetrics, VERSION, MODULE_ID, injectPorts, getPorts };
