// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Contextual Message - Placeholder Parser
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TIME_PERIODS from ../../core/constants.js
//
// PROVIDES:
//   getGreeting() — exported function
//   getPeriodLabel() — exported function
//   getDayLabel() — exported function
//   parsePlaceholders() — exported function
//   requiresUserName() — exported function
//   listPlaceholders() — exported function
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

import { TIME_PERIODS } from '../../core/constants.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-home.domain.contextual-message.placeholder-parser';

/**
 * Labels para períodos do dia
 */
const PERIOD_LABELS = {
  [TIME_PERIODS.MORNING]: 'manhã',
  [TIME_PERIODS.AFTERNOON]: 'tarde',
  [TIME_PERIODS.EVENING]: 'noite',
  [TIME_PERIODS.NIGHT]: 'madrugada'
};

/**
 * Labels para dias da semana
 */
const DAY_LABELS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado'
];

/**
 * Saudações por período
 */
const GREETINGS = {
  [TIME_PERIODS.MORNING]: 'Bom dia',
  [TIME_PERIODS.AFTERNOON]: 'Boa tarde',
  [TIME_PERIODS.EVENING]: 'Boa noite',
  [TIME_PERIODS.NIGHT]: 'Boa noite'
};

/**
 * Obtém saudação baseada no período
 * @param {string} period 
 * @returns {string}
 */
export function getGreeting(period: string) {
  return (GREETINGS as Record<string, string>)[period] || 'Olá';
}

/**
 * Obtém label do período
 * @param {string} period 
 * @returns {string}
 */
export function getPeriodLabel(period: string) {
  return (PERIOD_LABELS as Record<string, string>)[period] || 'dia';
}

/**
 * Obtém label do dia da semana
 * @param {number} dayOfWeek 
 * @returns {string}
 */
export function getDayLabel(dayOfWeek: number) {
  return DAY_LABELS[dayOfWeek] || '';
}

/**
 * Processa placeholders em uma mensagem
 * @param {string} text - Texto com placeholders
 * @param {Object} context - Contexto com dados para substituição
 * @returns {string} Texto processado
 */
export function parsePlaceholders(text: string, context: { user?: { name?: string; role?: string }; time?: { period?: string; dayOfWeek?: number; hour?: number } }) {
  if (!text) return '';
  if (!context) return text;
  
  let result = text;
  
  // {nome} - Nome do usuário
  if (context.user?.name) {
    result = result.replace(/\{nome\}/gi, context.user.name);
  } else {
    // Remove placeholder se não tem nome
    result = result.replace(/,?\s*\{nome\}/gi, '');
    result = result.replace(/\{nome\},?\s*/gi, '');
  }
  
  // {saudacao} - Bom dia / Boa tarde / Boa noite
  if (context.time?.period) {
    result = result.replace(/\{saudacao\}/gi, getGreeting(context.time.period));
  }
  
  // {periodo} - manhã / tarde / noite
  if (context.time?.period) {
    result = result.replace(/\{periodo\}/gi, getPeriodLabel(context.time.period));
  }
  
  // {dia} - segunda-feira, terça-feira, etc
  if (context.time?.dayOfWeek !== undefined) {
    result = result.replace(/\{dia\}/gi, getDayLabel(context.time.dayOfWeek));
  }
  
  // {hora} - Hora atual
  if (context.time?.hour !== undefined) {
    result = result.replace(/\{hora\}/gi, context.time.hour.toString().padStart(2, '0'));
  }
  
  // {cargo} / {role} - Cargo do usuário
  if (context.user?.role) {
    result = result.replace(/\{cargo\}/gi, context.user.role);
    result = result.replace(/\{role\}/gi, context.user.role);
  } else {
    result = result.replace(/,?\s*\{cargo\}/gi, '');
    result = result.replace(/,?\s*\{role\}/gi, '');
  }
  
  // Limpa espaços extras resultantes de remoções
  result = result.replace(/\s{2,}/g, ' ').trim();
  
  // Capitaliza primeira letra se necessário
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

/**
 * Verifica se mensagem requer nome do usuário
 * @param {string} text 
 * @returns {boolean}
 */
export function requiresUserName(text: string) {
  if (!text) return false;
  return /\{nome\}/i.test(text);
}

/**
 * Lista todos os placeholders em uma mensagem
 * @param {string} text 
 * @returns {Array<string>}
 */
export function listPlaceholders(text: string) {
  if (!text) return [];
  const matches = text.match(/\{(\w+)\}/g) || [];
  return matches.map((m: string) => m.slice(1, -1).toLowerCase());
}

export default {
  parsePlaceholders,
  requiresUserName,
  listPlaceholders,
  getGreeting,
  getPeriodLabel,
  getDayLabel
};
