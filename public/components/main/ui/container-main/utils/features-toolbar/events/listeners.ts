
// Features Toolbar - Event Listeners
// @version 8.0.0-EVENT-CONSTANTS-ES6
// @changelog v8.0.0-EVENT-CONSTANTS - Migrate toolbar.rewired/initialized/recovered to TOOLBAR_EVENT_NAMES constants
// @changelog v7.0.0-SPRINT-I - #26 containerObserver subtree:false + rAF debounce
// @changelog v6.0.0-SPRINT-H - #20 Rewire re-executa wireToolbar() apos detectar perda de actions
// @changelog v5.0.0-SPRINT-F - #2 resetRewireState() export para idempotência no destroy
// @changelog v4.0.0-SPRINT-E - #8 Re-wire automático: detecta perda de actions e re-emite toolbar.initialized
// @changelog v3.1.0-NO-STACKTRACE - Migrate console.warn to console.log in guard recovery catch block
// @changelog v3.0.0-SPRINT-B - #7 MutationObserver guard (re-attach se toolbar removida), #1 online/offline events
// @changelog v2.0.0-ACTION-REGISTRY - Version alignment (conteúdo já estava desacoplado)
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: getEventBus, getToolbarEl, getContainer, setCurrentPanelId, addCleanup,
//          snapshotActions, detectActionLoss, getRegisteredActions from ../state.js
//          _updateButtonStates from ../ui/state-updater.js
//          TOOLBAR_EVENT_NAMES from event-names.js
// PROVIDES: _setupEventListeners(), resetRewireState()
// BROWSER-APIS: document.addEventListener, window.addEventListener, MutationObserver,
//               setInterval, clearInterval, requestAnimationFrame
'use strict';

import {
  getEventBus, getToolbarEl, getContainer,
  setCurrentPanelId, addCleanup,
  snapshotActions, detectActionLoss,
  getRegisteredActions
} from '../state.js';
import { _updateButtonStates } from '../ui/state-updater.js';
import { TOOLBAR_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.features-toolbar.events.listeners';

// #8: Re-wire check interval (10s)
const REWIRE_CHECK_INTERVAL_MS = 10000;
let _rewireIntervalId: ReturnType<typeof setInterval> | null = null;
// #8: Cooldown para evitar re-emitir toolbar.initialized repetidamente
let _lastRewireEmit = 0;
const REWIRE_COOLDOWN_MS = 30000;
// #20-H: Flag para evitar rewire concorrente
let _rewireInProgress = false;

/**
 * #2-F: Reseta estado de re-wire (chamado pelo destroy para idempotência)
 */
export function resetRewireState() {
  if (_rewireIntervalId !== null) {
    clearInterval(_rewireIntervalId);
    _rewireIntervalId = null;
  }
  _lastRewireEmit = 0;
  _rewireInProgress = false;
}

export function _setupEventListeners() {
  const eventBus = getEventBus();
  if (!eventBus) return;

  // --- Navegação ---
  const navHandler = (data: Record<string, unknown>) => {
    // @ts-expect-error TS migration - TS2339
    setCurrentPanelId((data as unknown as string)?.panelId || data?.to || null);
    _updateButtonStates();
  };

  // @ts-expect-error TS migration - TS2349
  eventBus.on?.('main.navigation.sync', navHandler);
  // @ts-expect-error TS migration - TS2349
  eventBus.on?.('nav.navigate.success', navHandler);
  // @ts-expect-error TS migration - TS2349
  eventBus.on?.('nav.navigate.path', navHandler);
  addCleanup(() => {
    // @ts-expect-error TS migration - TS2349
    eventBus.off?.('main.navigation.sync', navHandler);
    // @ts-expect-error TS migration - TS2349
    eventBus.off?.('nav.navigate.success', navHandler);
    // @ts-expect-error TS migration - TS2349
    eventBus.off?.('nav.navigate.path', navHandler);
  });

  // --- Fullscreen ---
  const fullscreenHandler = () => { _updateButtonStates(); };
  document.addEventListener('fullscreenchange', fullscreenHandler);
  addCleanup(() => { document.removeEventListener('fullscreenchange', fullscreenHandler); });

  // --- Tema (MutationObserver no :root) ---
  const themeObserver = new MutationObserver(() => { _updateButtonStates(); });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  addCleanup(() => { themeObserver.disconnect(); });

  // ========================================================================
  // #1: Online/Offline events
  // ========================================================================
  const onlineHandler = () => { _updateButtonStates(); };
  const offlineHandler = () => { _updateButtonStates(); };
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  addCleanup(() => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  });

  // ========================================================================
  // #7: Guard contra innerHTML destrutivo
  // ========================================================================
  _setupToolbarGuard();

  // ========================================================================
  // #8 + #20-H: Re-wire automático com reconexão real
  // ========================================================================
  _setupRewireMonitor();
}

