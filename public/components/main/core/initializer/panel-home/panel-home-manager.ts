// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.9.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-home-manager
// PURPOSE: Initializer - Panel Home Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_HOME_PATH from ../constants.js
//   createLogger from /assets/js/core/logger-global/index.js
//   getPanelHomeInstance, setPanelHomeInstance, clearPanelHomeInstance, increment...
//
// PROVIDES:
//   setLogLevel() — exported function
//   isPanelHomeMounted() — exported function
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
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.core.initializer.panel-home.panel-home-manager';

import { PANEL_HOME_PATH } from '../constants.js';
import { createLogger } from '/assets/js/core/logger-global/index.js';
import {
  getPanelHomeInstance,
  setPanelHomeInstance,
  clearPanelHomeInstance,
  incrementPanelHomeLoads,
  incrementPanelHomeErrors,
  isPanelHomeMounted as _isPanelHomeMounted
} from '../state.js';

const _logger = createLogger('initializer');

// ============================================================================
// INTERNAL LOGGING
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';
let _logLevel = 1;
const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };

function _log(level: LogLevel, msg: string, data?: unknown) {
  const levelNum = LOG_LEVELS[level] || 1;
  if (levelNum < _logLevel) return;

  const context = data !== undefined ? { data } : {};
  if (level === 'error') _logger.error(msg, context);
  else if (level === 'warn') _logger.warn(msg, context);
  else if (level === 'debug') _logger.debug(msg, context);
  else _logger.info(msg, context);
}

export function setLogLevel(level: string | number) {
  if (typeof level === 'string') _logLevel = LOG_LEVELS[level as LogLevel] !== undefined ? LOG_LEVELS[level as LogLevel] : 1;
  else if (typeof level === 'number') _logLevel = level;
  return _logLevel;
}

// ============================================================================
// PANEL HOME MANAGEMENT
// ============================================================================

/**
 * Carrega panel-home dinamicamente
 * @param {HTMLElement} contentEl
 * @returns {Promise<boolean>}
 */
export async function loadPanelHome(contentEl: HTMLElement) {
  try {
    incrementPanelHomeLoads();

    const panelHomeModule = await import(PANEL_HOME_PATH);
    const instance = await panelHomeModule.mount(contentEl, {});
    setPanelHomeInstance(instance);

    // weather-fx (b2): efeitos de clima ATRÁS do card. Isolado e tolerante a falha —
    // se o engine falhar, o painel continua intacto (PNR: não quebra o contrato).
    try {
      const wrapper = contentEl.querySelector('.ph-wrapper') as HTMLElement | null;
      if (wrapper) { const fx = await import('/components/panel-home/weather-fx/index.js'); fx.mount(wrapper); }
    } catch (fxErr: any) { _log('warn', 'weather-fx mount skipped:', fxErr && fxErr.message); }

    _log('debug', 'panel-home loaded successfully');
    return true;
  } catch (error: any) {
    incrementPanelHomeErrors();
    _log('warn', 'Failed to load panel-home, using fallback placeholder:', error.message);
    return false;
  }
}

/**
 * Desmonta panel-home
 * @returns {Promise<void>}
 */
export async function unmountPanelHome() {
  // weather-fx: teardown determinístico (cancelAnimationFrame + remove listeners + destroy efeitos)
  try {
    const fx = await import('/components/panel-home/weather-fx/index.js');
    fx.destroy();
  } catch (fxErr: any) { _log('warn', 'weather-fx destroy skipped:', fxErr && fxErr.message); }
  if (getPanelHomeInstance()) {
    try {
      const panelHomeModule = await import(PANEL_HOME_PATH);
      await panelHomeModule.unmount();
      clearPanelHomeInstance();

      _log('debug', 'panel-home unmounted');
    } catch (error: any) {
      _log('warn', 'Failed to unmount panel-home:', error.message);
    }
  }
}

/**
 * Verifica se panel-home está montado
 * @returns {boolean}
 */
export function isPanelHomeMounted() {
  return _isPanelHomeMounted();
}

export default {
  loadPanelHome,
  unmountPanelHome,
  isPanelHomeMounted,
  setLogLevel
};
