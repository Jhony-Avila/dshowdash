
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-FASE-C)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-home/domain/contextual-message/context-builder
// PURPOSE: Constrói o contexto para decisão de mensagem
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TIME_PERIODS, SYSTEM_STATES from ../../core/constants.js
//   CONFIG from ../../core/config.js
//   isStrict from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   buildContext() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Core
//   window.BootstrapV2
//   localStorage
//   sessionStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TIME_PERIODS, SYSTEM_STATES } from '../../core/constants.js';
import { CONFIG } from '../../core/config.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';

// ============================================================================
// RESOLUTION HELPERS (Core.windowAdapter only in strict mode)
// ============================================================================

export const MODULE_ID = 'panel-home/domain/contextual-message/context-builder';

/**
 * Resolve GlobalState via Core.windowAdapter
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object|null}
 */
function _getGlobalState() {
  if (typeof window === 'undefined') return null;

  // Primary: Core.windowAdapter (único canal — Fase C)
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const gs = window.Core.windowAdapter.get('GlobalState');
    if (gs) return gs;
  }

  return null;
}

/**
 * Resolve SessionManager via Core.windowAdapter
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object|null}
 */
function _getSessionManager() {
  if (typeof window === 'undefined') return null;

  // Primary: Core.windowAdapter (único canal — Fase C)
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const sm = window.Core.windowAdapter.get('SessionManager');
    if (sm) return sm;
  }

  return null;
}

// ============================================================================
// TIME HELPERS
// ============================================================================

/**
 * Determina o período do dia baseado na hora atual
 * @param {number} hour
 * @returns {string}
 */
function getTimePeriod(hour: number) {
  const periods = CONFIG.timePeriods;

  if (hour >= periods.morning.start && hour < periods.morning.end) {
    return TIME_PERIODS.MORNING;
  }
  if (hour >= periods.afternoon.start && hour < periods.afternoon.end) {
    return TIME_PERIODS.AFTERNOON;
  }
  if (hour >= periods.evening.start && hour < periods.evening.end) {
    return TIME_PERIODS.EVENING;
  }
  return TIME_PERIODS.NIGHT;
}

/**
 * Obtém o dia da semana
 * @param {Date} date
 * @returns {number} 0-6 (domingo-sábado)
 */
function getDayOfWeek(date: Date) {
  return date.getDay();
}

/**
 * Verifica se é início de semana (domingo ou segunda)
 * @param {number} dayOfWeek
 * @returns {boolean}
 */
function isStartOfWeek(dayOfWeek: number) {
  return dayOfWeek === 0 || dayOfWeek === 1;
}

/**
 * Verifica se é fim de semana
 * @param {number} dayOfWeek
 * @returns {boolean}
 */
function isWeekend(dayOfWeek: number) {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

// ============================================================================
// USER / SESSION INFO
// ============================================================================

/**
 * Obtém informações do usuário
 * @returns {Object}
 */
function getUserInfo() {
  const user: { id: string | null; name: string | null; role: string | null } = { id: null, name: null, role: null };

  // v1.1.0: Tenta obter do GlobalState via Core.windowAdapter primeiro
  const globalState = _getGlobalState();
  if (globalState && globalState.get) {
    try {
      const userData = globalState.get('user');
      if (userData) {
        user.id = userData.id || userData.userId || null;
        user.name = userData.name || userData.nome || userData.firstName || null;
        user.role = userData.role || userData.cargo || null;
      }
    } catch (e) {}
  }

  // Fallback: tenta SessionManager
  if (!user.id) {
    const sessionManager = _getSessionManager();
    if (sessionManager && sessionManager.getUser) {
      try {
        const sessionUser = sessionManager.getUser();
        if (sessionUser) {
          user.id = sessionUser.id || null;
          user.name = sessionUser.name || sessionUser.nome || null;
          user.role = sessionUser.role || null;
        }
      } catch (e) {}
    }
  }

  return user;
}

/**
 * Obtém informações da sessão
 * @returns {Object}
 */
function getSessionInfo() {
  const session = {
    isFirstAccess: false,
    isReturning: false,
    duration: 0,
    startTime: null as number | null
  };

  const sessionKey = 'ph_session_start';
  const lastVisitKey = 'ph_last_visit';

  if (typeof window === 'undefined' || !window.sessionStorage) {
    return session;
  }

  const now = Date.now();
  const sessionStart = sessionStorage.getItem(sessionKey);
  const lastVisit = localStorage.getItem(lastVisitKey);

  if (!sessionStart) {
    // Primeiro acesso desta sessão
    sessionStorage.setItem(sessionKey, now.toString());
    session.isFirstAccess = true;
    session.startTime = now;
  } else {
    session.startTime = parseInt(sessionStart, 10);
    session.duration = Math.floor((now - session.startTime) / 1000);
  }

  // Verifica se é usuário retornando
  if (lastVisit) {
    const lastVisitTime = parseInt(lastVisit, 10);
    const hoursSinceLastVisit = (now - lastVisitTime) / (1000 * 60 * 60);
    session.isReturning = hoursSinceLastVisit > 1 && hoursSinceLastVisit < 168; // Entre 1h e 7 dias
  }

  // Atualiza última visita
  localStorage.setItem(lastVisitKey, now.toString());

  return session;
}

// ============================================================================
// SYSTEM STATE
// ============================================================================

/**
 * Obtém estado do sistema
 * @returns {string}
 */
function getSystemState() {
  // Tenta obter do BootstrapV2
  if (typeof window !== 'undefined' && (window as any).BootstrapV2?.getState) {
    const state = (window as any).BootstrapV2.getState();
    if (state === 'ready' || state === 'complete') return SYSTEM_STATES.READY;
    if (state === 'loading' || state === 'booting') return SYSTEM_STATES.LOADING;
    if (state === 'error' || state === 'failed') return SYSTEM_STATES.ERROR;
  }

  // Fallback: verifica body data-state
  if (typeof document !== 'undefined') {
    const bodyState = document.body?.dataset?.state;
    if (bodyState === 'authenticated' || bodyState === 'ready') return SYSTEM_STATES.READY;
    if (bodyState === 'loading') return SYSTEM_STATES.LOADING;
    if (bodyState === 'error') return SYSTEM_STATES.ERROR;
  }

  return SYSTEM_STATES.READY;
}

/**
 * Obtém informações do ambiente
 * @returns {Object}
 */
function getEnvironmentInfo() {
  const env = {
    theme: 'dark',
    locale: 'pt-BR'
  };

  if (typeof document !== 'undefined') {
    env.theme = document.documentElement.dataset.theme || 'dark';
  }

  if (typeof navigator !== 'undefined') {
    env.locale = navigator.language || 'pt-BR';
  }

  return env;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Constrói o contexto completo para decisão de mensagem
 * @returns {Object} Context
 */
export function buildContext() {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = getDayOfWeek(now);

  return {
    user: getUserInfo(),
    time: {
      hour,
      dayOfWeek,
      period: getTimePeriod(hour),
      isStartOfWeek: isStartOfWeek(dayOfWeek),
      isWeekend: isWeekend(dayOfWeek),
      timestamp: now.toISOString()
    },
    session: getSessionInfo(),
    system: {
      state: getSystemState()
    },
    environment: getEnvironmentInfo()
  };
}

export default {
  buildContext,
  getTimePeriod,
  getUserInfo,
  getSessionInfo,
  getSystemState,
  getEnvironmentInfo
};
