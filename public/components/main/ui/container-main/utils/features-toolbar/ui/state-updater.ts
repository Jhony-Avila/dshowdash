// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.0.0-SPRINT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-updater
// PURPOSE: Features Toolbar - State Updater
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../icons.js
//   validateStateProviderResult from ../constants.js
//   hasAction, getButtonState, getRegisteredStateProviders, getRegisteredActions,...
//
// PROVIDES:
//   _updateButtonStates() — exported function
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

import { ICONS } from '../icons.js';
import { validateStateProviderResult } from '../constants.js';
import {
  hasAction,
  getButtonState,
  getRegisteredStateProviders,
  getRegisteredActions,
  setIsFullscreen,
  setIsDarkTheme,
  getToolbarEl
} from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.features-toolbar.ui.state-updater';

// ============================================================================
// #13-F — SVG SANITIZER
// ============================================================================

const _DANGEROUS_PATTERN = /<\s*(script|iframe|object|embed|form|link|meta|base)\b/i;
const _EVENT_HANDLER_PATTERN = /\bon[a-z]+\s*=/i;

function _isSafeSvg(iconHtml: unknown) {
  if (typeof iconHtml !== 'string') return false;
  if (iconHtml.length === 0) return false;
  const trimmed = iconHtml.trim();
  if (trimmed.indexOf('<svg') !== 0 && trimmed.indexOf('<SVG') !== 0) return false;
  if (_DANGEROUS_PATTERN.test(iconHtml)) return false;
  if (_EVENT_HANDLER_PATTERN.test(iconHtml)) return false;
  return true;
}

// ============================================================================
// #29-J — ARIA-LABEL HELPER (preserva shortcut existente no data-shortcut)
// ============================================================================

function _updateAriaLabel(btn: HTMLButtonElement, tooltip: HTMLElement) {
  if (!btn || !tooltip) return;
  const shortcut = btn.getAttribute('data-shortcut');
  if (shortcut) {
    btn.setAttribute('aria-label', `${tooltip} (${shortcut})`);
  } else {
    // @ts-expect-error TS migration - TS2345
    btn.setAttribute('aria-label', tooltip);
  }
}

// ============================================================================
// MAIN UPDATER
// ============================================================================

export function _updateButtonStates() {
  _updateFullscreenState();
  _updateThemeState();
  _updateOfflineState();

  const toolbar = getToolbarEl() || document.getElementById('features-toolbar');
  if (!toolbar) return;

  const buttons = toolbar.querySelectorAll('.features-toolbar__btn');
  // @ts-expect-error strict migration — TS2345
  buttons.forEach((btn: HTMLButtonElement) => {
    const buttonId = btn.getAttribute('data-button-id');
    if (!buttonId) return;

    if (buttonId === 'fullscreen' || buttonId === 'theme' || buttonId === 'offline') return;

    const rawState = getButtonState(buttonId);
    const state = validateStateProviderResult((rawState as Record<string, unknown>));

    if (state) {
      btn.classList.remove('features-toolbar__btn--skeleton');

      if (typeof state.disabled === 'boolean') {
        btn.disabled = state.disabled;
      } else {
        btn.disabled = false;
      }

      if (typeof state.active === 'boolean') {
        btn.classList.toggle('features-toolbar__btn--active', state.active);
      }

      if (state.icon) {
        _setButtonIcon(btn, state.icon);
      }

      if (state.tooltip) {
        btn.setAttribute('data-tooltip', (state.tooltip as string));
        // #29-J: aria-label preserva shortcut
        _updateAriaLabel(btn, (state.tooltip as HTMLElement));
      }

      _updateBadge(btn, state.badge);
      _updateDot(btn, state.dot);
    } else {
      const wired = hasAction(buttonId);
      btn.disabled = !wired;
      btn.classList.toggle('features-toolbar__btn--skeleton', !wired);
      _updateBadge(btn, undefined);
      _updateDot(btn, undefined);
    }
  });
}

// ============================================================================
// #14: BADGE HELPERS
// ============================================================================