/**
 * #8 + #20-H: Monitor periódico de re-wire.
 * A cada 10s compara actions atuais com snapshot anterior.
 * Se detecta perda, tenta import dinamico de wireToolbar() para reconectar.
 * Se import falhar, emite toolbar.initialized como fallback.
 * Cooldown de 30s, flag _rewireInProgress evita concorrencia.
 */
function _setupRewireMonitor() {
  snapshotActions();

  _rewireIntervalId = setInterval(() => {
    const detection = detectActionLoss();

    if (detection.hadActions && detection.lost.length > 0) {
      const now = Date.now();
      if (now - _lastRewireEmit < REWIRE_COOLDOWN_MS) {
        snapshotActions();
        return;
      }
      if (_rewireInProgress) return;

      _lastRewireEmit = now;
      _rewireInProgress = true;

      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[features-toolbar] Re-wire detected: lost actions:', detection.lost.join(', '));
      }

      // #20-H: Tentar reconexão real via wireToolbar()
      _attemptRewire(detection).finally(() => {
        _rewireInProgress = false;
        _updateButtonStates();
        snapshotActions();
      });
    } else {
      snapshotActions();
    }
  }, REWIRE_CHECK_INTERVAL_MS);

  addCleanup(() => {
    if (_rewireIntervalId !== null) {
      clearInterval(_rewireIntervalId);
      _rewireIntervalId = null;
    }
  });
}

/**
 * #20-H: Tenta import dinamico de toolbar-wiring e re-executa wireToolbar().
 * Se falhar, emite toolbar.initialized como fallback para managers re-registrarem.
 */
function _attemptRewire(detection: Record<string, unknown>) {
  return import('../../toolbar-wiring.js').then(wiringModule => {
    const wireFn = wiringModule.wireToolbar || (wiringModule.default && wiringModule.default.wireToolbar);
    if (!wireFn) {
      throw new Error('wireToolbar not found in module');
    }

    // Construir objeto toolbar-like a partir da API publica
    let toolbarApi = null;
    try {
      const apiModule = (window as any).__featuresToolbarApi__;
      if (apiModule && apiModule.registerAction) {
        toolbarApi = apiModule;
      }
    } catch (_e) {}

    if (!toolbarApi) {
      throw new Error('Toolbar API not available for rewire');
    }

    return wireFn(toolbarApi).then(result => {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[features-toolbar] Re-wire success:', result.wired.length, 'actions reconnected');
      }

      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        (eventBus.emit as (...args: unknown[]) => unknown)(TOOLBAR_EVENT_NAMES.REWIRED, {
          source: 'features-toolbar',
          reason: 'action-loss-recovery',
          lostActions: detection.lost,
          rewiredActions: result.wired,
          failedActions: result.failed,
          timestamp: Date.now()
        });
      }
    });
  }).catch(err => {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[features-toolbar] Re-wire via wireToolbar failed, emitting fallback:', err.message);
    }

    // Fallback: emitir toolbar.initialized para managers re-registrarem
    const eventBus = getEventBus();
    if (eventBus && eventBus.emit) {
      const toolbarEl = getToolbarEl();
      const buttonCount = toolbarEl ? toolbarEl.querySelectorAll('.features-toolbar__btn').length : 0;
      (eventBus.emit as (...args: unknown[]) => unknown)(TOOLBAR_EVENT_NAMES.INITIALIZED, {
        source: 'features-toolbar',
        reason: 'rewire-action-loss',
        lostActions: detection.lost,
        currentActions: detection.current,
        buttonCount,
        timestamp: Date.now()
      });
    }
  });
}

