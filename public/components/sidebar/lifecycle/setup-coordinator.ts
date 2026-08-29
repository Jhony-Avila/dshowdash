// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: setup-coordinator
// PURPOSE: Sidebar Setup Coordinator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   syncInitialCollapsedState from ../core/state-sync.js
//   setupLayoutListener from ../core/layout-listener.js
//   setupKeyboardNavigation, setupGlobalShortcut from ../features/keyboard-navigation.js
//   setupMobileDetect, setupOverlayClick from ../features/mobile-handler.js
//   setupRouterSync from ../features/router-sync.js
//   setupAllEvents from ../features/event-setup.js
//
// PROVIDES:
//   createSetupCoordinator() — exported function
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

import { syncInitialCollapsedState } from '../core/state-sync.js';
import { setupLayoutListener } from '../core/layout-listener.js';
import { setupKeyboardNavigation, setupGlobalShortcut } from '../features/keyboard-navigation.js';
import { setupMobileDetect, setupOverlayClick } from '../features/mobile-handler.js';
import { setupRouterSync } from '../features/router-sync.js';
import { setupAllEvents } from '../features/event-setup.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.lifecycle.setup-coordinator';

// Track D onda 3 (#D-m22 — ISOLAMENTO flag OFF): o fix de wiring do #D-m15 SÓ vale
// no modo mobile AUTORIZADO (as6.mobile_shell ON). Com a flag OFF, o caminho legado
// da sidebar (faixa 501–767) permanece BYTE A BYTE como antes da onda 2. Leitura
// síncrona e fail-closed (default OFF) — sem acoplar ao runtime de flags.
function _mobileShellAutorizado(): boolean {
  try {
    const g = (globalThis as Record<string, unknown>);
    const snap = (g.__DSHOW_FLAGS__ || (g.DshowFlags as Record<string, unknown> | undefined)?.snapshot) as Record<string, unknown> | undefined;
    if (snap && typeof snap === 'object' && 'as6.mobile_shell' in snap) return snap['as6.mobile_shell'] === true;
    if (typeof localStorage !== 'undefined') {
      const local = JSON.parse(localStorage.getItem('dshow.shell.flags.v1') || '{}') as Record<string, unknown>;
      if ('as6.mobile_shell' in local) return local['as6.mobile_shell'] === true;
    }
  } catch { /* fail-closed */ }
  return false;
}

