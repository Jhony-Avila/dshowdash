// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.9.0-ABSOLUTE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-bootstrap
// PURPOSE: Initializer - Container Bootstrap
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ../constants.js
//   incrementBootstraps, incrementErrors from ../state.js
//   getSafeMountPoint from ../core/mount-point.js
//   loadPanelHome from ../panel-home/panel-home-manager.js
//   createPlaceholder from ../ui/placeholder.js
//   createControls from /components/main/ui/container-main/components/controls.js
//   createEnhancements from /components/main/ui/container-main/components/ux-enha...
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//
// PROVIDES:
//   bootstrapPrimaryContainer() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   CONTAINER_EVENTS.ERROR
//   CONTAINER_EVENTS.READY
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import type { MainState } from '../../../types.js';
import { MODULE_ID } from '../constants.js';
import { incrementBootstraps, incrementErrors } from '../state.js';
import { getSafeMountPoint } from '../core/mount-point.js';
import { loadPanelHome } from '../panel-home/panel-home-manager.js';
import { createPlaceholder } from '../ui/placeholder.js';

import { createControls } from '/components/main/ui/container-main/components/controls.js';
import { createEnhancements } from '/components/main/ui/container-main/components/ux-enhancements/index.js';
import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';

export const VERSION = '3.6.0-PATH-FIX';

// ============================================================================
// CONTAINER BOOTSTRAP
// ============================================================================

/**
 * Inicializa o container principal
 * @param {Object} state - Estado do inicializador
 * @returns {Object|null} primaryContainer
 */
export function bootstrapPrimaryContainer(state: MainState) {
  if (!state.containerPort) return null;
  incrementBootstraps();
  
  try {
    const primaryContainer = (state.containerPort as { getOrCreate(opts: Record<string, unknown>): Record<string, unknown> }).getOrCreate({
      id: 'primary',
      title: 'Principal',
      icon: '',
      variant: 'default',
      dockSpec: { region: 'main', slot: 'primary' },
      layoutPolicy: { mode: 'inherit' },
      collapsible: true,
      defaultCollapsed: false
    });
    
    // Mount to DOM if safe
    const rootEl = primaryContainer ? primaryContainer.rootEl as HTMLElement | null : null;
    if (primaryContainer && rootEl) {
      const mountInfo = getSafeMountPoint();

      if (mountInfo) {
        if (rootEl.parentNode) {
          // Already mounted - just ensure attributes
          if (rootEl.id !== 'container-main') {
            rootEl.id = 'container-main';
          }
          rootEl.setAttribute('data-container-main', 'true');
        } else if (mountInfo.mode !== 'existing') {
          // Not mounted yet - append (do NOT clear innerHTML)
          (mountInfo.element as HTMLElement).appendChild(rootEl);
          rootEl.id = 'container-main';
          rootEl.setAttribute('data-container-main', 'true');
        }
      }

      // Initialize controls
      _initializeControls(primaryContainer, state);
    }

    // Load panel-home or placeholder
    const contentEl = primaryContainer ? primaryContainer.contentEl as HTMLElement | null : null;
    if (contentEl && !contentEl.hasChildNodes()) {
      loadPanelHome(contentEl).then(success => {
        if (!success) {
          const placeholder = createPlaceholder();
          contentEl.appendChild(placeholder);
        }
      });
    }
    
    // Emit READY event
    if (state.eventBusAdapter && state.eventBusAdapter.emit) {
      state.eventBusAdapter.emit(CONTAINER_EVENTS.READY, { 
        id: 'primary', 
        source: MODULE_ID 
      });
    }
    
    return primaryContainer;
  } catch (error) {
    incrementErrors();
    if (state.eventBusAdapter && state.eventBusAdapter.emit) {
      state.eventBusAdapter.emit(CONTAINER_EVENTS.ERROR, { 
        id: 'primary', 
        error: (error as Error).message,
        source: MODULE_ID 
      });
    }
    return null;
  }
}

/**
 * Inicializa controls e enhancements no container
 * @param {Object} container
 * @param {Object} state
 */
function _initializeControls(container: Record<string, unknown>, state: MainState) {
  try {
    const controls = createControls(container.rootEl as HTMLElement, {
      collapsible: true,
      closable: false,
      fullscreenable: true,
      eventBus: state.eventBusAdapter
    });
    controls.init();
    container.controls = controls;
    
    const enhancements = createEnhancements(container.rootEl as HTMLElement, {
      scrollIndicator: true,
      validationShake: true,
      saveIndicator: false,
      connectionStatus: false
    });
    enhancements.init();
    container.enhancements = enhancements;
  } catch (initError) {
    console.debug('[initializer] Controls/Enhancements init failed:', (initError as Error).message);
  }
}

export default {
  bootstrapPrimaryContainer
};