function _updateBadge(btn: HTMLButtonElement, value: unknown) {
  const badge = btn.querySelector('.features-toolbar__badge') as HTMLElement | null;
  if (!badge) return;

  if (value !== undefined && value !== null && value !== '' && value !== 0) {
    badge.textContent = String(value);
    badge.style.display = '';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

// ============================================================================
// #15: DOT-INDICATOR HELPERS
// ============================================================================

function _updateDot(btn: HTMLButtonElement, show: unknown) {
  const dot = btn.querySelector('.features-toolbar__dot') as HTMLElement | null;
  if (!dot) return;
  dot.style.display = show === true ? '' : 'none';
}

// ============================================================================
// BUTTON ICON HELPER — #13-F sanitized
// ============================================================================

function _setButtonIcon(btn: HTMLButtonElement, iconHtml: unknown) {
  if (!_isSafeSvg(iconHtml)) {
    // @ts-expect-error strict migration — TS2774
    if (typeof console !== 'undefined' && console.log) {
      console.debug('[features-toolbar] Rejected unsafe icon for button:', btn.getAttribute('data-button-id'));
    }
    return;
  }

  const badge = btn.querySelector('.features-toolbar__badge') as HTMLElement | null;
  const dot = btn.querySelector('.features-toolbar__dot') as HTMLElement | null;

  btn.innerHTML = (iconHtml) as string;

  if (badge) btn.appendChild(badge);
  if (dot) btn.appendChild(dot);
}

// ============================================================================
// NATIVE STATE UPDATERS — #29-J: aria-label com shortcut
// ============================================================================

function _updateFullscreenState() {
  const btn = document.getElementById('ft-btn-fullscreen');
  if (!btn) return;

  const isFs = !!document.fullscreenElement;
  setIsFullscreen(isFs);
  // @ts-expect-error TS migration - TS2345
  _setButtonIcon(btn, isFs ? ICONS.exitFullscreen : ICONS.fullscreen);
  const tooltip = isFs ? 'Sair Tela Cheia' : 'Tela Cheia';
  btn.setAttribute('data-tooltip', tooltip);
  // #29-J: preserva shortcut no aria-label
  // @ts-expect-error TS migration - TS2345
  _updateAriaLabel(btn, tooltip);
  const wired = hasAction('fullscreen');

  // @ts-expect-error TS migration - TS2339
  btn.disabled = !wired;
  btn.classList.toggle('features-toolbar__btn--skeleton', !wired);
}

function _updateThemeState() {
  const btn = document.getElementById('ft-btn-theme');
  if (!btn) return;

  const isDark = document.documentElement.classList.contains('theme-dark') ||
               !document.documentElement.classList.contains('theme-light');
  setIsDarkTheme(isDark);
  // @ts-expect-error TS migration - TS2345
  _setButtonIcon(btn, isDark ? ICONS.sun : ICONS.moon);
  const tooltip = isDark ? 'Tema Claro' : 'Tema Escuro';
  btn.setAttribute('data-tooltip', tooltip);
  // #29-J: preserva shortcut no aria-label
  // @ts-expect-error TS migration - TS2345
  _updateAriaLabel(btn, tooltip);
  const wired = hasAction('theme');

  // @ts-expect-error TS migration - TS2339
  btn.disabled = !wired;
  btn.classList.toggle('features-toolbar__btn--skeleton', !wired);
}

function _updateOfflineState() {
  const btn = document.getElementById('ft-btn-offline');
  if (!btn) return;

  const rawState = getButtonState('offline');
  const state = validateStateProviderResult((rawState as Record<string, unknown>));

  let isOffline = false;

  if (state && typeof state.active === 'boolean') {
    isOffline = state.active;
  } else {
    isOffline = !navigator.onLine;
  }

  // @ts-expect-error TS migration - TS2345
  _setButtonIcon(btn, isOffline ? ICONS.wifiOff : ICONS.wifi);
  const tooltip = isOffline ? 'Voltar Online' : 'Modo Offline';
  btn.setAttribute('data-tooltip', tooltip);
  // #29-J: preserva shortcut no aria-label
  // @ts-expect-error TS migration - TS2345
  _updateAriaLabel(btn, tooltip);
  (btn as any).classList.toggle('features-toolbar__btn--active', isOffline);
  const wired = hasAction('offline');

  // @ts-expect-error TS migration - TS2339
  btn.disabled = !wired;
  btn.classList.toggle('features-toolbar__btn--skeleton', !wired);

  // @ts-expect-error TS migration - TS2345
  _updateDot(btn, isOffline);

  if (state && state.tooltip) {
    btn.setAttribute('data-tooltip', String(state.tooltip));
    // @ts-expect-error TS migration - TS2345
    _updateAriaLabel(btn, String(state.tooltip));
  }

  if (state) {
    // @ts-expect-error TS migration - TS2345
    _updateBadge(btn, state.badge);
  }
}
