// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-mobile-methods
// PURPOSE: Sidebar API - Mobile Methods
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createMobileMethods() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   UI_INTENTS.REQUEST_LAYOUT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import * as Ports from './ports.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'sidebar-mobile-methods';

export function createMobileMethods(dependencies: DynObj) {
  const { engine, renderer, logger } = dependencies;
  
  return {
    openMobile() {
      try {
        engine.openMobile();
        renderer.setMobileOpen(true);
        
        const lm = Ports.get('layoutManager');
        const eb = Ports.get('eventBus');
        
        if (lm?.setSidebarMobileOpen) {
          lm.setSidebarMobileOpen(true);
        } else if (eb?.emit) {
          eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: 'sidebar-mobile-open', source: 'sidebar' });
        }
      } catch (error) {
        logger?.error?.('OpenMobile error:', error);
      }
    },
    
    closeMobile() {
      try {
        engine.closeMobile();
        renderer.setMobileOpen(false);
        
        const lm = Ports.get('layoutManager');
        const eb = Ports.get('eventBus');
        
        if (lm?.setSidebarMobileOpen) {
          lm.setSidebarMobileOpen(false);
        } else if (eb?.emit) {
          eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: 'sidebar-mobile-closed', source: 'sidebar' });
        }
      } catch (error) {
        logger?.error?.('CloseMobile error:', error);
      }
    },
    
    toggleMobile() {
      try {
        engine.toggleMobile();
        renderer.setMobileOpen(engine.mobileOpen);
        
        const mode = engine.mobileOpen ? 'sidebar-mobile-open' : 'sidebar-mobile-closed';
        const lm = Ports.get('layoutManager');
        const eb = Ports.get('eventBus');
        
        if (lm?.setSidebarMobileOpen) {
          lm.setSidebarMobileOpen(engine.mobileOpen);
        } else if (eb?.emit) {
          eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode, source: 'sidebar' });
        }
      } catch (error) {
        logger?.error?.('ToggleMobile error:', error);
      }
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { factoryReady: true }
  };
}

export default { createMobileMethods, info, healthCheck, VERSION, MODULE_ID };