/**
 * #7: MutationObserver que monitora o parent da toolbar.
 * Se a toolbar desaparecer do DOM, tenta re-inserir a referência existente.
 *
 * #26-I: containerObserver agora usa subtree:false + rAF debounce.
 * Antes: subtree:true observava TODAS as mutações dentro do container inteiro,
 * gerando milhares de callbacks em operações de renderização pesada.
 * Agora: observa apenas childList direto do container, com debounce via rAF.
 */
function _setupToolbarGuard() {
  const toolbarEl = getToolbarEl();
  const container = getContainer();
  if (!toolbarEl || !container) return;

  const header = container.querySelector('.dsd-container__header');
  if (!header) return;

  let _isRecovering = false;

  // --- Header guard (observa filhos diretos do header) ---
  const guardObserver = new MutationObserver(() => {
    if (_isRecovering) return;

    if (!document.contains(toolbarEl)) {
      _isRecovering = true;

      try {
        const controls = header.querySelector('.dsd-container__controls');
        if (controls) {
          header.insertBefore(toolbarEl, controls);
        } else if (header.parentNode) {
          header.appendChild(toolbarEl);
        }

        _updateButtonStates();

        const eventBus = getEventBus();
        if (eventBus && eventBus.emit) {
          (eventBus.emit as (...args: unknown[]) => unknown)(TOOLBAR_EVENT_NAMES.RECOVERED, {
            source: 'features-toolbar',
            reason: 'dom-removal-detected',
            timestamp: Date.now()
          });
        }
      } catch (e) {
        if (typeof console !== 'undefined' && console.debug) {
          console.debug('[features-toolbar] Guard recovery failed:', (e as Error).message);
        }
      }

      setTimeout(() => { _isRecovering = false; }, 100);
    }
  });

  guardObserver.observe(header, { childList: true, subtree: false });

  // ========================================================================
  // #26-I: Container observer — subtree:false + rAF debounce
  // Observa apenas filhos diretos do container (ex: header sendo substituído).
  // rAF debounce agrupa múltiplas mutações em um único check por frame.
  // ========================================================================
  let _containerRafId: unknown = null;

  const containerObserver = new MutationObserver(() => {
    if (_isRecovering) return;

    // #26-I: Debounce via requestAnimationFrame — no máximo 1 check por frame
    if (_containerRafId !== null) return;
    _containerRafId = requestAnimationFrame(() => {
      _containerRafId = null;

      if (_isRecovering) return;
      const currentHeader = container.querySelector('.dsd-container__header');
      if (currentHeader && !currentHeader.contains(toolbarEl)) {
        _isRecovering = true;
        try {
          const controls = currentHeader.querySelector('.dsd-container__controls');
          if (controls) {
            currentHeader.insertBefore(toolbarEl, controls);
          } else {
            currentHeader.appendChild(toolbarEl);
          }
          _updateButtonStates();
        } catch (e) {
          if (typeof console !== 'undefined' && console.debug) {
            console.debug('[features-toolbar] Container guard recovery failed:', (e as Error).message);
          }
        }
        setTimeout(() => { _isRecovering = false; }, 100);
      }
    });
  });

  // #26-I: subtree:false — observa apenas filhos diretos do container
  containerObserver.observe(container, { childList: true, subtree: false });

  addCleanup(() => {
    guardObserver.disconnect();
    containerObserver.disconnect();
    if (_containerRafId !== null) {
      cancelAnimationFrame((_containerRafId as number));
      _containerRafId = null;
    }
  });
}
