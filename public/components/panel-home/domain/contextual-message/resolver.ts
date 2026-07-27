
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Contextual Message - Resolver
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MESSAGE_CATEGORIES from ../../core/constants.js
//   CONFIG from ../../core/config.js
//   buildContext from ./context-builder.js
//   parsePlaceholders from ./placeholder-parser.js
//
// PROVIDES:
//   resolve() — exported function
//   resolveFallback() — exported function
//   clearHistory() — exported function
//   getStats() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MESSAGE_CATEGORIES } from '../../core/constants.js';
import { CONFIG } from '../../core/config.js';
import { buildContext } from './context-builder.js';
import { parsePlaceholders } from './placeholder-parser.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-home.domain.contextual-message.resolver';

interface ContextualMessage {
  id: string;
  category: string;
  text?: string;
  message?: string;
  subtitle?: string;
  key?: string;
  priority?: number;
  active?: boolean;
  system_state?: string;
  start_time?: string | null;
  end_time?: string | null;
  days_of_week?: number[];
  min_session_time?: number | null;
  max_session_time?: number | null;
  requires_user_name?: boolean;
  [key: string]: unknown;
}

interface MessageContext {
  user: { id: string | null; name: string | null; role: string | null };
  time: { hour: number; dayOfWeek: number; period: string; isStartOfWeek: boolean; isWeekend: boolean; timestamp: string };
  session: { isFirstAccess: boolean; isReturning: boolean; duration: number; startTime: number | null };
  system: { state: string };
  environment?: { theme: string; locale: string };
}

/**
 * Cache de mensagens para evitar repetição
 */
const _messageHistory: {
  lastMessageId: string | null;
  lastCategory: string | null;
  displayCount: Record<string, number>;
  sessionMessages: Array<{ id: string; category: string; timestamp: number }>;
} = {
  lastMessageId: null,
  lastCategory: null,
  displayCount: {},
  sessionMessages: []
};

/**
 * Filtra mensagens por estado do sistema
 * @param {Array} messages 
 * @param {string} systemState 
 * @returns {Array}
 */
function filterBySystemState(messages: ContextualMessage[], systemState: string) {
  return messages.filter((msg: ContextualMessage) => {
    // Se mensagem não especifica estado, aceita qualquer um
    if (!msg.system_state) return true;
    // Se especifica, deve corresponder
    return msg.system_state === systemState;
  });
}

/**
 * Filtra mensagens por período temporal
 * @param {Array} messages 
 * @param {Object} timeContext 
 * @returns {Array}
 */
function filterByTime(messages: ContextualMessage[], timeContext: MessageContext['time']) {
  const { hour, dayOfWeek } = timeContext;

  return messages.filter((msg: ContextualMessage) => {
    // Verifica horário
    if (msg.start_time !== null && msg.end_time !== null) {
      // @ts-expect-error strict migration — TS2345
      const startHour = parseInt(msg.start_time, 10);
      // @ts-expect-error strict migration — TS2345
      const endHour = parseInt(msg.end_time, 10);
      
      if (startHour <= endHour) {
        if (hour < startHour || hour >= endHour) return false;
      } else {
        // Período que cruza meia-noite
        if (hour < startHour && hour >= endHour) return false;
      }
    }
    
    // Verifica dia da semana
    if (msg.days_of_week && msg.days_of_week.length > 0) {
      if (!msg.days_of_week.includes(dayOfWeek)) return false;
    }
    
    return true;
  });
}

/**
 * Filtra mensagens por contexto de sessão
 * @param {Array} messages 
 * @param {Object} sessionContext 
 * @returns {Array}
 */
function filterBySession(messages: ContextualMessage[], sessionContext: MessageContext['session']) {
  const { duration, isFirstAccess } = sessionContext;

  return messages.filter((msg: ContextualMessage) => {
    // Verifica tempo mínimo de sessão
    // @ts-expect-error strict migration — TS18048
    if (msg.min_session_time !== null && duration < msg.min_session_time) {
      return false;
    }
    
    // Verifica tempo máximo de sessão
    // @ts-expect-error strict migration — TS18048
    if (msg.max_session_time !== null && duration > msg.max_session_time) {
      return false;
    }
    
    return true;
  });
}

/**
 * Filtra mensagens que requerem nome do usuário
 * @param {Array} messages 
 * @param {Object} userContext 
 * @returns {Array}
 */
function filterByUserRequirements(messages: ContextualMessage[], userContext: MessageContext['user']) {
  return messages.filter((msg: ContextualMessage) => {
    // Se requer nome e não tem, exclui
    if (msg.requires_user_name && !userContext.name) {
      return false;
    }
    return true;
  });
}

/**
 * Evita repetição de mensagens
 * @param {Array} messages 
 * @returns {Array}
 */
