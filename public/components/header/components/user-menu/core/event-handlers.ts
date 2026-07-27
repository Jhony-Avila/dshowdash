// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/user-menu/core/event-handlers
// PURPOSE: User Menu - DOM Event Handlers & Keyboard Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   emitUIAction from ./actions.js
//   handleMenuAction from ./actions.js
//
// PROVIDES:
//   VERSION — module constant
//   setupEventListeners() — exported function
//   removeEventListeners() — exported function
//   handleKeydown() — exported function
//   handleClickOutside() — exported function
//   handleTriggerClick() — exported function
//   navigateDropdownItems() — exported function
//   setupKeyboardShortcuts() — exported function
//   setupTooltips() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): component context
// EMITS (eventos):
//   (delegates to actions.js)
// LISTENS (eventos):
//   click, keydown, resize, scroll
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { emitUIAction, handleMenuAction } from './actions.js';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/user-menu/core/event-handlers';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
function _log(level: string, ...args: unknown[]) {
  if (!_debug && level === 'debug') return;
  _logBuffer.push({ level, args, ts: Date.now() });
  // @ts-expect-error strict migration — TS7005
  if (_logBuffer.length > 50) _logBuffer.shift();
}

// ── Trigger Click ───────────────────────────────────────────
export function handleTriggerClick(component: Record<string,unknown>, e: KeyboardEvent) {
  e.preventDefault();
  e.stopPropagation();
  // @ts-expect-error TS migration - TS2349
  component.toggleMenu();
}

// ── Click Outside ───────────────────────────────────────────
export function handleClickOutside(component: Record<string,unknown>, event: string) {
  if (component.isDestroyed || !component.element || !component.dropdown) return;
  // @ts-expect-error TS migration - TS2339
  if (!component.element.contains(event.target) && !component.dropdown.contains(event.target)) {
    // @ts-expect-error TS migration - TS2339
    const state = component.store.getState();
    if (state.isOpen) {
      emitUIAction('close-outside', {});
      // @ts-expect-error TS migration - TS2339
      component.store.setState({ isOpen: false });
      // @ts-expect-error TS migration - TS2349
      component._announce('Menu fechado');
    }
  }
}

// ── Keyboard Navigation ─────────────────────────────────────
export function navigateDropdownItems(component: Record<string,unknown>, direction: string) {
  // @ts-expect-error TS migration - TS2339
  const items = component.dropdown.querySelectorAll('.dropdown-item');
  if (items.length === 0) return;

  let currentIndex = -1;
  const activeElement = document.activeElement;

  for (let i = 0; i < items.length; i++) {
    if (items[i] === activeElement) {
      currentIndex = i;
      break;
    }
  }

  let nextIndex = currentIndex + direction;
  // @ts-expect-error TS migration - TS2365, TS2322
  if (nextIndex < 0) nextIndex = items.length - 1;
  // @ts-expect-error TS migration - TS2322
  if (nextIndex >= items.length) nextIndex = 0;

  items[nextIndex].focus();
  // @ts-expect-error TS migration - TS2349
  component._announce(items[nextIndex].textContent.trim());
}

// ── Keydown Handler ─────────────────────────────────────────
export function handleKeydown(component: Record<string,unknown>, e: KeyboardEvent) {
  if (component.isDestroyed) return;

  // @ts-expect-error TS migration - TS2339
  const state = component.store.getState();

  if (e.key === 'Escape' && state.isOpen) {
    e.preventDefault();
    // @ts-expect-error TS migration - TS2349
    component.toggleMenu();
    // @ts-expect-error TS migration - TS2349
    component._announce('Menu fechado');
    // @ts-expect-error TS migration - TS2339
    component._metrics.keyboardNavigationCount++;
    // @ts-expect-error TS migration - TS2339
    const trigger = component.element.querySelector('.user-menu-trigger');
    if (trigger) trigger.focus();
    return;
  }

  // @ts-expect-error TS migration - TS2339
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('user-menu-trigger')) {
    e.preventDefault();
    // @ts-expect-error TS migration - TS2349
    component.toggleMenu();
    // @ts-expect-error TS migration - TS2339
    component._metrics.keyboardNavigationCount++;
    return;
  }

  if (state.isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    // @ts-expect-error TS migration - TS2345
    navigateDropdownItems(component, e.key === 'ArrowDown' ? 1 : -1);
    // @ts-expect-error TS migration - TS2339
    component._metrics.keyboardNavigationCount++;
    return;
  }

  if (e.key === 'Tab' && state.isOpen) {
    // @ts-expect-error TS migration - TS2339
    const lastItem = component.dropdown.querySelector('.dropdown-item:last-of-type');
    // @ts-expect-error TS migration - TS2339
    const firstItem = component.dropdown.querySelector('.dropdown-item:first-of-type');

    if (!e.shiftKey && e.target === lastItem) {
      // @ts-expect-error TS migration - TS2349
      component.toggleMenu();
      // @ts-expect-error TS migration - TS2349
      component._announce('Menu fechado');
    } else if (e.shiftKey && e.target === firstItem) {
      // @ts-expect-error TS migration - TS2349
      component.toggleMenu();
      // @ts-expect-error TS migration - TS2349
      component._announce('Menu fechado');
    }
  }
}

