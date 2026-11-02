// Bootstrap-V2 Loader - Post-Boot Stage
// @version 7.2.0-LOTTIE-TRANSITION
// @changelog v7.2.0-LOTTIE-TRANSITION - Added panel-loading-transition: Lottie animation during panel mounts
// @changelog v7.1.1-TIMEOUT-FIX - Fix: TIMEOUTS importado de boot-manifest/constants.js (não loader/constants.js)
// @changelog v7.1.0-TIMEOUT-FORMALIZED - Migração timeouts hardcoded → TIMEOUTS constantes formais
// @changelog v7.0.0-STEP8 - Etapa 8: Eliminados window.FeaturesToolbar/FeaturesIntegration (zero consumers).
//   _getEventBus() fix: removido window.Core.EventBus read (não mais atribuído no phase-0), usa _resolveGlobal.
// @changelog v6.6.0-TOOLBAR-FIX - Fix toolbar init: pass (containerEl, eventBus) separados
// @changelog v6.5.0-DOMAIN-PURE - _getEventBus/_resolveGlobal: windowAdapter → window fallback (cadeia AAA)
// @changelog v6.4.0-DOMAIN-PURE - Toolbar eventBus via _getEventBus() helper
// @changelog v6.3.0-TOOLBAR-WIRING - Integra toolbar-wiring.js após init
// @changelog v6.2.1 - Initial post-boot with toolbar, integration, ui-feedback
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v7.2.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES: bootResult from executeBootstrap()
// RESOLVES globals via _resolveGlobal():
//   1. windowAdapter.get(name)  — adapter layer
//   2. window[name]             — último fallback
// CREATES: None (v7.0.0 — zero window.* writes)
// TIMEOUTS: Uses TIMEOUTS from boot-manifest/constants.js (v7.1.1)
// INTEGRATES: panel-loading-transition (v7.2.0) — Lottie loading during panel mounts
//
// REMOVED in v7.0.0-STEP8:
//   window.FeaturesToolbar      — zero consumers (acesso via import)
//   window.FeaturesIntegration  — zero consumers (acesso via import)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { hasWindow } from '../constants.js';
import { TIMEOUTS } from '../../boot-manifest/constants.js';
import { log } from '../helpers/logger.js';
import * as OpenTelemetryAdapter from '../../adapters/OpenTelemetryAdapter.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.loader.stages.post-boot';

function _resolveGlobal(name: string) {
  if (!hasWindow) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var resolved = window.Core.windowAdapter.get(name);
    if (resolved) return resolved;
  }
  return (window as unknown as Record<string, unknown>)[name] || null;
}

function _getEventBus() {
  if (!hasWindow) return null;
  var eb = _resolveGlobal('EventBus');
  if (eb) return eb;
  var dshow = _resolveGlobal('DShowDash');
  if (dshow && dshow.eventBus) return dshow.eventBus;
  return null;
}

interface BootResult {
  success: boolean;
  totalTime: number;
  health?: {
    status: string;
    score: number;
  };
  [key: string]: unknown;
}

export function executePostBoot(bootResult: BootResult) {
  log('info', 'Post-Boot: Loading UI Feedback, Features Toolbar, Integration & Panel Loading Transition');

  if (bootResult.success) {
    OpenTelemetryAdapter.recordBootComplete(
      bootResult.totalTime,
      bootResult.success,
      bootResult.health ? bootResult.health.status : 'UNKNOWN',
      bootResult.health ? bootResult.health.score : 0
    );
  }

  var uiFeedbackPromise = import('/components/_shared/permissions/ui-feedback.js').then(function(UIFeedbackModule) {
    if (UIFeedbackModule.default) {
      UIFeedbackModule.default.init({ debug: false });
    }
  }).catch(function(error) {
    log('info', 'UIFeedback failed (non-critical)', { error: error.message });
  });

  var toolbarPromise = import('/components/main/ui/container-main/utils/features-toolbar/index.js').then(function(FeaturesToolbar) {
    var attempts = 0;
    var maxAttempts = 20;

    function tryInit() {
      var containerMain = _resolveGlobal('ContainerMain');
      var containerEl = document.getElementById('container-main');

      if (containerMain && containerEl) {
        FeaturesToolbar.init(containerEl, _getEventBus());
        log('info', 'Features Toolbar initialized', { version: FeaturesToolbar.VERSION });

        import('/components/main/ui/container-main/utils/toolbar-wiring.js').then(function(wiringModule) {
          wiringModule.wireToolbar(FeaturesToolbar as unknown as Record<string, (...args: unknown[]) => unknown>).then(function(wiringResult) {
            log('info', 'Toolbar wiring complete', {
              wired: wiringResult.wired ? wiringResult.wired.length : 0,
              failed: wiringResult.failed ? wiringResult.failed.length : 0,
              buttons: wiringResult.wired || []
            });
            if (FeaturesToolbar.updateButtonStates) {
              setTimeout(function() { FeaturesToolbar.updateButtonStates(); }, TIMEOUTS.UI_DELAY_SHORT);
            }
          }).catch(function(wireError) {
            log('info', 'Toolbar wiring failed (non-critical)', { error: wireError.message });
          });
        }).catch(function(importError) {
          log('info', 'Toolbar wiring module not found (non-critical)', { error: importError.message });
        });

        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryInit, TIMEOUTS.UI_DELAY_MEDIUM);
      } else {
        log('info', 'Features Toolbar skipped (container not found after timeout)');
      }
    }

    setTimeout(tryInit, TIMEOUTS.UI_DELAY_LONG);
  }).catch(function(error) {
    log('info', 'Features Toolbar failed (non-critical)', { error: error.message });
  });

  var integrationPromise = import('/components/main/ui/container-main/utils/features-integration/index.js').then(function(FeaturesIntegration) {
    var attempts = 0;
    var maxAttempts = 30;

    function tryInit() {
      var containerMain = _resolveGlobal('ContainerMain');
      if (containerMain && document.getElementById('container-main')) {
        var result = (FeaturesIntegration as any).init();
        if (result.ok) {
          log('info', 'Features Integration initialized', { version: FeaturesIntegration.VERSION });
        }
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryInit, TIMEOUTS.UI_DELAY_RETRY);
      } else {
        log('info', 'Features Integration skipped (ContainerMain not found after timeout)');
      }
    }

    setTimeout(tryInit, TIMEOUTS.UI_DELAY_INIT);
  }).catch(function(error) {
    log('info', 'Features Integration failed (non-critical)', { error: error.message });
  });

  // v7.2.0: Panel Loading Transition — Lottie animation during panel mounts
  var transitionPromise = import('./panel-loading-transition.js').then(function(PanelTransition) {
    var eventBus = _getEventBus();
    if (eventBus) {
      var result = PanelTransition.init(eventBus);
      if (result.ok) {
        log('info', 'Panel Loading Transition initialized', { version: PanelTransition.VERSION });
      } else {
        log('info', 'Panel Loading Transition skipped', { reason: result.reason });
      }
    } else {
      log('info', 'Panel Loading Transition skipped (no EventBus)');
    }
  }).catch(function(error) {
    log('info', 'Panel Loading Transition failed (non-critical)', { error: error.message });
  });

  return Promise.all([uiFeedbackPromise, toolbarPromise, integrationPromise, transitionPromise]).then(function() {
    return bootResult;
  });
}