function filterByRepetition(messages: ContextualMessage[]) {
  return messages.filter((msg: ContextualMessage) => {
    // Não repetir a última mensagem exibida
    if (msg.id === _messageHistory.lastMessageId) {
      return false;
    }
    
    // Evitar mesma categoria consecutivamente (com exceções)
    if (msg.category === _messageHistory.lastCategory) {
      // Permitir temporal e acolhimento consecutivos
      if (msg.category !== MESSAGE_CATEGORIES.TEMPORAL && 
          msg.category !== MESSAGE_CATEGORIES.ACOLHIMENTO) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Ordena mensagens por prioridade e relevância
 * @param {Array} messages 
 * @param {Object} context 
 * @returns {Array}
 */
function sortByRelevance(messages: ContextualMessage[], context: MessageContext) {
  const weights = CONFIG.weights;
  
  return [...messages].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    // Prioridade base
    scoreA += (a.priority || 50) * (weights.category / 100);
    scoreB += (b.priority || 50) * (weights.category / 100);
    
    // Boost para mensagens temporais no período correto
    if (a.category === MESSAGE_CATEGORIES.TEMPORAL) {
      scoreA += weights.temporal;
    }
    if (b.category === MESSAGE_CATEGORIES.TEMPORAL) {
      scoreB += weights.temporal;
    }
    
    // Boost para acolhimento em primeiro acesso
    if (context.session.isFirstAccess) {
      if (a.category === MESSAGE_CATEGORIES.ACOLHIMENTO) scoreA += 30;
      if (b.category === MESSAGE_CATEGORIES.ACOLHIMENTO) scoreB += 30;
    }
    
    // Boost para usuário retornando
    if (context.session.isReturning) {
      if (a.category === MESSAGE_CATEGORIES.CONTEXTO) scoreA += 25;
      if (b.category === MESSAGE_CATEGORIES.CONTEXTO) scoreB += 25;
    }
    
    // Variação aleatória para evitar previsibilidade
    scoreA += Math.random() * weights.variation;
    scoreB += Math.random() * weights.variation;
    
    return scoreB - scoreA;
  });
}

/**
 * Seleciona a melhor mensagem com base nas regras
 * @param {Array} candidates 
 * @param {Object} context 
 * @returns {Object|null}
 */
function selectBestMessage(candidates: ContextualMessage[], context: MessageContext) {
  if (!candidates || candidates.length === 0) {
    return null;
  }
  
  // Aplica todos os filtros em ordem de prioridade
  let filtered = candidates;
  
  // 1. Estado do sistema (mais importante)
  filtered = filterBySystemState(filtered, context.system.state);
  if (filtered.length === 0) return null;
  
  // 2. Estado da sessão
  filtered = filterBySession(filtered, context.session);
  if (filtered.length === 0) return null;
  
  // 3. Tempo (hora/dia)
  filtered = filterByTime(filtered, context.time);
  if (filtered.length === 0) return null;
  
  // 4. Requisitos de usuário
  filtered = filterByUserRequirements(filtered, context.user);
  if (filtered.length === 0) return null;
  
  // 5. Evitar repetição
  filtered = filterByRepetition(filtered);
  
  // Se todas foram filtradas por repetição, relaxa a regra
  if (filtered.length === 0) {
    filtered = filterByUserRequirements(
      filterByTime(
        filterBySession(
          filterBySystemState(candidates, context.system.state),
          context.session
        ),
        context.time
      ),
      context.user
    );
  }
  
  if (filtered.length === 0) return null;
  
  // Ordena por relevância
  const sorted = sortByRelevance(filtered, context);
  
  // Retorna a primeira (mais relevante)
  return sorted[0];
}

/**
 * Registra mensagem exibida no histórico
 * @param {Object} message 
 */
function recordMessageDisplay(message: ContextualMessage) {
  if (!message) return;

  _messageHistory.lastMessageId = message.id;
  _messageHistory.lastCategory = message.category;
  _messageHistory.displayCount[message.id] = (_messageHistory.displayCount[message.id] || 0) + 1;
  _messageHistory.sessionMessages.push({
    id: message.id,
    category: message.category,
    timestamp: Date.now()
  });
}

/**
 * Resolve a mensagem contextual
 * @param {Array} candidates - Mensagens candidatas do banco
 * @param {Object} customContext - Contexto customizado (opcional)
 * @returns {Object|null} Mensagem resolvida ou null
 */
export function resolve(candidates: ContextualMessage[], customContext: MessageContext | null = null) {
  try {
    // Constrói contexto (ou usa customizado)
    const context = customContext || buildContext();
    
    // Filtra apenas mensagens ativas
    const activeCandidates = (candidates || []).filter((msg: ContextualMessage) => msg.active !== false);
    
    // Se não há candidatas, retorna null (silêncio é experiência)
    if (activeCandidates.length === 0) {
      return null;
    }
    
    // Seleciona a melhor mensagem
    const selected = selectBestMessage(activeCandidates, context);
    
    if (!selected) {
      return null;
    }
    
    // Processa placeholders
    // @ts-expect-error strict migration — TS2345
    const processedText = parsePlaceholders(selected.message || selected.text, context);
    
    // Registra no histórico
    recordMessageDisplay(selected);
    
    // Retorna mensagem formatada
    return {
      id: selected.id,
      text: processedText,
      category: selected.category,
      priority: selected.priority || 50,
      key: selected.key || null
    };
  } catch (error: any) {
    // Falha segura: não quebra a tela
    console.debug('[ContextualMessageResolver] Error resolving message:', error.message);
    return null;
  }
}

/**
 * Resolve usando mensagens de fallback
 * @param {Object} context 
 * @returns {Object|null}
 */
export function resolveFallback(context: MessageContext | null = null) {
  const ctx = context || buildContext();
  return resolve(CONFIG.fallbackMessages, ctx);
}

/**
 * Limpa histórico de mensagens (útil para testes)
 */
export function clearHistory() {
  _messageHistory.lastMessageId = null;
  _messageHistory.lastCategory = null;
  _messageHistory.displayCount = {};
  _messageHistory.sessionMessages = [];
}

/**
 * Obtém estatísticas do histórico
 * @returns {Object}
 */
export function getStats() {
  return {
    lastMessageId: _messageHistory.lastMessageId,
    lastCategory: _messageHistory.lastCategory,
    totalDisplayed: _messageHistory.sessionMessages.length,
    displayCount: { ..._messageHistory.displayCount }
  };
}

export default {
  resolve,
  resolveFallback,
  clearHistory,
  getStats,
  buildContext
};