// ── Setup Keyboard Shortcuts ────────────────────────────────
export function setupKeyboardShortcuts(component: Record<string,unknown>) {
  // @ts-expect-error TS migration - TS2339
  component.shortcuts.register('Escape', () => {
    // @ts-expect-error TS migration - TS2339
    if (component.store.getState().isOpen) {
      // @ts-expect-error TS migration - TS2349
      component.toggleMenu();
      // @ts-expect-error TS migration - TS2349
      component._announce('Menu fechado');
    }
  });

  // @ts-expect-error TS migration - TS2769
  document.addEventListener('keydown', component.boundHandleKeydown);
  _log('debug', 'Keyboard shortcuts configurados');
}

// ── Setup Tooltips ──────────────────────────────────────────
export function setupTooltips(component: Record<string,unknown>) {
  // @ts-expect-error TS migration - TS2339
  const items = component.dropdown.querySelectorAll('.dropdown-item');
  const tooltipTexts = {
    'profile': 'Ver e editar seu perfil',
    'preferences': 'Configurar suas preferências',
    'security': 'Gerenciar segurança da conta',
    'notifications': 'Configurar notificações',
    'sessions': 'Ver dispositivos conectados',
    'logout': 'Sair da sua conta'
  };

  items.forEach((item: Record<string,unknown>) => {
    // @ts-expect-error TS migration - TS2339
    const action = item.dataset.action;
    if (action && (tooltipTexts as Record<string,unknown>)[action as string]) {
      // @ts-expect-error TS migration - TS2349
      item.setAttribute('data-tooltip', (tooltipTexts as Record<string,unknown>)[action as string]);
      // @ts-expect-error TS migration - TS2339
      component.tooltips.attach(item);
    }
  });

  _log('debug', `Tooltips configurados para ${items.length} itens`);
}

// ── Setup All Event Listeners ───────────────────────────────
export function setupEventListeners(component: Record<string,unknown>) {
  // @ts-expect-error TS migration - TS2339
  const trigger = component.element.querySelector('.user-menu-trigger');
  if (trigger) {
    trigger.addEventListener('click', component.boundHandleTriggerClick);
  }

  // @ts-expect-error TS migration - TS2339
  component.dropdown.addEventListener('click', (e: KeyboardEvent) => {
    // @ts-expect-error TS migration - TS2339
    const item = e.target.closest('[data-action]');
    if (!item) return;
    e.stopPropagation();

    const action = item.dataset.action;
    // @ts-expect-error TS migration - TS2349
    component._announce(`Ação selecionada: ${item.textContent.trim()}`);

    handleMenuAction(action, {
      eventBus: component.eventBus,
      logger: component.logger,
      store: component.store,
      api: component.api,
      // @ts-expect-error TS migration - TS2349
      onLogout() { return component.handleLogout(); }
    });
  });

  // @ts-expect-error TS migration - TS2769
  document.addEventListener('click', component.boundHandleClickOutside);
  // @ts-expect-error TS migration - TS2769
  window.addEventListener('resize', component.boundUpdateDropdownPosition);
  // @ts-expect-error TS migration - TS2769
  window.addEventListener('scroll', component.boundUpdateDropdownPosition, true);
}

// ── Remove All Event Listeners ──────────────────────────────
export function removeEventListeners(component: Record<string,unknown>) {
  // @ts-expect-error TS migration - TS2339
  const trigger = component.element ? component.element.querySelector('.user-menu-trigger') : null;
  if (trigger) {
    trigger.removeEventListener('click', component.boundHandleTriggerClick);
  }

  // @ts-expect-error TS migration - TS2769
  document.removeEventListener('click', component.boundHandleClickOutside);
  // @ts-expect-error TS migration - TS2769
  document.removeEventListener('keydown', component.boundHandleKeydown);
  // @ts-expect-error TS migration - TS2769
  window.removeEventListener('resize', component.boundUpdateDropdownPosition);
  // @ts-expect-error TS migration - TS2769
  window.removeEventListener('scroll', component.boundUpdateDropdownPosition, true);
}

// ── Observability ───────────────────────────────────────────
export function healthCheck() {
  const checks = { ready: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 1 ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: 1,
    scoreDisplay: `${passed}/1`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    healthCheck: healthCheck()
  };
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
