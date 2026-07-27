// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Panel Home - API Service
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//
// PROVIDES:
//   fetchMessages() — exported function
//   clearCache() — exported function
//   refreshMessages() — exported function
//   getCacheStats() — exported function
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

import { CONFIG } from '../core/config.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-home.services.api';

/**
 * Cache de mensagens
 */
let _cache: { messages: Record<string, unknown>[] | null; timestamp: number } = {
  messages: null,
  timestamp: 0
};

/**
 * Verifica se o cache é válido
 * @returns {boolean}
 */
function isCacheValid() {
  if (!_cache.messages) return false;
  const elapsed = Date.now() - _cache.timestamp;
  return elapsed < CONFIG.api.cacheTime;
}

/**
 * Busca mensagens contextuais do backend
 * @returns {Promise<Array>}
 */
export async function fetchMessages() {
  // Retorna cache se válido
  if (isCacheValid()) {
    return _cache.messages;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.api.timeout);

    const response = await fetch(CONFIG.api.endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Normaliza resposta (pode vir como { messages: [] } ou direto [])
    const messages = Array.isArray(data) ? data : (data.messages || data.data || []);

    // Atualiza cache
    _cache.messages = messages;
    _cache.timestamp = Date.now();

    return messages;
  } catch (error: any) {
    // Em caso de erro, retorna cache antigo se existir, ou array vazio
    if (_cache.messages) {
      console.debug('[panel-home:api] Fetch failed, using stale cache:', error.message);
      return _cache.messages;
    }

    console.debug('[panel-home:api] Fetch failed, no cache available:', error.message);
    return [];
  }
}

/**
 * Limpa o cache de mensagens
 */
export function clearCache() {
  _cache.messages = null;
  _cache.timestamp = 0;
}

/**
 * Força refresh do cache
 * @returns {Promise<Array>}
 */
export async function refreshMessages() {
  clearCache();
  return fetchMessages();
}

/**
 * Retorna estatísticas do cache
 * @returns {Object}
 */
export function getCacheStats() {
  return {
    hasCache: !!_cache.messages,
    messageCount: _cache.messages?.length || 0,
    cacheAge: _cache.timestamp ? Date.now() - _cache.timestamp : null,
    isValid: isCacheValid()
  };
}

export default {
  fetchMessages,
  clearCache,
  refreshMessages,
  getCacheStats
};