export function createSetupCoordinator(options: DynObj) {
  if (options === undefined) options = {};
  
  const logger = options.logger;
  const tracker = options.tracker;
  const getPort = options.getPort;
  const emitDegraded = options.emitDegraded;

  let _layoutListener: (() => void) | null = null;
  let _cleanups: (() => void)[] = [];

  return {
    setupCore(deps: DynObj) {
      const engine = deps.engine;
      const renderer = deps.renderer;
      const registry = deps.registry;
      const adapters = deps.adapters;
      const onToggle = deps.onToggle;
      const onSetActiveItem = deps.onSetActiveItem;
      const onToggleSection = deps.onToggleSection;

      try {
        syncInitialCollapsedState({
          engine,
          renderer,
          logger,
          getPort
        });
      } catch (error: any) {
        emitDegraded('restore-state', error.message);
      }

      try {
        _layoutListener = setupLayoutListener({
          engine,
          renderer,
          tracker,
          logger,
          getPort
        }) as DynObj;
        if (_layoutListener && (_layoutListener as DynObj).cleanup) {
          _cleanups.push((_layoutListener as DynObj).cleanup);
        }
      } catch (error: any) {
        emitDegraded('layout-listener', error.message);
      }

      try {
        const sidebar = renderer.getSidebar();
        if (sidebar) {
          setupAllEvents(sidebar, {
            registry,
            routerAdapter: adapters.router,
            engine,
            renderer,
            onToggle,
            onSetActiveItem,
            onToggleSection
          });
        }
      } catch (error: any) {
        emitDegraded('setup-events', error.message);
      }
    },

    setupPostReady(deps: DynObj) {
      const engine = deps.engine;
      const renderer = deps.renderer;
      const registry = deps.registry;
      const adapters = deps.adapters;
      const onToggle = deps.onToggle;
      const onSetActiveItem = deps.onSetActiveItem;
      const onExpandSection = deps.onExpandSection;
      const onCollapseSection = deps.onCollapseSection;
      const onCloseMobile = deps.onCloseMobile;
      const onReloadNavigation = deps.onReloadNavigation;

      const sidebar = renderer.getSidebar();

      try {
        if (sidebar) {
          const cleanup1 = (setupKeyboardNavigation as any)(sidebar, {
            onExpandSection,
            onCollapseSection
          });
          _cleanups.push(cleanup1);

          const cleanup2 = setupGlobalShortcut(onToggle);
          _cleanups.push(cleanup2);
        }
      } catch (error: any) {
        emitDegraded('keyboard-nav', error.message);
      }

      try {
        // #D-m15 fix de WIRING (shape correto) — mas SÓ no modo mobile autorizado
        // (#D-m22). Com a flag OFF, mantém EXATAMENTE as chamadas legadas (mesmo
        // com o bug histórico) → caminho flag-OFF byte a byte com a baseline A.
        if (_mobileShellAutorizado()) {
          // caminho ON (corrigido): setupMobileDetect recebia {onMobileChange,
          // onCloseMobile} (o handler só lê {container,eventBus,breakpoint} →
          // callbacks IGNORADOS); setupOverlayClick recebia a FUNÇÃO onCloseMobile
          // (handler desestrutura {container,onClose} → onClose undefined → backdrop
          // escondia mas o engine NUNCA fechava). Agora com o shape certo:
          const cleanup3 = setupMobileDetect({
            container: sidebar,
            breakpoint: 768,
            onMobileChange(isMobile: boolean) { engine.setMobile(isMobile); }
          });
          _cleanups.push(cleanup3);
          const cleanup4 = setupOverlayClick({ container: sidebar, onClose: onCloseMobile });
          _cleanups.push((cleanup4 as DynObj));
        } else {
          // caminho OFF (legado APROVADO, byte a byte com a baseline A): na A o
          // handler NÃO lia onMobileChange (o callback era ignorado → engine.setMobile
          // nunca era chamado por aqui). Como o handler agora LÊ onMobileChange, o
          // caminho OFF OMITE onMobileChange → guarda `typeof===function` falha →
          // engine.setMobile NÃO é chamado = comportamento idêntico à A. setupOverlayClick
          // recebe a função crua (onClose undefined), reproduzindo a A exatamente.
          const cleanup3 = setupMobileDetect({ onCloseMobile });
          _cleanups.push(cleanup3);
          const cleanup4 = setupOverlayClick(onCloseMobile);
          _cleanups.push((cleanup4 as DynObj));
        }
      } catch (error: any) {
        emitDegraded('mobile-detect', error.message);
      }

      try {
        const cleanup5 = setupRouterSync({
          routerAdapter: adapters.router,
          registry,
          onSetActiveItem,
          onReloadNavigation
        });
        _cleanups.push(cleanup5);
      } catch (error: any) {
        emitDegraded('sync-router', error.message);
      }
    },

    getLayoutListener() {
      return _layoutListener;
    },

    getCleanups() {
      return _cleanups.slice();
    },

    addCleanup(fn: DynObj) {
      _cleanups.push(fn);
    },

    cleanup() {
      if (_layoutListener && (_layoutListener as DynObj).cleanup) {
        (_layoutListener as DynObj).cleanup();
        _layoutListener = null;
      }
      _cleanups.forEach(fn => {
        try { fn(); } catch (e) {}
      });
      _cleanups = [];
    }
  };
}

export default { createSetupCoordinator };
